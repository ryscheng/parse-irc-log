"use strict";

const User = require("./User");
const Stats = require("./Stats");

class Simulator {
  constructor(messages) {
    this._messages = messages;
    this._stats = new Stats();
    this._stats.processMessageArray(messages);
    this._users = {};     // { username => User }
    this._setup();
  }

  /***************
   * PRIVATE METHODS
   ***************/
  _setup() {
    this._users = {};
    let usernames = this._stats.getUsers();
    for (let i = 0; i < usernames.length; i++) {
      let u = usernames[i];
      let chan = this._stats.getChannels(u);
      this._users[u] = new User(u, chan);
    }
  }

  _sortMessages() {
    function compare(a, b) {
      if (a.time < b.time) {
        return -1;
      } else if (a.time > b.time) {
        return 1;
      }
      return 0;
    }
    this._messages.sort(compare);
  }

  /***************
   * PUBLIC METHODS
   ***************/
  run() {
    this._sortMessages();
    for (let i = 0; i < this._messages.length; i++) {
      let msg = this._messages[i];
      this.processMessage(msg);
    }
  }

  processMessage(msg) {
    
  }

}
module.exports = Simulator;
