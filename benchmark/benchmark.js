'use strict';

const _ = require('lodash');
const Suite = require('benchmark').Suite;

let Promise;

class Benchmark {

  constructor() {}

  config() {
    return this;
  }

  tasks(tasks) {
    this._tasks = tasks;
    return this;
  }

  execute() {
    const tasks = this._tasks;
    const suite = new Suite();
    const total = {};
    _.forEach(tasks, (func, key) => {
      total[key] = {
        count: 0,
        time: 0
      };
      if (key === 'neoAsync') {
        suite.add(key, {
          defer: true,
          fn: deferred => {
            const start = process.hrtime();
            func(() => {
              const diff = process.hrtime(start);
              total[key].time += (diff[0] * 1e9 + diff[1]) / 1000;
              total[key].count++;
              deferred.resolve();
            });
          }
        });
      } else {
        suite.add(key, {
          defer: true,
          fn: deferred => {
            const start = process.hrtime();
            func().then(() => {
              const diff = process.hrtime(start);
              total[key].time += (diff[0] * 1e9 + diff[1]) / 1000;
              total[key].count++;
              deferred.resolve();
            });
          }
        });
      }
    });
    return new Promise(resolve => {
      suite
        .on('complete', function() {
          const result = _.chain(this)
            .map(data => {
              const name = data.name;
              const time = total[name];
              return {
                name: name,
                mean: time.time / time.count
              };
            })
            .sortBy('mean')
            .value();
          resolve(result);
        })
        .run({
          async: true
        });
    });
  }
}

module.exports = _Promise => {
  Promise = _Promise;
  return Benchmark;
};
