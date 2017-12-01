"use strict";

const fs = require("fs");
const path = require("path");
const Q = require("q");

class ParseIRC {
  constructor(name) {
    this._name = name;
    this._errors = [];
    this._stats = {
      msgCount: {},
      msgs: [],
      fileCount: 0,
    };
  }

  /*********************
   * PRIVATE
   *********************/
  _errHandler(err) {
    console.error("Error: " + err);
    this._errors.push(err);
  }

  /*********************
   * PUBLIC GETTERS
   *********************/

  merge(p) {
    this._name += ";" + p.getName();
    this._errors = this._errors.concat(p.getErrors);
    let s = p.getStats();

    for (let user in s.msgCount) {
      for (let channel in s.msgCount[user]) {
        let count = s.msgCount[user][channel];
        this.addMsgCount(user, channel, count);
      }
    }
    this._stats.msgs = this._stats.msgs.concat(s.msgs)
    this._stats.fileCount += s.fileCount;
  }

  getName() {
    return this._name;
  }

  getErrors() {
    return this._errors;
  }

  getStats() {
    return this._stats;
  }
  
  getFileCount() {
    return this._stats.fileCount;
  }

  getAverageSubscriptions() {
    let top = 0.0;
    let bot = 0.0;
    for (let k1 in this._stats.msgCount) {
      bot += 1;
      for (let k2 in this._stats.msgCount[k1]) {
        top += 1;
      }
    }
    return top/bot;
  }

  countTotalMessages() {
    let result = 0;
    for (let k1 in this._stats.msgCount) {
      for (let k2 in this._stats.msgCount[k1]) {
        result += this._stats.msgCount[k1][k2];
      }
    }
    return result;
  }

  countTotalUsers() {
    return Object.keys(this._stats.msgCount).length;
  }

  sortMessages() {
    function compare(a, b) {
      if (a.time < b.time) {
        return -1;
      } else if (a.time > b.time) {
        return 1;
      }
      return 0;
    }
    this._stats.msgs.sort(compare);
    //console.log(this._stats.msgs);
  }

  /*********************
   * PUBLIC PROCESSING
   *********************/

  processDir(dir) {
    return Q.nfapply(fs.readdir, [ dir ]).then(function(dir, files) {
      //console.log(dir);
      //console.log(files);
      let promises = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].endsWith(".txt")) {
          promises.push(this.processFile(dir, files[i]));
        }
      }
      return Promise.all(promises);
    }.bind(this, dir));
  }

  processFile(dir, file) {
    //console.log(filepath);
    return Q.nfapply(fs.readFile, [ path.join(dir, file) ]).then(function(channel, data) {
      let parsed = null;
      let lines = data.toString().split("\n");
      //console.log(lines);
      for (let i = 0; i < lines.length; i++) {
        parsed = this.processLine(lines[i]);
        if (parsed !== null) {
          parsed.channel = channel;
          this.processParsed(parsed);
        }
      }
      this._stats.fileCount++;
      return Promise.resolve();
    }.bind(this, file));
  }

  processLine(line) {
    let result = null;
    line = line.trim();
    if (line.length === 0) {
      // empty line
      return null;
    } 

    result = this.processEvent(line);
    if (result !== null) {
      return result;
    }
    
    result = this.processAction(line);
    if (result !== null) {
      return result;
    }

    result = this.processMsg(line);
    if (result !== null) {
      return result;
    }

    console.log("Malformed line: " + line);
    return null;
  }
  
  processEvent(line) {
    if (line.substr(0,3) !== "===") {
      return null;
    }
    // @todo ignoring events
    //console.log("Event: " + line);
    return {
      code: "ignore",
    };
  }

  processAction(line) {
    if (line.indexOf("[") !== 0 ||
        line.indexOf("]") !== 6) {
      return null;
    }
    if (line.indexOf("*") !== 9) {
      return null;
    }
    let time = line.substring(1, 6);
    line = line.substr(line.indexOf("*")+1).trim();
    let end = line.indexOf(" ");
    let user = line.substring(0, end);
    let msg = line.substring(end).trim();
    return {
      time: time,
      user: user,
      message: msg,
    };
  }

  processMsg(line) {
    if (line.indexOf("[") !== 0 ||
        line.indexOf("]") !== 6) {
      return null;
    }
    if (line.indexOf("<") === -1 ||
       line.indexOf(">") === -1) {
      return null 
    }
    let time = line.substring(1, 6);
    let i = line.indexOf("<")+1;
    let end = line.indexOf(">");
    let user = line.substring(i, end);
    let msg = line.substring(end+1).trim();
    return {
      time: time,
      user: user,
      message: msg,
    };
  }

  addMsgCount(user, channel, count) {
    if (this._stats.msgCount.hasOwnProperty(user)) {
      if (this._stats.msgCount[user].hasOwnProperty(channel)) {
        this._stats.msgCount[user][channel] += count;
      } else {
        this._stats.msgCount[user][channel] = count;
      }
    } else {
      this._stats.msgCount[user] = {};
      this._stats.msgCount[user][channel] = count;
    }
  }

  processParsed(data) {
    //console.log(data);
    // Explicit ignores
    if (data.code === "ignore") {
      return;
    }

    // Message log
    this._stats.msgs.push(data);

    // Per (user,channel) counts
    this._addMsgCount(data.user, data.channel, 1);
  }

}

module.exports = ParseIRC;
