CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `gmt_create` datetime(3) NOT NULL COMMENT 'create time',
  `gmt_modified` datetime(3) NOT NULL COMMENT 'modified time',
  `user_id` varchar(24) NOT NULL COMMENT 'user id',
  `name` varchar(100) NOT NULL COMMENT 'user name',
  `email` varchar(400) NOT NULL COMMENT 'user email',
  `password_salt` varchar(100) NOT NULL COMMENT 'password salt',
  `password_integrity` varchar(512) NOT NULL COMMENT 'password integrity',
  `ip` varchar(100) NOT NULL COMMENT 'user login request ip',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='user info';