"use strict";

const moment = require("moment");

class User {
  constructor(name, channelList) {
    this._name = name;
    this._channels = channelList;
    this._lastWrite = null;
    this._lastRead = null;
  }

  queueWrite(writeDate) {

    return Promise.resolve();
  }

  queueRead(writeDate) {
  }

  finish() {
  }

}
module.exports = User;
