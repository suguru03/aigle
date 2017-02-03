'use strict';

const _ = require('lodash');

const argv = require('minimist')(process.argv.slice(2));

const Aigle = require('../');
const Bluebird = require('bluebird');
const neoAsync = require('neo-async');

const defaults = { count: 100 };

const count = argv.c || argv.count;
const target = argv.target; // -t <function name>
let Promise = global.Promise;
if (argv.p) {
  const regExp = RegExp(argv.p);
  Promise = regExp.test('aigle') ? Aigle : regExp.test('bluebird') ? Bluebird : global.Promise;
}

const Benchmark = require('./benchmark')(Promise);
const functions = {
  Aigle,
  Bluebird,
  neoAsync
};

console.log('======================================');
_.forOwn(functions, (obj, key) => console.log(`[${key}] v${obj.version||obj.VERSION}`));

let tasks = require('./tasks')(functions);
if (target) {
  const reg = new RegExp(`(config|${target})`);
  tasks = _.chain(tasks)
    .mapValues((obj, name) => {
      if (reg.test(name)) {
        return obj;
      }
      return _.pickBy(obj, (obj, name) => reg.test(name) || reg.test(_.first(name.split(':'))));
    })
    .omit(obj => _.isEmpty(obj))
    .value();
}
const benchmarkTasks = _.transform(tasks, (result, obj) => {
  const config = {
    count: count || _.get(obj.config, ['count'], defaults.count)
  };
  obj = _.omit(obj, 'config');
  _.forOwn(obj, (tasks, name) => {

    const setup = _.get(tasks, ['setup'], _.noop);
    tasks = _.omit(tasks, 'setup');
    result.push(() => {
      console.log('======================================');
      console.log(`[${name}] Preparing...`);

      // validate functions
      setup(config);
      return Aigle.mapValues(tasks, func => {
        return !func.length ? func() : Aigle.promisify(func)();
      })
      .then(obj => {
        // validate all results
        const keys = Object.keys(obj);
        _.forEach(keys, (key1, index) => {
          _.forEach(keys.slice(index + 1), key2 => {
            const value1 = obj[key1];
            const value2 = obj[key2];
            if (!_.isEqual(value1, value2)) {
              console.error(`[${key1}]`, value1);
              console.error(`[${key2}]`, value2);
              throw new Error(`Validation is failed ${key1}, ${key2}`);
            }
          });
        });
      });
    });

    result.push(() => {
      console.log('--------------------------------------');
      console.log(`[${name}] Executing...`);
      return new Benchmark()
        .config(config)
        .tasks(tasks)
        .execute()
        .then(result => _.forEach(result, ({ name, mean }, index, array) => {
          const diff = (_.first(array).mean) / mean;
          const rate = mean / (_.first(array).mean);
          console.log(`[${++index}] "${name}" ${mean.toPrecision(3)}μs[${diff.toPrecision(3)}][${rate.toPrecision(3)}]`);
        }));
    });
  });
}, []);

(function exec() {
  const task = benchmarkTasks.shift();
  if (!task) {
    return;
  }
  const p = task();
  if (!p) {
    return exec();
  }
  p.then(exec);
  p.catch(console.error);
})();
