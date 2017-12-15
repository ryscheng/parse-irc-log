"use strict"

const fs = require("fs");
const path = require("path");
const Q = require("q");
const ParseIRC = require("./ParseIRC");
const Simulator = require("./Simulator");
const Stats = require("./Stats");

function doubleDigitStr(num) {
  if (num < 0) {
    num *= -1;
  }
  if (num < 10) {
    return "0"+num;
  }
  if (num < 100) {
    return ""+num;
  }
  return doubleDigitStr(num%100);
}

function main() {
  console.log("Parsing IRC logs");

  if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " <path>");
    process.exit(-1);
  }

  let parent = process.argv[2];
  let promises = [];
  let parsers = [];

  /** Parse all logs, store in memory **/
  // !!!
  /**
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
  **/
  for (let month = 1; month <= 1; month++) {
    for (let day = 1; day <= 1; day++) {
      let dir = path.join(parent, doubleDigitStr(month), doubleDigitStr(day));
      let datePrefix = "2016-" + doubleDigitStr(month) + "-" + doubleDigitStr(day) + " ";
      let p = new ParseIRC(dir, datePrefix);
      promises.push(Q.nfapply(fs.lstat, [ dir ]).then(function(p, dir, stats) {
        if (!stats.isDirectory()) {
          // Just ignore
          return Promise.resolve();
        }
        parsers.push(p);
        return p.processDir(dir);
      }.bind({}, p, dir)).catch((err) => {
        // File does not exist
        // console.error(err);
      }));
    }
  }

  Promise.all(promises).then(() => {
    console.log("Finished reading all files...");
    let fileCount = 0;
    for (let i = 0; i < parsers.length; i++) {
      fileCount += parsers[i].getFileCount();
    }
    console.log("\t Files processed: " + fileCount);
    return Promise.resolve();
  }).then(() => {
    /** Calculate max daily stats **/
    console.log("... computing max daily stats")
    let maxUsers = 0;
    let maxMessages = 0;
    parsers.forEach((p) => {
      let stats = new Stats(p.getMessages());
      let num = stats.countTotalUsers();
      if (num > maxUsers) {
        maxUsers = num;
      }
      num = stats.countTotalMessages();
      if (num > maxMessages) {
        maxMessages = num;
      }
    });
    console.log("\t Max users in a day: " + maxUsers);
    console.log("\t Max messages in a day: " + maxMessages);
    return Promise.resolve();
  }).then(() => {
    /** Global Stats **/
    console.log("... computing global stats");
    let stats = new Stats();
    for (let i = 0; i < parsers.length; i++) {
      stats.processMessageArray(parsers[i].getMessages());
    }
    //console.log(parser);
    console.log("\t Total Users seen: " + stats.countTotalUsers());
    console.log("\t Total messages: " + stats.countTotalMessages());
    console.log("\t Average subscriptions: " + stats.getAverageSubscriptions());
    console.log("\t Average membership: " + stats.getAverageTopicMembers());

    return Promise.resolve(stats);
  }).then((globalStats) => {
    /** Create a simulator for each day **/
    console.log("... simulating messages");
    /**
    parsers.forEach((parser) => {
      const TTL = 86400000; // 1 day
      const N = ;
      let messages = parser.getMessages();
      //let stats = globalStats;
      let stats = new Stats(messages); // Daily stats
      let writePeriod = N / (TTL * stats.getUsers().length); //3600000 = 1hr
      let readPeriod = 1000;
      let sim = new Simulator(messages, stats);
      sim.run(writePeriod, readPeriod);
      //console.log(sim);

    });
    **/
    return Promise.resolve();
  }).catch((err) => {
    console.error("FATAL");
    console.error(err);
  });

}

main();
