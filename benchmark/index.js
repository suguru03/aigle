'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const argv = require('minimist')(process.argv.slice(2));

const Aigle = require('../');
const Bluebird = require('bluebird');
const async = require('async');
const neoAsync = require('neo-async');

const defaults = { count: 100 };

// node --expose_gc ./benchmark -d
const count = argv.c || argv.count;
const target = argv.t || argv.target; // -t <function name>
const makeDoc = argv.d || argv.docs; // -d make documents

const Benchmark = require('./benchmark');
const functions = {
  Aigle,
  Bluebird,
  async,
  neoAsync
};
if (makeDoc) {
  delete functions.neoAsync;
}

console.log('======================================');
const versionMap = _.mapValues(functions, (obj, key) => {
  const version =
    obj.version ||
    obj.VERSION ||
    require(path.resolve(__dirname, '..', 'node_modules', _.kebabCase(key), 'package.json'))
      .version;
  console.log(`[${key}] v${version}`);
  return version;
});
versionMap.native = process.version;

const re = new RegExp(`(config|${target})`);

execute();

async function execute() {
  const allTasks = _.chain(require('./tasks')(functions))
    .mapValues((obj, name) => {
      if (!target || re.test(name)) {
        return obj;
      }
      return _.pickBy(obj, (obj, name) => re.test(name) || re.test(_.first(name.split(':'))));
    })
    .omitBy(_.isEmpty)
    .values()
    .value();
  const result = {};
  for (const obj of allTasks) {
    const config = {
      count: count || _.get(obj.config, ['count'], defaults.count)
    };
    const map = _.omit(obj, 'config');
    for (const [name, tasks] of Object.entries(map)) {
      const res = await executeTasks(config, tasks, name);
      if (res) {
        result[name] = res;
      }
    }
  }
  makeDoc && makeDocs(result);
}

async function executeTasks(config, tasks, name) {
  if (makeDoc && !tasks.doc) {
    return;
  }
  const setup = _.get(tasks, ['setup'], _.noop);
  tasks = _.omit(tasks, 'setup', 'doc');
  console.log('======================================');
  console.log(`[${name}] Preparing...`);
  if (global.gc) {
    global.gc();
  }
  setup(config);

  console.log('--------------------------------------');
  console.log(`[${name}] Executing...`);
  const result = await new Benchmark()
    .config(config)
    .tasks(tasks)
    .execute();
  return _.transform(
    result,
    (memo, { name, mean }, index) => {
      const diff = _.first(result).mean / mean;
      const rate = mean / _.first(result).mean;
      mean *= Math.pow(10, 6);
      ++index;
      memo[name] = { index, mean, diff, rate };
      console.log(
        `[${index}] "${name}" ${mean.toPrecision(3)}μs[${diff.toPrecision(3)}][${rate.toPrecision(
          3
        )}]`
      );
    },
    {}
  );
}

function makeDocs(result) {
  console.log('======================================');
  console.log('Making README...');
  let doc = '## Benchmark \n\n(using [benchmark.js](https://github.com/bestiejs/benchmark.js))\n';

  // environment
  doc += '\n### Environment\n';
  doc += `- Node ${process.version}\n`;

  // version
  doc += '\n### Libraries\n';
  doc = _.reduce(versionMap, (result, version, key) => `${result}- ${key} ${version}\n`, doc);

  // benchmarks
  const names = _.map(versionMap, (value, key) => _.camelCase(key));
  doc += '\n### Results\n';
  doc += `|benchmark|${names.join('|')}|\n`;
  doc += `|---|${_.times(names.length, _.constant('---')).join('|')}|\n`;
  doc += _.reduce(
    result,
    (memo, obj, key) => {
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
      return `${memo}|${key}|${array.join('|')}|\n`;
    },
    ''
  );
  fs.writeFileSync(path.resolve(__dirname, 'README.md'), doc, 'utf8');
}
