import {
  AccessLevel,
  ContextProto,
  Inject,
  EggContext,
} from '@eggjs/tegg';
import { EggAppConfig, EggLogger } from 'egg';
import { UnauthorizedError, ForbiddenError } from 'egg-errors';
import { UserRepository } from '../repository/UserRepository';
import { User as UserEntity } from '../core/entity/User';
import { Token as TokenEntity } from '../core/entity/Token';
import { sha512 } from '../common/UserUtil';

// https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-tokens-on-the-website
type TokenRole = 'read' | 'publish' | 'setting';

@ContextProto({
  // only inject on port module
  accessLevel: AccessLevel.PRIVATE,
})
export class UserRoleManager {
  @Inject()
  private readonly userRepository: UserRepository;
  @Inject()
  private readonly config: EggAppConfig;
  @Inject()
  protected logger: EggLogger;

  private handleAuthorized = false;
  private currentAuthorizedUser: UserEntity;
  private currentAuthorizedToken: TokenEntity;

  // {
  //   'user-agent': 'npm/8.1.2 node/v16.13.1 darwin arm64 workspaces/false',
  //   'npm-command': 'adduser',
  //   authorization: 'Bearer 379f84d8-ba98-480b-909e-a8260af3a3ee',
  //   'content-type': 'application/json',
  //   accept: '*/*',
  //   'content-length': '166',
  //   'accept-encoding': 'gzip,deflate',
  //   host: 'localhost:7001',
  //   connection: 'keep-alive'
  // }
  public async getAuthorizedUserAndToken(ctx: EggContext) {
    if (this.handleAuthorized) {
      if (!this.currentAuthorizedUser) return null;
      return {
        token: this.currentAuthorizedToken,
        user: this.currentAuthorizedUser,
      };
    }

    this.handleAuthorized = true;
    const authorization = ctx.get('authorization');
    if (!authorization) return null;
    const matchs = /^Bearer ([\w\.]+?)$/.exec(authorization);
    if (!matchs) return null;
    const tokenValue = matchs[1];
    const tokenKey = sha512(tokenValue);
    const authorizedUserAndToken = await this.userRepository.findUserAndTokenByTokenKey(tokenKey);
    if (authorizedUserAndToken) {
      this.currentAuthorizedToken = authorizedUserAndToken.token;
      this.currentAuthorizedUser = authorizedUserAndToken.user;
      ctx.userId = authorizedUserAndToken.user.userId;
    }
    return authorizedUserAndToken;
  }

  public async requiredAuthorizedUser(ctx: EggContext, role: TokenRole) {
    const authorizedUserAndToken = await this.getAuthorizedUserAndToken(ctx);
    if (!authorizedUserAndToken) {
      const authorization = ctx.get('authorization');
      const message = authorization ? 'Invalid token' : 'Login first';
      throw new UnauthorizedError(message);
    }
    const { user, token } = authorizedUserAndToken;
    if (role === 'publish') {
      if (token.isReadonly) {
        throw new ForbiddenError(`Read-only Token "${token.tokenMark}" can't publish`);
      }
      // only support npm >= 7.0.0 allow publish action
      // user-agent: "npm/6.14.12 node/v10.24.1 darwin x64"
      const m = /npm\/(\w{1,1000}\.)/.exec(ctx.get('user-agent'));
      if (!m) {
        throw new ForbiddenError('Only allow npm client to access');
      }
      const major = parseInt(m[1]);
      if (major < 7) {
        throw new ForbiddenError('Only allow npm@>=7.0.0 client to access');
      }
    }
    if (role === 'setting') {
      if (token.isReadonly) {
        throw new ForbiddenError(`Read-only Token "${token.tokenMark}" can't setting`);
      }
      if (token.isAutomation) {
        throw new ForbiddenError(`Automation Token "${token.tokenMark}" can't setting`);
      }
    }
    return user;
  }

  public async isAdmin(ctx: EggContext) {
    const authorizedUserAndToken = await this.getAuthorizedUserAndToken(ctx);
    if (!authorizedUserAndToken) return false;
    const { user, token } = authorizedUserAndToken;
    if (token.isReadonly) return false;
    return user.name in this.config.cnpmcore.admins;
  }
}
