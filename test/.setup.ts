import { mock } from 'egg-mock/bootstrap';
import { TestUtil } from './TestUtil';

beforeEach(async () => {
  TestUtil.app.loggers.disableConsole();
  await TestUtil.app.redis.flushdb('sync');
});

afterEach(async () => {
  mock.restore();
  await TestUtil.truncateDatabase();
});
