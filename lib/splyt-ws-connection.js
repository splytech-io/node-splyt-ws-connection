'use strict';

const co = require('co');
const bson = require('bson');
const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;
const defer = require('@rainder/defer');
const Callbacks = require('@rainder/callbacks');
const MessageHandler = require('./message-handler');

const WS$ = Symbol()

/**
 *
 */
module.exports = class SplytWSConnection extends EventEmitter {
  /**
   *
   * @param environment
   */
  constructor(url) {
    super();

    this.callbacks = new Callbacks(SplytWSConnection.name);

    this.url = url;
    this.stack = new Set();
    this[WS$] = this._connect();
    this.messageHandler = new MessageHandler(this);
  }

  /**
   *
   * @param method
   * @param data
   * @returns {*}
   * @private
   */
  *_request(method, data) {
    const id = new bson.ObjectId().toString();

    yield this._send({
      id,
      method,
      type: 'request',
      data: data,
    });

    return yield this.callbacks.create(id);
  }

  /**
   *
   * @param method
   * @param data
   * @returns {*}
   * @private
   */
  *_push(method, data) {
    return yield this._send({
      method,
      type: 'push',
      data: data,
    });
  }

  /**
   *
   * @param url
   * @private
   */
  _connect() {
    const ws = new WebSocket(this.url, {
      protocol: 'splyt-protocol',
      perMessageDeflate: false,
      headers: {
        'x-origin': 'splyt-ws-connection',
      },
    });

    ws.on('open', () => {
      ws._socket
        .setKeepAlive(true, 5000)
        .setNoDelay(true);

      this._flush();
      this.emit('connect', this.url);
    });

    ws.on('close', () => {
      this.emit('disconnect');
      setTimeout(() => this[WS$] = this._connect(this.url), 1000);
    });

    ws.on('message', (message) => {
      this.messageHandler.handle(message);
    });

    return ws;
  }

  /**
   *
   */
  _flush() {
    for (const item of this.stack.values()) {
      this[WS$].send(JSON.stringify(item.payload), (err) => {
        if (!err) {
          item.resolve(this.stack.delete(item));
        }
      });
    }
  }

  /**
   *
   * @param payload
   * @returns {Promise}
   */
  _send(payload) {
    const dfd = defer();

    dfd.payload = payload;
    this.stack.add(dfd);
    this._flush();

    return dfd.promise;
  }

  /**
   *
   * @param method
   * @param data
   * @returns {*}
   */
  request(method, data = {}) {
    return co(this._request(method, data));
  }

  /**
   *
   * @param method
   * @param data
   * @returns {*}
   */
  push(method, data = {}) {
    return co(this._push(method, data));
  }
};
