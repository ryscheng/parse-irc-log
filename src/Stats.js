"use strict";

class Stats {
  constructor() {
    this._messages = [];
    this._data= {
      channels: {}, // { channel => [ username ] }
      msgCount: {}, // { username => { channel => count } }
    };
  }

  /*********************
   * PRIVATE
   *********************/

  _addUserToChannel(channel, username) {
    if (!this._data.channels.hasOwnProperty(channel)) {
      this._data.channels[channel] = [ username ];
    } else if (this._data.channels[channel].indexOf(username) === -1) {
      this._data.channels[channel].push(username);
    }
  }

  _addMsgCount(user, channel, count) {
    if (this._data.msgCount.hasOwnProperty(user)) {
      if (this._data.msgCount[user].hasOwnProperty(channel)) {
        this._data.msgCount[user][channel] += count;
      } else {
        this._data.msgCount[user][channel] = count;
      }
    } else {
      this._data.msgCount[user] = {};
      this._data.msgCount[user][channel] = count;
    }
  }

  /*********************
   * PUBLIC
   *********************/

  getStats() {
    return this._data;
  }

  getUsers() {
    return Object.keys(this._data.msgCount);
  }

  getUsersForChannel(c) {
    if (!this._data.channels.hasOwnProperty(c)) {
      return [];
    }
    return this._data.channels[c];
  }

  getChannelsForUser(user) {
    if (!this._data.msgCount.hasOwnProperty(user)) {
      return [];
    }
    return Object.keys(this._data.msgCount[user]);
  }

  getAverageTopicMembers() {
    let top = 0.0;
    let bot = 0.0;
    for (let c in this._data.channels) {
      top += this._data.channels[c].length;
      bot++;
    }
    return top/bot;
  }

  getAverageSubscriptions() {
    let top = 0.0;
    let bot = 0.0;
    for (let k1 in this._data.msgCount) {
      bot += 1;
      for (let k2 in this._data.msgCount[k1]) {
        top += 1;
      }
    }
    return top/bot;
  }

  countTotalMessages() {
    let result = 0;
    for (let k1 in this._data.msgCount) {
      for (let k2 in this._data.msgCount[k1]) {
        result += this._data.msgCount[k1][k2];
      }
    }
    return result;
  }

  countTotalUsers() {
    return Object.keys(this._data.msgCount).length;
  }

  processMessageArray(messages) {
    for (let i = 0; i < messages.length; i++) {
      this.processMessage(messages[i]);
    }
  }

  processMessage(msgObj) {
    // Add message
    this._messages.push(msgObj);

    // Per (user,channel) counts
    this._addMsgCount(msgObj.user, msgObj.channel, 1);

    // Channel members
    this._addUserToChannel(msgObj.channel, msgObj.user);

  }

}
module.exports = Stats;
