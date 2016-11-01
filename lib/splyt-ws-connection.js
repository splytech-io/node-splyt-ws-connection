'use strict';

const WebSocket = require('ws');
const CoEventEmitter = require('@rainder/co-event-emitter');
const WSMessageHandler = require('@splytech-io/splyt-ws-message-handler');

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

    this.url = url;
    this.options = options;
    this.connectAttemp = 0;
    this[WS$] = this._connect();
    this.messageHandler = new WSMessageHandler({
      compress: true,
    });

    this.messageHandler.onPush = (method, data) => this.call('push', method, data);
    this.messageHandler.onRequest = (method, data) => this.call('request', method, data);
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
      this.messageHandler.incoming(ws, message);
    });

    return ws;
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
   * @param method
   * @param data
   * @returns {*}
   */
  request(method, data = {}) {
    return this.messageHandler.outgoing(this[WS$], {
      type: 'request',
      method,
      data,
    });
  }

  /**
   *
   * @param method
   * @param data
   * @returns {*}
   */
  push(method, data = {}) {
    return this.messageHandler.outgoing(this[WS$], {
      type: 'push',
      method,
      data,
    });
  }
};
