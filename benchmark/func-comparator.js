'use strict';

const _ = require('lodash');
const Comparator = require('func-comparator').Comparator;

let Promise;

class FuncComparator {

  constructor() {}

  config(config) {
    this._times = config.times;
    this._concurrency = config.concurrency || 1;
    return this;
  }

  tasks(tasks) {
    this._tasks = tasks;
    return this;
  }

  execute() {
    const tasks = this._tasks;
    const times = this._times;
    const concurrency = this._concurrency;
    return new Promise((resolve, reject) => {
      new Comparator()
        .set(tasks)
        .times(times)
        .async()
        .concurrency(concurrency)
        .start()
        .result((err, res) => {
          if (err) {
            return reject(err);
          }
          var result = _.chain(res)
            .map((data, name) => {
              return {
                name: name,
                mean: data.average
              };
            })
            .sortBy('mean')
            .value();
          resolve(result);
        });
    });
  }
}

module.exports = _Promise => {
  Promise = _Promise;
  return FuncComparator;
};
