const path = require('path');

/**
 * @see https://github.com/motdotla/dotenv#usage
 */
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: path.resolve(__filename, '../../.env') });
} else {
  require('dotenv').config({ path: path.resolve(__filename, `../../.env.${process.env.NODE_ENV}`) });
}

/**
 * @class Env
 */
class Env {
  /**
   * Application context.
   *
   * @default 'development'
   * @return {String}
   */
  static get NODE_ENV() {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * @default 'mysql://localhost:3306/mysql-events'
   * @return {String}
   */
  static get MYSQL_HOST() {
    return process.env.MYSQL_HOST || 'localhost';
  }

  /**
   * @default 3306
   * @return {Number}
   */
  static get MYSQL_PORT() {
    return Number(process.env.MYSQL_PORT || 3306);
  }

  /**
   * @return {String}
   */
  static get MYSQL_USER() {
    return process.env.MYSQL_USER;
  }

  /**
   * @return {String}
   */
  static get MYSQL_PASSWORD() {
    return process.env.MYSQL_PASSWORD;
  }

  /**
   * @see https://github.com/nats-io/node-nats#connect-options
   * @default 'nats://localhost:4222'
   * @return {String}
   */
  static get NATS_URL() {
    return process.env.NATS_URL || 'nats://localhost:4222';
  }
}

module.exports = Env;
