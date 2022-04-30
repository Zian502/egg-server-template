import { EggAppConfig, PowerPartial } from 'egg';

export default (appInfo: EggAppConfig) => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.orm = {
    database: process.env.MYSQL_DATABASE || 'mysql_unittest',
  };
  return config;
};
