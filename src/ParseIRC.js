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
    }

    if (line.substr(0,3) === "===") {
      //this.processEvt(line);
      return;
    }

    if (line.indexOf("[") === -1 ||
       line.indexOf("]") === -1 ||
       line.indexOf("<") === -1 ||
       line.indexOf(">") === -1) {
      console.log("Malformed line: " + line);
      return;
    } 
    this.processMsg(line);
  }

  processAction() {
  }

  processMsg(line) {
    let i = line.indexOf("[")+1;
    let end = line.indexOf("]");
    let time = line.substring(i, end);
    i = line.indexOf("<")+1;
    end = line.indexOf(">");
    let user = line.substring(i, end);
    let msg = line.substring(end+2);
    /**
    console.log(line);
    console.log({
      time: time,
      user: user,
      message: msg,
    });
    **/
    if (this._stats.msgCount.hasOwnProperty(user)) {
      this._stats.msgCount[user]++;
    } else {
      this._stats.msgCount[user] = 1;
    }

  }

}

module.exports = ParseIRC;
