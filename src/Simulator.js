"use strict";

const User = require("./User");
const Stats = require("./Stats");

class Simulator {
  constructor(messages, stats) {
    this._messages = messages.slice();
    if (stats === null ||
       typeof stats === "undefined") {
      this._stats = new Stats(messages);
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
  run(writePeriod, readPeriod) {
    /** SCHEDULE WRITES **/
    // Create users for writes
    let writeUsers = {};     // { username => User }
    this._stats.getUsers().forEach((u) => {
      writeUsers[u] = new User(u, writePeriod);
    });

    // Populate write schedule
    let messages = this._messages.map((msg) => {
      let newMsg = JSON.parse(JSON.stringify(msg));
      newMsg.startTime = msg.date.getTime();
      newMsg.postTime = writeUsers[newMsg.user].queue(newMsg.startTime);
      return newMsg;
    });
    
    // Sort on write schedule
    messages = messages.sort((a, b) => { return a.postTime - b.postTime; });

    /** SCHEDULE READS **/
    // Create users for reads
    let readUsers = {};     // { username => User }
    this._stats.getUsers().forEach((u) => {
      readUsers[u] = new User(u, readPeriod);
    });
    
    // Calculate read schedule
    let total = {
      latency: 0,
      dummyWrite: 0,
      realWrite: 0,
      dummyRead: 0,
      realRead:0,
    }
    messages.forEach((msg) => {
      let subscribers = this._stats.getUsersForChannel(msg.channel);
      subscribers.forEach(function (msg, subscriber) {
        let readTime = readUsers[subscriber].queue(msg.postTime);
        total.latency += (readTime - msg.startTime);
        //console.log((readTime - msg.startTime)/1000);
        //this._users[subscribers[i]].queueRead(startTime, postTime);
      }.bind(this, msg));
    });

    // Tell users we're done + calculate final stats
    let lastTime = messages[messages.length - 1].startTime;
    Object.keys(writeUsers).forEach((u) => {
      writeUsers[u].finish(lastTime);
      total.dummyWrite += writeUsers[u].getDummy();
      total.realWrite += writeUsers[u].getReal();
    });
    Object.keys(readUsers).forEach((u) => {
      readUsers[u].finish(lastTime);
      total.dummyRead += readUsers[u].getDummy();
      total.realRead += readUsers[u].getReal();
    });

    return total;
  }

}
module.exports = Simulator;
