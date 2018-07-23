const debug = require('debuggler')();
const winston = require('winston');

debug('configuring logger');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf(i => `${i.timestamp} -> ${i.message.trim()}`),
      ),
      level: 'debug',
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
