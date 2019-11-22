"use strict";

const moment = require("moment");
const random = require("random");

class User {
  constructor(name, period) {
    this._name = name;
    this._period = period;
    this._last = null;
    this._countDummy = 0;
    this._countReal = 0;

    this._queueLengthTotal = 0;
  }

  getDummy() {
    return this._countDummy;
  }

  getReal() {
    return this._countReal;
  }

  getQueueLengthTotal() {
    return this._queueLengthTotal;
  }

  // Return time it was actually posted
  queue(startTime) {
    // If first message
    if (this._last === null) {
      this._last = startTime;
      this._countReal++;
      return startTime;
    }

    //console.log("---");
    //console.log("Start: " + startTime);
    //console.log("Last: " + this._last);
    // let generator = random.poisson(this._period) // Poisson
    // let generator = random.uniform(0, this._period) // Uniform
    let generator = function(period){ return period }.bind({}, this._period);
    
    // Dummy messages up to here
    for (let next = (this._last + generator());
         next < startTime;
         next += generator()) {
      this._countDummy++;
      this._last = next;
    }

    // Write message
    //this._last += this._period;
    this._last += generator();
    this._countReal++;

    let queueLength = (1.0*(this._last - startTime)) / this._period;
    queueLength = Math.max(0, queueLength);
    if (queueLength < 1000) {
      this._queueLengthTotal += queueLength;
    } else {
      //console.log(queueLength);
    }

    return this._last;
  }

  finish(time) {
    this.queue(time);
    this._countReal -= 1;
  }

}
module.exports = User;
