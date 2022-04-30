import { EggAppConfig, PowerPartial } from 'egg';
export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.orm = {
    client: 'mysql',
    database: process.env.MYSQL_DATABASE || 'test',
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'test123456',
    charset: 'utf8mb4',
  };
  if (process.env.DEBUG_LOCAL_SQL) {
    config.orm.logger = {
      // TODO: try to save SQL log into ctx logger or app logger
      logQuery(sql: string, duration: number) {
        console.log('[%sms] %s', duration, sql);
      },
    };
  }

  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: '',
      db: 0,
    },
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.cors = {
    // allow all domains
    origin: (ctx): string => {
      return ctx.get('Origin');
    },
    credentials: true,
  };


  // config.logger = {
  //   enablePerformanceTimer: true,
  // };

  config.logrotator = {
    // only keep 1 days log files
    maxDays: 1,
  };

  config.bodyParser = {
    // saveTag will send version string in JSON format
    strict: false,
  };

  return config;
};
