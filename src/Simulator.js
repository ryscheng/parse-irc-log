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
    let totalLatency = 0;
    messages.forEach((msg) => {
      let subscribers = this._stats.getUsersForChannel(msg.channel);
      subscribers.forEach(function (msg, subscriber) {
        let readTime = readUsers[subscriber].queue(msg.postTime);
        totalLatency += (readTime - msg.startTime);
        //console.log((readTime - msg.startTime)/1000);
        //this._users[subscribers[i]].queueRead(startTime, postTime);
      }.bind(this, msg));
    });

    // Tell users we're done + calculate final stats
    let lastTime = messages[messages.length - 1].startTime;
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

    console.log("-----------");
    console.log(totalDummyWrite);
    console.log(totalRealWrite);
    console.log(totalDummyRead);
    console.log(totalRealRead);
    console.log(totalLatency);
    console.log("-----------");

    console.log("Percentage Real Write");
    console.log((100.0 * totalRealWrite / (totalRealWrite + totalDummyWrite)) + "%"); 
    console.log("Percentage Real Read");
    console.log((100.0 * totalRealRead / (totalRealRead + totalDummyRead)) + "%"); 
    console.log("Average E2E Latency (s)");
    console.log(totalLatency / (totalRealRead * 1000.0));
  }

}
module.exports = Simulator;
