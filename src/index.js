"use strict"

const fs = require("fs");
const path = require("path");
const Q = require("q");
const ParseIRC = require("./ParseIRC");

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

  let parser = new ParseIRC("2016/12/01");
  //parser.processFile("/home/ryscheng/Downloads/experiments/irc-ubuntu/2016/12/01/#xubuntu.txt");
  parser.processDir("/home/ryscheng/Downloads/experiments/irc-ubuntu/2016/12/01/").then(() => {
    console.log(parser);
    console.log("Finished processing.");
  }).catch((err) => {
    console.error("FATAL");
    console.error(err);
  });

  /**
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
      dir = path.join(parent, doubleDigitStr(month), doubleDigitStr(day));
      Q.nfapply(fs.lstat, [ dir ]).then(function(dir, stats) {
        if (stats.isDirectory()) {
          parser.processDir(dir)
        }
      }.bind({}, dir));
    }
  }
  **/


}

main();
