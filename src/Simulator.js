"use strict";

const User = require("./User");

class Simulator {
  constructor(parser) {
    this._parser = parser;
    this._users = {};     // { username => User }
    this._setup();
  }

  /***************
   * PRIVATE METHODS
   ***************/
  _setup() {
    this._users = {};
    let usernames = this._parser.getUsers();
    for (let i = 0; i < usernames.length; i++) {
      let u = usernames[i];
      let chan = this._parser.getChannels(u);
      this._users[u] = new User(u, chan);
    }
  }

  /***************
   * PUBLIC METHODS
   ***************/
  playMessages() {
    this._parser.sortMessages();
    let messages = this._parser.getMessages();
  }

}
module.exports = Simulator;
