"use strict";

const moment = require("moment");

class User {
  constructor(name, period) {
    this._name = name;
    this._period = period;
    this._last = null;
    this._countDummy = 0;
    this._countReal = 0;
  }

  getDummy() {
    return this._countDummy;
  }

  getReal() {
    return this._countReal;
  }

  // Return time it was actually posted
  queue(startTime) {
    // If first message
    if (this._last === null) {
      this._last = startTime;
      this._countReal++;
      return startTime;
    }

    // Dummy messages up to here
    for (let next = (this._last + this._period); next < startTime; next += this._period) {
      this._countDummy++;
      this._last = next;
    }

    // Write message
    this._last += this._period;
    this._countReal++;

    return this._last;
  }

  finish(time) {
    this.queue(time);
    this._countReal -= 1;
  }

}
module.exports = User;
