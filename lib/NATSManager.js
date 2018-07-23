const NATS = require('nats');
const { EventEmitter } = require('events');

/**
 * @class NATSManager
 * @param {Object|String} url
 * @param {Object} [options = {}]
 */
class NATSManager extends EventEmitter {
  constructor(url, options = {}) {
    super();

    if (typeof url === 'string') {
      options = Object.assign({ url }, options);
    } else if (typeof url === 'object') {
      options = url;
    }

    this.nats = NATS.connect(options);

    this.connected = false;
    this.reconnecting = false;

    this.nats.on('connect', (...args) => {
      this.connected = true;
      this.emit('connect', ...args);
    });

    this.nats.on('disconnect', (...args) => {
      this.connected = false;
      this.emit('disconnect', ...args);
    });

    this.nats.on('reconnecting', (...args) => {
      this.reconnecting = true;
      this.emit('reconnecting', ...args);
    });

    this.nats.on('reconnect', (...args) => {
      this.connected = true;
      this.reconnecting = false;
      this.emit('reconnect', ...args);
    });

    this.on('close', (...args) => {
      this.connected = false;
      this.reconnecting = false;
      this.emit('close', ...args);
    });
  }

  /**
   * @return {Promise<void>}
   */
  async waitForConnection() {
    if (this.connected) return;

    await new Promise((resolve, reject) => {
      this.nats.once('connect', resolve);
      this.nats.once('error', reject);
    });
  }

  /**
   * @return {Promise<void>}
   */
  async disconnect() {
    if (!this.connected && !this.reconnecting) return;

    await new Promise((resolve, reject) => {
      this.nats.close();
      this.nats.once('close', resolve);
      this.nats.once('error', reject);
    });
  }

  /**
   * @param subject
   * @param msg
   * @param optReply
   * @return {Promise<any>}
   */
  publish(subject, msg, optReply) {
    return new Promise((resolve, reject) => {
      this.nats.publish(subject, msg, optReply, (result) => {
        if (result instanceof NATS.NatsError) return reject(result);
        resolve();
      });
    });
  }

  /**
   * @param subject
   * @param opts
   * @param callback
   * @return {Number}
   */
  subscribe(subject, opts, callback) {
    return this.nats.subscribe(subject, opts, callback);
  }

  /**
   * @param sid
   * @param optMax
   */
  unsubscribe(sid, optMax) {
    return this.nats.unsubscribe(sid, optMax);
  }

  /**
   * @param subject
   * @param optMsg
   * @param optOptions
   * @return {Promise<any>}
   */
  request(subject, optMsg, optOptions) {
    return new Promise((resolve, reject) => {
      this.nats.request(subject, optMsg, optOptions, (response) => {
        if (response instanceof NATS.NatsError) {
          return reject(response);
        }
        resolve(response);
      });
    });
  }

  /**
   * @param subject
   * @param optMsg
   * @param optOptions
   * @param timeout
   * @return {Promise<any>}
   */
  requestOne(subject, optMsg, optOptions, timeout) {
    return new Promise((resolve, reject) => {
      this.nats.request(subject, optMsg, optOptions, timeout, (response) => {
        if (response instanceof NATS.NatsError) {
          return reject(response);
        }
        resolve(response);
      });
    });
  }

  /**
   * @return {Promise<void>}
   */
  flush() {
    return new Promise((resolve) => {
      this.nats.flush(resolve);
    });
  }

  timeout(sid, timeout, expected) {
    return new Promise((resolve) => {
      this.nats.timeout(sid, timeout, expected, resolve);
    });
  }
}

module.exports = NATSManager;
