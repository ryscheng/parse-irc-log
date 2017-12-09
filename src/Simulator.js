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
    let writePeriod = 86400000; //3600000 = 1hr
    let readPeriod = 1000;

    let writeUsers = {};     // { username => User }
    // Create users for writes
    this._stats.getUsers().forEach((u) => {
      writeUsers[u] = new User(u, writePeriod);
    });

    // Populate write schedule
    let messages = this._messages.map((msg) => {
      msg.startTime = msg.date.getTime();
      msg.postTime = writeUsers[msg.user].queue(msg.startTime);
      return msg;
    });
    
    // Sort on write schedule
    messages = messages.sort((a, b) => { return a.postTime - b.postTime; });

    let readUsers = {};
    // Create users for reads
    this._stats.getUsers().forEach((u) => {
      readUsers[u] = new User(u, readPeriod);
    });
    
    // Calculate read schedule
    // @TODO

    // Tell users we're done
    let lastTime = messages[messages.length - 1].postTime;
    let totalDummyWrite = 0;
    let totalRealWrite = 0;
    let totalDummyRead = 0;
    let totalRealRead = 0;
    Object.keys(writeUsers).forEach((u) => {
      writeUsers[u].finish(lastTime);
      totalDummyWrite += writeUsers[u].getDummy();
      totalRealWrite += writeUsers[u].getReal();
    });
    Object.keys(readUsers).forEach((u) => {
      readUsers[u].finish(lastTime);
      totalDummyRead += readUsers[u].getDummy();
      totalRealRead += readUsers[u].getReal();
    });

    console.log("Percentage Real Write");
    console.log(100.0 * totalRealWrite / (totalRealWrite + totalDummyWrite)); 
    console.log("Percentage Real Read");
    console.log(100.0 * totalRealRead / (totalRealRead + totalDummyRead)); 
  }

  processMessage(msg) {

    let subscribers = this._stats.getUsersForChannel(msg.channel);
    for (let i = 0; i < subscribers.length; i++) {
      this._users[subscribers[i]].queueRead(startTime, postTime);
    }
  }

}
module.exports = Simulator;
