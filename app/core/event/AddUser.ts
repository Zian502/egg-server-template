import { Event, Inject } from '@eggjs/tegg';
import { EggLogger } from 'egg';
import { USER_ADD } from './index';
import { UserService } from '../service/UserService';

@Event(USER_ADD)
export class AddUser {
  @Inject()
  protected userService: UserService;

  @Inject()
  private readonly logger: EggLogger;

  async handle(username: string, password: string) {
    try {
      await this.userService.login(username, password);
    } catch (e) {
      e.message = `[AddUserHandler] ${e.message}`;
      this.logger.error(e);
    }
  }
}
