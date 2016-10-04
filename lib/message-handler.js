'use strict';

const CONNECTION$ = Symbol();

module.exports = class MessageHandler {
  constructor(connection) {
    this[CONNECTION$] = connection;
  }

  /**
   *
   * @param message
   * @returns {*}
   */
  handle(message) {
    const payload = JSON.parse(message);

    if (payload.type === 'response') {
      return this._response(payload);
    }

    if (payload.type === 'request') {
      return this._request(payload);
    }

    if (payload.type === 'push') {
      return this._push(payload);
    }

    throw new Error(`Unknown message type specified: ${message.type}`);
  }

  /**
   *
   * @param id
   * @param method
   * @param data
   * @returns {boolean}
   * @private
   */
  _request({ id, method, data }) {
    this[CONNECTION$].emit('request', method, data, (err, result) => {
      this[CONNECTION$]._send({
        id: id,
        type: 'response',
        success: !err,
        data: err || result,
      });
    });
  }

  /**
   *
   * @param id
   * @param success
   * @param data
   * @private
   */
  _response({ id, success, data }) {
    const callback = this[CONNECTION$].callbacks.getCallback(id);

    if (!callback) {
      return;
    }

    if (success) {
      callback.resolve(data);
    } else {
      callback.reject(data);
    }
  }

  /**
   *
   * @param method
   * @param data
   * @private
   */
  _push({ method, data }) {
    this[CONNECTION$].emit('push', method, data);
  }
};
