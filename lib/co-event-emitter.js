'use strict';

const co = require('co');

module.exports = class CoEventEmitter {
  constructor() {
    this._events = {};
  }

  /**
   *
   * @param eventName
   * @param cb
   */
  on(eventName, cb) {
    this._events[eventName] = cb;
    
    return this;
  }

  /**
   *
   * @param eventName
   * @param args
   * @returns {boolean}
   */
  emit(eventName, ...args) {
    if (!Reflect.apply(Object.prototype.hasOwnProperty, this._events, [eventName])) {
      return false;
    }

    return co(this._events[eventName](...args));
  }
};
