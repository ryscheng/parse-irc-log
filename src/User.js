"use strict";

const moment = require("moment");

class User {
  constructor(name, channelList) {
    this._name = name;
    this._channels = channelList;
  }

}
module.exports = User;
