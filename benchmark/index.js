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

const Benchmark = require('./benchmark');
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
  const version = `v${obj.version || obj.VERSION || '0.0.0'}`;
  console.log(`[${key}] ${version}`);
  return version;
});
versionMap.native = process.version;

const re = new RegExp(`(config|${target})`);

execute();

async function execute() {
  const result = await Aigle.resolve(require('./tasks')(functions))
    .mapValues((obj, name) => {
      if (!target || re.test(name)) {
        return obj;
      }
      return _.pickBy(obj, (obj, name) => re.test(name) || re.test(_.first(name.split(':'))));
    })
    .omit(_.isEmpty)
    .transformSeries(async (memo, obj) => {
      const config = {
        count: count || _.get(obj.config, ['count'], defaults.count)
      };
      const result = await Aigle.omit(obj, 'config')
        .mapValuesSeries((tasks, name) => executeTasks(config, tasks, name))
        .omit(_.isEmpty);
      Object.assign(memo, result);
    });
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

  // validate all results
  const obj = await Aigle.mapValuesSeries(
    tasks,
    func => (!func.length ? func() : Aigle.promisify(func)())
  );
  const keys = Object.keys(obj);
  _.forOwn(keys, (key1, index) =>
    _.forEach(keys.slice(index + 1), key2 => {
      const value1 = obj[key1];
      const value2 = obj[key2];
      if (!_.isEqual(value1, value2)) {
        console.error(`[${key1}]`, value1);
        console.error(`[${key2}]`, value2);
        throw new Error(`Validation is failed ${key1}, ${key2}`);
      }
    })
  );

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
