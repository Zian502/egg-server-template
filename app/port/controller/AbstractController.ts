import {
  Inject,
  EggContext,
} from '@eggjs/tegg';
import {
  EggLogger,
  EggAppConfig,
} from 'egg';
import { MiddlewareController } from '../middleware';
import { UserRoleManager } from '../UserRoleManager';
import { UserRepository } from '../../repository/UserRepository';
import { UserService } from '../../core/service/UserService';


export abstract class AbstractController extends MiddlewareController {
  @Inject()
  protected logger: EggLogger;
  @Inject()
  protected config: EggAppConfig;
  @Inject()
  protected userRoleManager: UserRoleManager;
  @Inject()
  protected userRepository: UserRepository;
  @Inject()
  protected userService: UserService;

  protected get sourceRegistry(): string {
    return this.config.cnpmcore.sourceRegistry;
  }

  protected get enableSyncAll() {
    return this.config.cnpmcore.syncMode === 'all';
  }

  protected setCDNHeaders(ctx: EggContext) {
    const config = this.config.cnpmcore;
    if (config.enableCDN) {
      ctx.set('cache-control', config.cdnCacheControlHeader);
      ctx.vary(config.cdnVaryHeader);
    }
  }
}
