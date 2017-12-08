"use strict";

const User = require("./User");
const Stats = require("./Stats");

class Simulator {
  constructor(messages, stats) {
    this._messages = messages;
    if (stats === null ||
       typeof stats === "undefined") {
      this._stats = new Stats();
      this._stats.processMessageArray(messages);
    } else {
      this._stats = stats;
    }
    this._users = {};     // { username => User }
    this._setup();
  }

  /***************
   * PRIVATE METHODS
   ***************/
  _setup() {
    // Create users
    this._users = {};
    let usernames = this._stats.getUsers();
    for (let i = 0; i < usernames.length; i++) {
      let u = usernames[i];
      let chan = this._stats.getChannelsForUser(u);
      this._users[u] = new User(u, chan);
    }

    // Sort messages 
    this._sortMessages();
  }

  _sortMessages() {
    function compare(a, b) {
      if (a.date < b.date) {
        return -1;
      } else if (a.date > b.date) {
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
    for (let i = 0; i < this._messages.length; i++) {
      let msg = this._messages[i];
      this.processMessage(msg);
    }
  }

  processMessage(msg) {
    let user = msg.user;
    let date = msg.date;
    let subscribers = this._stats.getUsersForChannel(msg.channel);

  }

}
module.exports = Simulator;
