"use strict"

const fs = require("fs");
const path = require("path");
const Q = require("q");
const ProgressBar = require('progress');
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

function mergeIn(src, dst) {
  for (let k in src) {
    if (dst.hasOwnProperty(k)) {
      dst[k] += src[k];
    } else {
      dst[k] = src[k];
    }
  }
  return dst;
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
  let outputStr = "";

  /** Parse all logs, store in memory **/
  // !!! TESTING !!!
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
  /**
  for (let month = 1; month <= 1; month++) {
    for (let day = 1; day <= 1; day++) {
  **/
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
      let fc = parsers[i].getFileCount();
      let mc = parsers[i].getMessages().length;
      if (fc <= 0 || mc <= 0) {
        return Promise.reject("Invalid ParseIRC object: " + JSON.stringify(parsers[i]));
      }
      fileCount += parsers[i].getFileCount();
    }
    console.log("\t Files processed: " + fileCount);
    return Promise.resolve();
  }).then(() => {
    /** Calculate max daily stats **/
    console.log("... computing max daily stats")
    let maxUsers = 0;
    let maxMessages = 0;
    let totalTopicMembers = 0;
    let count = 0;
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
      totalTopicMembers += stats.getAverageTopicMembers();
      count += 1;
    });
    console.log("\t Max users in a day: " + maxUsers);
    console.log("\t Max messages in a day: " + maxMessages);
    console.log("\t Average daily members per topic: " + (1.0 * totalTopicMembers / count));
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

    const TTL = 86400000; // 1 day
    const N = 524000; // support MAX_DAILY_USERS(1264) @1msg/sec
    const ONLINE_FACTOR = 0.086;
    for (let readPeriod = 1000; readPeriod < 36000; readPeriod = Math.floor(readPeriod*1.25)) {  //3600000 = 1hr
      console.log("-----------");
      console.log("readPeriod (s): " + (readPeriod/1000));
      process.stderr.write("\nreadPeriod (s): " + (readPeriod/1000) + "\n");
      process.stderr.write("totalRuns: " + parsers.length + "\n");
      let total = {};
      let bar = new ProgressBar("simulating [:bar] :elapsed seconds", { total: parsers.length });
      parsers.forEach(function(bar, readPeriod, parser) {
        let stats = new Stats(parser.getMessages());
        let writePeriod = (TTL * stats.countTotalUsers() * ONLINE_FACTOR) / N;
          //17.9s for busiest day (3.46 minutes w/o ONLINE_FACTOR)
        //console.log(writePeriod);
        let sim = new Simulator(parser.getMessages(), null);
        let t = sim.run(writePeriod, readPeriod);
        total = mergeIn(t, total);
        bar.tick();
        process.stderr.write(bar.curr + ",");
      }.bind(this, bar, readPeriod));
      // Correction
      total.dummyRead = Math.floor(total.dummyRead*ONLINE_FACTOR);
      total.dummyWrite = Math.floor(total.dummyWrite*ONLINE_FACTOR);
      let percentWrite = (100.0 * total.realWrite / (total.realWrite + total.dummyWrite));
      let percentRead = (100.0 * total.realRead / (total.realRead + total.dummyRead));
      let writesPerUser = (total.dummyWrite + total.realWrite) / total.users;
      let readsPerUser = (total.dummyRead + total.realRead) / total.users;
      let writeBW = 1.08 * writesPerUser; //KB
      let readBW = 20.46 * readsPerUser; //KB bucketDepth=4
      //let readBW = 4.16 * (total.dummyRead + total.realRead); //KB
      let averageLatency = (total.latency / (total.realRead * 1000.0)); // seconds
      console.log("Percentage Real Write");
      console.log(percentWrite + "%"); 
      console.log("Percentage Real Read");
      console.log(percentRead + "%"); 
      console.log("Average Writes/Day per User");
      console.log(writesPerUser);
      console.log("Average Reads/Day per User");
      console.log(readsPerUser);
      console.log("Average Write B/W per User (KB/day)");
      console.log(writeBW);
      console.log("Average Read B/W per User (KB/day)");
      console.log(readBW);
      console.log("Average E2E Latency (s)");
      console.log(averageLatency);
      outputStr += (readPeriod / 1000);               // (s)
      outputStr += "\t" + ((writeBW+readBW) / 1000);  // Total B/W (MB)
      outputStr += "\t" + averageLatency;             // (s)
      outputStr += "\n";
    }
    console.log("----------");
    console.log(outputStr);
    return Promise.resolve();
  }).catch((err) => {
    console.error("FATAL");
    console.error(err);
  });

}

main();
