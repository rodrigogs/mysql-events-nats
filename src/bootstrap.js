const MySQLEvents = require('@rodrigogs/mysql-events');
const async = require('async');
const Env = require('../config/Env');
const logger = require('../config/logger');
const { NATSManager } = require('../lib');

const bootstrap = async () => {
  const mysqlEvents = new MySQLEvents({
    host: 'localhost',
    user: 'root',
    password: 'root',
  }, {
    // startAtEnd: true,
    excludedSchemas: {
      mysql: true,
    },
  });

  const nats = new NATSManager(Env.NATS_URL, { json: true });

  nats.on('error', (err) => {
    logger.error(err);
  });

  nats.on('connect', () => {
    logger.info('nats connected');
  });

  nats.on('disconnect', () => {
    logger.warn('nats disconnected');
  });

  nats.on('reconnecting', () => {
    logger.info('nats reconnecting');
  });

  nats.on('reconnect', () => {
    logger.info('nats reconnected');
  });

  nats.on('close', () => {
    logger.info('close');
  });

  mysqlEvents.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
  mysqlEvents.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
  mysqlEvents.on(MySQLEvents.EVENTS.TRIGGER_ERROR, console.error);

  await mysqlEvents.start();
  await nats.waitForConnection();

  let drainQueue = false;
  let nextPosition = null;

  const eventsQueue = async.queue(async (event) => {
    logger.info(`${eventsQueue.length()} events in queue`);
    return nats.publish('EVERYTHING', JSON.stringify(event));
  }, 20);

  eventsQueue.drain = async () => {
    logger.info('Queue drained');
    if (drainQueue) {
      drainQueue = false;
      try {
        await mysqlEvents.start({ binlogNextPos: nextPosition, startAtEnd: false });
        logger.info('Reading binlog events');
      } catch (err) {
        logger.error(`Error restart binlog events: ${err.message}`);
      }
    }
  };

  const handleQueue = async (event) => {
    nextPosition = event.nextPosition;
    eventsQueue.push(event);

    if (drainQueue) return;

    if (eventsQueue.length() > 15000) {
      logger.info('Waiting for event queue to drain current events');
      drainQueue = true;
      await mysqlEvents.stop();
    }
  };

  mysqlEvents.addTrigger({
    name: 'EVERYTHING',
    expression: '*',
    statement: MySQLEvents.STATEMENTS.ALL,
    callback: handleQueue,
  });

  let counter = 0;
  nats.subscribe('EVERYTHING', () => {
    counter += 1;
    logger.info(`Processed events: ${counter}`);
  });
};

module.exports = bootstrap;
