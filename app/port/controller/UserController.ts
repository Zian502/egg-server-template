import {
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  HTTPParam,
  HTTPBody,
  Context,
  EggContext,
} from '@eggjs/tegg';
import {
  UnprocessableEntityError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from 'egg-errors';
import { Static, Type } from '@sinclair/typebox';
import { AbstractController } from './AbstractController';
import { LoginResultCode } from '../../common/enum/User';
import { sha512 } from '../../common/UserUtil';

// body: {
//   _id: 'org.couchdb.user:dddd',
//   name: 'dddd',
//   password: '***',
//   type: 'user',
//   roles: [],
//   date: '2021-12-03T13:14:21.712Z'
// }
// create user will contains email
// {
//   _id: 'org.couchdb.user:awldj',
//   name: 'awldj',
//   password: '***',
//   email: 'ddd@dawd.com',
//   type: 'user',
//   roles: [],
//   date: '2021-12-03T13:46:30.644Z'
// }
const UserRule = Type.Object({
  type: Type.Literal('user'),
  // date: Type.String({ format: 'date-time' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
  email: Type.Optional(Type.String({ format: 'email' })),
});
type User = Static<typeof UserRule>;

@HTTPController()
export class UserController extends AbstractController {
  @HTTPMethod({
    path: '/-/user/org.couchdb.user::username',
    method: HTTPMethodEnum.PUT,
  })
  async loginOrCreateUser(@Context() ctx: EggContext, @HTTPParam() username: string, @HTTPBody() user: User) {
    ctx.tValidate(UserRule, user);
    if (username !== user.name) {
      throw new UnprocessableEntityError(`username(${username}) not match user.name(${user.name})`);
    }
    if (this.config.cnpmcore.allowPublicRegistration === false) {
      if (!this.config.cnpmcore.admins[user.name]) {
        throw new ForbiddenError('Public registration is not allowed');
      }
    }

    const result = await this.userService.login(user.name, user.password);
    if (result.code === LoginResultCode.Fail) {
      throw new UnauthorizedError('Please check your login name and password');
    }

    if (result.code === LoginResultCode.Success) {
      ctx.status = 201;
      return {
        ok: true,
        id: `org.couchdb.user:${result.user?.name}`,
        rev: result.user?.userId,
        token: result.token?.token,
      };
    }
    if (!user.email) {
      throw new NotFoundError(`User ${user.name} not exists`);
    }

    const { user: userEntity, token } = await this.userService.create({
      name: user.name,
      password: user.password,
      email: user.email,
      ip: ctx.ip,
    });
    ctx.status = 201;
    return {
      ok: true,
      id: `org.couchdb.user:${userEntity.name}`,
      rev: userEntity.userId,
      token: token.token,
    };
  }

  @HTTPMethod({
    path: '/-/user/token/:token',
    method: HTTPMethodEnum.DELETE,
  })
  async logout(@Context() ctx: EggContext, @HTTPParam() token: string) {
    const authorizedUserAndToken = await this.userRoleManager.getAuthorizedUserAndToken(ctx);
    if (!authorizedUserAndToken) return { ok: false };
    if (authorizedUserAndToken.token.tokenKey !== sha512(token)) {
      throw new UnprocessableEntityError('invalid token');
    }
    await this.userService.removeToken(authorizedUserAndToken.user.userId, token);
    return { ok: true };
  }

  @HTTPMethod({
    path: '/-/user/org.couchdb.user::username',
    method: HTTPMethodEnum.GET,
  })
  async showUser(@Context() ctx: EggContext, @HTTPParam() username: string) {
    const user = await this.userRepository.findUserByName(username);
    if (!user) {
      throw new NotFoundError(`User "${username}" not found`);
    }
    const authorized = await this.userRoleManager.getAuthorizedUserAndToken(ctx);
    return {
      _id: `org.couchdb.user:${user.name}`,
      name: user.name,
      email: authorized ? user.email : undefined,
    };
  }

  @HTTPMethod({
    path: '/-/test/v1/user',
    method: HTTPMethodEnum.GET,
  })
  async showProfile(@Context() ctx: EggContext) {
    const authorizedUser = await this.userRoleManager.requiredAuthorizedUser(ctx, 'read');
    return {
      // "tfa": {
      //   "pending": false,
      //   "mode": "auth-only"
      // },
      name: authorizedUser.name,
      email: authorizedUser.email,
      email_verified: false,
      created: authorizedUser.createdAt,
      updated: authorizedUser.updatedAt,
      // fullname: authorizedUser.name,
      // twitter: '',
      // github: '',
    };
  }

  @HTTPMethod({
    path: '/-/test/v1/user',
    method: HTTPMethodEnum.POST,
  })
  async saveProfile() {
    // Valid properties are: email, password, fullname, homepage, freenode, twitter, github
    // { email: 'admin@cnpmjs.org', homepage: 'fengmk2' }
    throw new ForbiddenError('npm profile set is not allowed');
  }
}
