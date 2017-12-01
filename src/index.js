"use strict"

const fs = require("fs");
const path = require("path");
const Q = require("q");
const ParseIRC = require("./ParseIRC");
const Simulator = require("./Simulator");

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
  let dir = parent;
  let promises = [];
  let parsers = [];

  // !!!
  //for (let month = 1; month <= 12; month++) {
  for (let month = 1; month <= 1; month++) {
    for (let day = 1; day <= 31; day++) {
      dir = path.join(parent, doubleDigitStr(month), doubleDigitStr(day));
      promises.push(Q.nfapply(fs.lstat, [ dir ]).then(function(dir, stats) {
        if (!stats.isDirectory()) {
          // Just ignore
          return Promise.resolve();
        }
        let p = new ParseIRC(dir);
        parsers.push(p);
        return p.processDir(dir);
      }.bind({}, dir)).catch((err) => {
        // File does not exist
        // console.error(err);
      }));
    }
  }

  Promise.all(promises).then(() => {
    for (let i = 0; i < 1; i++) {
    //for (let i = 0; i < parsers.length; i++) {
      let sim = new Simulator(parsers[i]);
      sim.playMessages();
      console.log(sim);
    }
    return Promise.resolve();
  }).then(() => {
    let aggregate = new ParseIRC("total");
    for (let i = 0; i < parsers.length; i++) {
      aggregate.merge(parsers[i]);
    }
    return Promise.resolve(aggregate);
  }).then((aggregate) => {
    //console.log(parser);
    console.log("Finished processing.");
    console.log("Files processed: " + aggregate.getFileCount());
    console.log("Users seen: " + aggregate.countTotalUsers());
    console.log("Average subscriptions: " + aggregate.getAverageSubscriptions());
    console.log("Total messages: " + aggregate.countTotalMessages());
    //console.log(aggregate.getStats().msgCount);
  }).catch((err) => {
    console.error("FATAL");
    console.error(err);
  });

}

main();
