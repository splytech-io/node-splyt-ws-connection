'use strict';

const bson = require('bson');
const WebSocket = require('ws');
const CoEventEmitter = require('@rainder/co-event-emitter');
const defer = require('@rainder/defer');
const Callbacks = require('@rainder/callbacks');
const MessageHandler = require('./message-handler');

const WS$ = Symbol();

/**
 *
 */
module.exports = class SplytWSConnection extends CoEventEmitter {

  /**
   *
   * @param url {String} wss://splytech.io
   * @param options {{access_token}} Options object
   */
  constructor(url, options = {}) {
    super();

    this.callbacks = new Callbacks(SplytWSConnection.name);

    this.url = url;
    this.options = options;
    this.connectAttemp = 0;
    this.stack = new Set();
    this[WS$] = this._connect();
    this.messageHandler = new MessageHandler(this);
  }

  /**
   *
   * @returns {*}
   */
  getWebSocket() {
    return this[WS$];
  }

  /**
   *
   * @param url
   * @private
   */
  _connect() {
    this.connectAttemp++;

    const headers = { 'origin': 'splyt-ws-connection' };

    if (this.options.access_token) {
      headers['x-access-token'] = this.options.access_token;
    }

    const ws = new WebSocket(this.url, {
      protocol: 'splyt-protocol',
      perMessageDeflate: false,
      headers,
    });

    ws.on('open', () => {
      this.connectAttemp = 0;

      ws._socket
        .setKeepAlive(true, 5000)
        .setNoDelay(true);

      this._flush();
      this.emit('connect', this.url);
    });

    ws.on('close', () => {
      this.emit('disconnect');
      this._reconnect();
    });

    ws.on('error', (err) => {
      this.emit('error', err);
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
   * @private
   */
  _reconnect() {
    const timeout = Math.min(Math.pow(this.connectAttemp, 2) * 10, 10000);
    const fn = () => this[WS$] = this._connect(this.url);

    this.emit('reconnect');
    setTimeout(fn, timeout);
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
    const id = new bson.ObjectId().toString();

    return this._send({
      id,
      method,
      type: 'request',
      data: data,
    }).then(() => this.callbacks.create(id));
  }

  /**
   *
   * @param method
   * @param data
   * @returns {*}
   */
  push(method, data = {}) {
    return this._send({
      method,
      type: 'push',
      data: data,
    });
  }
};
