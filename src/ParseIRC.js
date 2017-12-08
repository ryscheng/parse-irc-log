"use strict";

const fs = require("fs");
const path = require("path");
const Q = require("q");
const moment = require("moment");

class ParseIRC {
  constructor(name, datePrefix) {
    this._name = name;
    this._datePrefix = datePrefix;
    this._errors = [];
    this._fileCount = 0;
    this._messages = [];
  }


  /*********************
   * PUBLIC METHODS
   *********************/

  getName() {
    return this._name;
  }

  getErrors() {
    return this._errors;
  }

  getFileCount() {
    return this._fileCount;
  }

  getMessages() {
    return this._messages;
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
          this.processParsed(parsed, channel);
        }
      }
      this._fileCount++;
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

  processParsed(data, channel) {
    //console.log(data);
    // Explicit ignores
    if (data.code === "ignore") {
      return;
    }

    // Set the channel
    data.channel = channel;

    // Set the date
    let dateStr = this._datePrefix + data.time;
    data.date = moment(dateStr).toDate();

    // Message log
    this._messages.push(data);
  }

}

module.exports = ParseIRC;
