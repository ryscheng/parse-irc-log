"use strict";

const fs = require("fs");
const path = require("path");
const Q = require("q");

class ParseIRC {
  constructor(name) {
    this._name = name;
    this._stats = {
      msgCount: {},
      fileCount: 0,
    };
    this._errors = [];
  }

  _errHandler(err) {
    console.error("Error: " + err);
    this._errors.push(err);
  }

  getStats() {
    return this._stats;
  }
  
  getErrors() {
    return this._errors;
  }

  processDir(dir) {
    return Q.nfapply(fs.readdir, [ dir ]).then(function(dir, files) {
      //console.log(dir);
      //console.log(files);
      let promises = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].endsWith(".txt")) {
          promises.push(this.processFile(path.join(dir, files[i])));
        }
      }
      return Promise.all(promises);
    }.bind(this, dir));
  }

  processFile(filepath) {
    //console.log(filepath);
    return Q.nfapply(fs.readFile, [ filepath ]).then((data) => {
      let lines = data.toString().split("\n");
      //console.log(lines);
      for (let i = 0; i < lines.length; i++) {
        this.processLine(lines[i]);
      }
      this._stats.fileCount++;
      return Promise.resolve();
    });
  }

  processLine(line) {
    line = line.trim();
    if (line.length === 0) {
      // empty line
      return;
    } else if (this.processEvent(line)) {
      return;
    } else if (this.processAction(line)) {
      return;
    } else if (this.processMsg(line)) {
      return;
    } else {
      console.log("Malformed line: " + line);
    }
  }
  
  processEvent(line) {
    if (line.substr(0,3) !== "===") {
      return false;
    }
    // @todo ignoring events
    //console.log("Event: " + line);
    return true;
  }

  processAction(line) {
    if (line.indexOf("[") !== 0 ||
        line.indexOf("]") !== 6) {
      return false;
    }
    if (line.indexOf("*") !== 9) {
      return false;
    }
    let time = line.substring(1, 6);
    line = line.substr(line.indexOf("*")+1).trim();
    let end = line.indexOf(" ");
    let user = line.substring(0, end);
    let msg = line.substring(end).trim();
    this.processParsed({
      time: time,
      user: user,
      message: msg,
    });
    return true;
  }

  processMsg(line) {
    if (line.indexOf("[") !== 0 ||
        line.indexOf("]") !== 6) {
      return false;
    }
    if (line.indexOf("<") === -1 ||
       line.indexOf(">") === -1) {
      return false
    }
    let time = line.substring(1, 6);
    let i = line.indexOf("<")+1;
    let end = line.indexOf(">");
    let user = line.substring(i, end);
    let msg = line.substring(end+1).trim();
    this.processParsed({
      time: time,
      user: user,
      message: msg,
    });
    return true;
  }

  processParsed(data) {
    //console.log(data);
    if (this._stats.msgCount.hasOwnProperty(data.user)) {
      this._stats.msgCount[data.user]++;
    } else {
      this._stats.msgCount[data.user] = 1;
    }
  }

  getFileCount() {
    return this._stats.fileCount;
  }

  countTotalMessages() {
    let result = 0;
    for (let k in this._stats.msgCount) {
      result += this._stats.msgCount[k];
    }
    return result;
  }

  countTotalUsers() {
    return Object.keys(this._stats.msgCount).length;
  }

}

module.exports = ParseIRC;
