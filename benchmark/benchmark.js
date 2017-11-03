'use strict';

const _ = require('lodash');
const { Suite } = require('benchmark');

class Benchmark {

  constructor() {
    this._tasks = undefined;
  }

  config() {
    return this;
  }

  tasks(tasks) {
    this._tasks = tasks;
    return this;
  }

  execute() {
    const { _tasks } = this;
    const suite = new Suite();
    _.forEach(_tasks, (func, key) => {
      if (key === 'neoAsync') {
        suite.add(key, {
          defer: true,
          fn: deferred => func(() => deferred.resolve())
        });
      } else {
        suite.add(key, {
          defer: true,
          fn: deferred => func().then(() => deferred.resolve())
        });
      }
    });
    return new Promise(resolve => {
      suite
        .on('complete', function() {
          const result = _.chain(this)
            .map(data => {
              const { name, stats } = data;
              const { mean } = stats;
              return { name, mean };
            })
            .sortBy('mean')
            .value();
          resolve(result);
        })
        .run({ async: true });
    });
  }
}

module.exports = Benchmark;
