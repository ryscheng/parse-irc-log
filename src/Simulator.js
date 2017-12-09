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
    this._sortMessages();
  }

  /***************
   * PRIVATE METHODS
   ***************/
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
    let writeUsers = {};     // { username => User }
    let writePeriod = 1000;
    // Create users for writes
    this._stats.getUsers().forEach((u) => {
      writeUsers[u] = new User(u, writePeriod)
    });

    // Populate write schedule
    let messages = this._messages.map((msg) => {
      msg.startTime = msg.date.getTime();
      msg.postTime = writeUsers[msg.user].queue(msg.startTime);
      return msg;
    });
    
    // Sort on write schedule
    messages = messages.sort((a, b) => { return a.postTime - b.postTime; });

    // Tell users we're done
    Object.keys(writeUsers).forEach((u) => {
      writeUsers[u].finish();
    });
  }

  processMessage(msg) {

    let subscribers = this._stats.getUsersForChannel(msg.channel);
    for (let i = 0; i < subscribers.length; i++) {
      this._users[subscribers[i]].queueRead(startTime, postTime);
    }
  }

}
module.exports = Simulator;
