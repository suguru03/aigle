'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const argv = require('minimist')(process.argv.slice(2));

const Aigle = require('../');
const Bluebird = require('bluebird');
const neoAsync = require('neo-async');

const defaults = { count: 100 };

// node --expose_gc ./benchmark -d
const count = argv.c || argv.count;
const target = argv.t || argv.target; // -t <function name>
const makeDoc = argv.d || argv.docs; // -d make documents
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
if (makeDoc) {
  delete functions.neoAsync;
}

console.log('======================================');
const versionMap = _.mapValues(functions, (obj, key) => {
  const version = obj.version || obj.VERSION || '0.0.0';
  console.log(`[${key}] v${version}`);
  return version;
});

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
const resultMap = {};
const benchmarkTasks = _.transform(tasks, (result, obj) => {
  const config = {
    count: count || _.get(obj.config, ['count'], defaults.count)
  };
  obj = _.omit(obj, 'config');
  _.forOwn(obj, (tasks, name) => {

    if (makeDoc && !tasks.doc) {
      return;
    }
    const setup = _.get(tasks, ['setup'], _.noop);
    tasks = _.omit(tasks, 'setup', 'doc');
    result.push(() => {
      console.log('======================================');
      console.log(`[${name}] Preparing...`);
      if (global.gc) {
        global.gc();
      }

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
      const map = resultMap[name] = {};
      return new Benchmark()
        .config(config)
        .tasks(tasks)
        .execute()
        .then(result => _.forEach(result, ({ name, mean }, index, array) => {
          const diff = (_.first(array).mean) / mean;
          const rate = mean / (_.first(array).mean);
          ++index;
          map[name] = { index, mean, diff, rate };
          console.log(`[${index}] "${name}" ${mean.toPrecision(3)}μs[${diff.toPrecision(3)}][${rate.toPrecision(3)}]`);
        }));
    });
  });
}, []);

if (makeDoc) {
  benchmarkTasks.push(() => {
    console.log('======================================');
    console.log('Making README...');
    let doc = '## Benchmark \n\n(using [benchmark.js](https://github.com/bestiejs/benchmark.js))\n';

    // version
    doc += '\n### Libraries\n';
    doc += _.reduce(versionMap, (result, version, key) => {
      return `${result}- ${key} v${version}\n`;
    }, '');

    // benchmarks
    const names = _.map(versionMap, (value, key) => _.camelCase(key));
    doc += '\n### Results\n';
    doc += `|benchmark|${names.join('|')}|\n`;
    doc += `|---|${_.times(names.length, _.constant('---')).join('|')}|\n`;
    doc += _.reduce(resultMap, (result, obj, key) => {
      const array = _.map(names, key => {
        const { index, mean, diff } = obj[key] || {};
        if (!index) {
          return '';
        }
        if (index === 1) {
          return `**${mean.toPrecision(3)}μs**`;
        }
        return `${mean.toPrecision(3)}μs [${diff.toPrecision(3)}]`;
      });
      return `${result}|${key}|${array.join('|')}|\n`;
    }, '');
    fs.writeFileSync(path.resolve(__dirname, 'README.md'), doc, 'utf8');
  });
}

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
