'use strict';

const _ = require('lodash');

const argv = require('minimist')(process.argv.slice(2));

const Aigle = require('../');
const Bluebird = require('bluebird');

const defaults = {
  count: 100,
  // for func-comparator
  times: 10000,
  concurrency: 4
};

const benchmark = argv.b || argv.benchmark; // ['benchmark', 'func-comparator'], -b func-comparator
const count = argv.c || argv.count;
const times = argv.t || argv.times;
const { concurrency } = argv;
const target = argv.target; // -t <function name>
let Promise = global.Promise;
if (argv.p) {
  const regExp = RegExp(argv.p);
  Promise = regExp.test('aigle') ? Aigle : regExp.test('bluebird') ? Bluebird : global.Promise;
}

const benchmarks = _.chain([
  'benchmark',
  'func-comparator'
])
.filter(value => RegExp(benchmark).test(value))
.transform((result, name) => result[name] = require(`./${name}`)(Promise), {})
.value();

const functions = {
  Aigle,
  Bluebird
};

console.log('======================================');
_.forOwn(functions, (obj, key) => console.log(`[${key}], v${obj.version}`));

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
    count: count || _.get(obj.config, ['count'], defaults.count),
    times: times || _.get(obj.config, ['times'], defaults.times),
    concurrency: concurrency || _.get(obj.config, ['concurrency'], defaults.concurrency)
  };
  obj = _.omit(obj, 'config');
  _.forOwn(obj, (tasks, name) => {
    result.push(() => {
      console.log('======================================');
      console.log(`[${name}] Comparating...`);
      console.log(`concurrency: ${config.concurrency}`);
    });
    const setup = _.get(tasks, ['setup'], _.noop);
    tasks = _.omit(tasks, 'setup');
    _.forOwn(benchmarks, (Benchmark, name) => {
      result.push(() => {
        setup(config);
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
