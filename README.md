<p align="center">
  <img alt="aigle" src="https://raw.githubusercontent.com/suguru03/aigle/gh-pages/images/logo.png" width=500>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/aigle"><img alt="npm" src="https://img.shields.io/npm/v/aigle.svg"></a>
  <a href="https://circleci.com/gh/suguru03/aigle/tree/master"><img alt="CircleCI Status" src="https://img.shields.io/circleci/project/github/suguru03/aigle/master.svg"></a>
  <a href="https://codecov.io/gh/suguru03/aigle"><img alt="Coverage Status" src="https://img.shields.io/codecov/c/github/suguru03/aigle/master.svg"></a>
</p>

Aigle is an ideal promise library which is faster and more efficient than other libraries.
On top of being an impressive benchmark exercise, it is a production-ready library that implements the Promise A+ standard.

Also it has a lot of [async](https://github.com/caolan/async) style functions, you can start using `Promise` easily.

- [benchmark](https://github.com/suguru03/bluebird/tree/aigle/benchmark)
- [What makes Aigle fast](https://hackernoon.com/how-to-make-the-fastest-promise-library-f632fd69f3cb)

Usage
--

### Node.js
```sh
npm install --save aigle
```

```js
const Aigle = require('aigle');
```

```js
const each = require('aigle/each');
```

### TypeScript

```ts
import Aigle from 'aigle';
```

```ts
import { Aigle } from 'aigle';
```

#### Async/Await

```js
global.Promise = Aigle;
```

```js
async function getUsers(ids) {
  const users = await Promise.map(ids, getUser);
  const targets = await Promise.filter(users, filterUser);
  return targets;
}

async function getUsers(ids) {
  return await Promise.map(ids, getUser)
    .filter(filterUser);
}
```

#### Convert synchronous functions to asynchronous functions

```js
Aigle.mixin(require('lodash'));

return Aigle.map([1.1, 1.4, 2.2], n => Aigle.delay(10, n * 2)) // [2.2, 2.8, 4.4]
  .uniqBy(n => Aigle.delay(10, Math.floor(n))) // [2.2, 4.4]
  .sum() // 6.6
  .times() // [0, 1, 2, 3, 4, 5];
  .then(value => console.log(value)); // [0, 1, 2, 3, 4, 5];
```

### browser
Recommend to use [webpack](https://github.com/webpack/webpack), [browserify](https://github.com/substack/node-browserify), [Rollup](https://github.com/rollup/rollup) or any bundling tool.

#### or prebuilt scripts from [here](https://github.com/suguru03/aigle/tree/master/dist/).
This will expose to global as `window.Promise`.
```html
<script src="dist/aigle.min.js"></script>
```

```js
window.Promise;
```

Functions
--

### Core

#### prototype functions

- [`then`](https://suguru03.github.io/aigle/docs/Aigle.html#then)
- [`spread`](https://suguru03.github.io/aigle/docs/Aigle.html#spread)
- [`catch`](https://suguru03.github.io/aigle/docs/Aigle.html#catch)
- [`finally`](https://suguru03.github.io/aigle/docs/Aigle.html#finally)
- [`cancel`](https://suguru03.github.io/aigle/docs/Aigle.html#cancel)
- [`toString`](https://suguru03.github.io/aigle/docs/Aigle.html#toString)

#### class functions

- [`Promise.resolve`](https://suguru03.github.io/aigle/docs/global.html#resolve)
- [`Promise.reject`](https://suguru03.github.io/aigle/docs/global.html#reject)
- [`Promise.attempt`](https://suguru03.github.io/aigle/docs/global.html#attempt)
- [`Promise.try`](https://suguru03.github.io/aigle/docs/global.html#try) -> [`Promise.attempt`](https://suguru03.github.io/aigle/docs/global.html#try)
- [`Promise.join`](https://suguru03.github.io/aigle/docs/global.html#join)

### Collections

#### prototype functions

- [`concat`](https://suguru03.github.io/aigle/docs/Aigle.html#concat)
- [`concatSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#concatSeries)
- [`concatLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#concatLimit)
- [`each`](https://suguru03.github.io/aigle/docs/Aigle.html#each)
- [`eachSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#eachSeries)
- [`eachLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#eachLimit)
- [`every`](https://suguru03.github.io/aigle/docs/Aigle.html#every)
- [`everySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#everySeries)
- [`everyLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#everyLimit)
- [`filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter)
- [`filterSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#filterSeries)
- [`filterLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#filterLimit)
- [`find`](https://suguru03.github.io/aigle/docs/Aigle.html#find)
- [`findSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findSeries)
- [`findLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#findLimit)
- [`findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex)
- [`findIndexSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndexSeries)
- [`findIndexLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndexLimit)
- [`findKey`](https://suguru03.github.io/aigle/docs/Aigle.html#findKey)
- [`findKeySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findKeySeries)
- [`findKeyLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#findKeyLimit)
- [`forEach`](https://suguru03.github.io/aigle/docs/Aigle.html#each) -> [`each`](https://suguru03.github.io/aigle/docs/Aigle.html#each)
- [`forEachSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#eachSeries) -> [`eachSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#eachSeries)
- [`forEachLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#eachLimit) -> [`eachLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#eachLimit)
- [`groupBy`](https://suguru03.github.io/aigle/docs/Aigle.html#groupBy)
- [`groupBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#groupBySeries)
- [`groupByLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#groupByLimit)
- [`map`](https://suguru03.github.io/aigle/docs/Aigle.html#map)
- [`mapSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapSeries)
- [`mapLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#mapLimit)
- [`mapValues`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValues)
- [`mapValuesSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValuesSeries)
- [`mapValuesLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValuesLimit)
- [`omit`](https://suguru03.github.io/aigle/docs/Aigle.html#omit)
- [`omitSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBySeries) -> [`omitBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBySeries)
- [`omitLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#omitByLimit) -> [`omitByLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#omitByLimit)
- [`omitBy`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBy)
- [`omitBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBySeries)
- [`omitByLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#omitByLimit)
- [`pick`](https://suguru03.github.io/aigle/docs/Aigle.html#pick)
- [`pickSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBySeries) -> [`pickBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBySeries)
- [`pickLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#pickByLimit) -> [`pickByLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#pickByLimit)
- [`pickBy`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBy)
- [`pickBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBySeries)
- [`pickByLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#pickByLimit)
- [`reduce`](https://suguru03.github.io/aigle/docs/Aigle.html#reduce)
- [`reduceSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#reduceSeries)
- [`reduceLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#reduceLimit)
- [`reject`](https://suguru03.github.io/aigle/docs/Aigle.html#reject)
- [`rejectSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#rejectSeries)
- [`rejectLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#rejectLimit)
- [`some`](https://suguru03.github.io/aigle/docs/Aigle.html#some)
- [`someSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#someSeries)
- [`someLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#someLimit)
- [`sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy)
- [`sortBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBySeries)
- [`sortByLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#sortByLimit)
- [`transform`](https://suguru03.github.io/aigle/docs/Aigle.html#transform)
- [`transformSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#transformSeries)
- [`transformLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#transformLimit)

#### class functions

- [`Promise.concat`](https://suguru03.github.io/aigle/docs/global.html#concat)
- [`Promise.concatSeries`](https://suguru03.github.io/aigle/docs/global.html#concatSeries)
- [`Promise.concatLimit`](https://suguru03.github.io/aigle/docs/global.html#concatLimit)
- [`Promise.each`](https://suguru03.github.io/aigle/docs/global.html#each)
- [`Promise.eachSeries`](https://suguru03.github.io/aigle/docs/global.html#eachSeries)
- [`Promise.eachLimit`](https://suguru03.github.io/aigle/docs/global.html#eachLimit)
- [`Promise.every`](https://suguru03.github.io/aigle/docs/global.html#every)
- [`Promise.everySeries`](https://suguru03.github.io/aigle/docs/global.html#everySeries)
- [`Promise.everyLimit`](https://suguru03.github.io/aigle/docs/global.html#everyLimit)
- [`Promise.filter`](https://suguru03.github.io/aigle/docs/global.html#filter)
- [`Promise.filterSeries`](https://suguru03.github.io/aigle/docs/global.html#filterSeries)
- [`Promise.filterLimit`](https://suguru03.github.io/aigle/docs/global.html#filterLimit)
- [`Promise.find`](https://suguru03.github.io/aigle/docs/global.html#find)
- [`Promise.findSeries`](https://suguru03.github.io/aigle/docs/global.html#findSeries)
- [`Promise.findLimit`](https://suguru03.github.io/aigle/docs/global.html#findLimit)
- [`Promise.findIndex`](https://suguru03.github.io/aigle/docs/global.html#findIndex)
- [`Promise.findIndexSeries`](https://suguru03.github.io/aigle/docs/global.html#findIndexSeries)
- [`Promise.findIndexLimit`](https://suguru03.github.io/aigle/docs/global.html#findIndexLimit)
- [`Promise.findKey`](https://suguru03.github.io/aigle/docs/global.html#findKey)
- [`Promise.findKeySeries`](https://suguru03.github.io/aigle/docs/global.html#findKeySeries)
- [`Promise.findKeyLimit`](https://suguru03.github.io/aigle/docs/global.html#findKeyLimit)
- [`Promise.forEach`](https://suguru03.github.io/aigle/docs/global.html#each) -> [`Promise.each`](https://suguru03.github.io/aigle/docs/global.html#each)
- [`Promise.forEachSeries`](https://suguru03.github.io/aigle/docs/global.html#eachSeries) -> [`Promise.eachSeries`](https://suguru03.github.io/aigle/docs/global.html#eachSeries)
- [`Promise.forEachLimit`](https://suguru03.github.io/aigle/docs/global.html#eachLimit) -> [`Promise.eachLimit`](https://suguru03.github.io/aigle/docs/global.html#eachLimit)
- [`Promise.groupBy`](https://suguru03.github.io/aigle/docs/global.html#groupBy)
- [`Promise.groupBySeries`](https://suguru03.github.io/aigle/docs/global.html#groupBySeries)
- [`Promise.groupByLimit`](https://suguru03.github.io/aigle/docs/global.html#groupByLimit)
- [`Promise.map`](https://suguru03.github.io/aigle/docs/global.html#map)
- [`Promise.mapSeries`](https://suguru03.github.io/aigle/docs/global.html#mapSeries)
- [`Promise.mapLimit`](https://suguru03.github.io/aigle/docs/global.html#mapLimit)
- [`Promise.mapValues`](https://suguru03.github.io/aigle/docs/global.html#mapValues)
- [`Promise.mapValuesSeries`](https://suguru03.github.io/aigle/docs/global.html#mapValuesSeries)
- [`Promise.mapValuesLimit`](https://suguru03.github.io/aigle/docs/global.html#mapValuesLimit)
- [`Promise.omit`](https://suguru03.github.io/aigle/docs/global.html#omit)
- [`Promise.omitSeries`](https://suguru03.github.io/aigle/docs/global.html#omitBySeries) -> [`Promise.omitBySeries`](https://suguru03.github.io/aigle/docs/global.html#omitBySeries)
- [`Promise.omitLimit`](https://suguru03.github.io/aigle/docs/global.html#omitByLimit) -> [`Promise.omitByLimit`](https://suguru03.github.io/aigle/docs/global.html#omitByLimit)
- [`Promise.omitBy`](https://suguru03.github.io/aigle/docs/global.html#omitBy)
- [`Promise.omitBySeries`](https://suguru03.github.io/aigle/docs/global.html#omitBySeries)
- [`Promise.omitByLimit`](https://suguru03.github.io/aigle/docs/global.html#omitByLimit)
- [`Promise.pick`](https://suguru03.github.io/aigle/docs/global.html#pick)
- [`Promise.pickSeries`](https://suguru03.github.io/aigle/docs/global.html#pickBySeries) -> [`Promise.pickBySeries`](https://suguru03.github.io/aigle/docs/global.html#pickBySeries)
- [`Promise.pickLimit`](https://suguru03.github.io/aigle/docs/global.html#pickByLimit) -> [`Promise.pickByLimit`](https://suguru03.github.io/aigle/docs/global.html#pickByLimit)
- [`Promise.pickBy`](https://suguru03.github.io/aigle/docs/global.html#pickBy)
- [`Promise.pickBySeries`](https://suguru03.github.io/aigle/docs/global.html#pickBySeries)
- [`Promise.pickByLimit`](https://suguru03.github.io/aigle/docs/global.html#pickByLimit)
- [`Promise.reduce`](https://suguru03.github.io/aigle/docs/global.html#reduce)
- [`Promise.reduceSeries`](https://suguru03.github.io/aigle/docs/global.html#reduceSeries)
- [`Promise.reduceLimit`](https://suguru03.github.io/aigle/docs/global.html#reduceLimit)
- [`Promise.reject`](https://suguru03.github.io/aigle/docs/global.html#reject)
- [`Promise.rejectSeries`](https://suguru03.github.io/aigle/docs/global.html#rejectSeries)
- [`Promise.rejectLimit`](https://suguru03.github.io/aigle/docs/global.html#rejectLimit)
- [`Promise.some`](https://suguru03.github.io/aigle/docs/global.html#some)
- [`Promise.someSeries`](https://suguru03.github.io/aigle/docs/global.html#someSeries)
- [`Promise.someLimit`](https://suguru03.github.io/aigle/docs/global.html#someLimit)
- [`Promise.sortBy`](https://suguru03.github.io/aigle/docs/global.html#sortBy)
- [`Promise.sortBySeries`](https://suguru03.github.io/aigle/docs/global.html#sortBySeries)
- [`Promise.sortByLimit`](https://suguru03.github.io/aigle/docs/global.html#sortByLimit)
- [`Promise.transform`](https://suguru03.github.io/aigle/docs/global.html#transform)
- [`Promise.transformSeries`](https://suguru03.github.io/aigle/docs/global.html#transformSeries)
- [`Promise.transformLimit`](https://suguru03.github.io/aigle/docs/global.html#transformLimit)

### Control flow

#### prototype functions

- [`all`](https://suguru03.github.io/aigle/docs/Aigle.html#all)
- [`doUntil`](https://suguru03.github.io/aigle/docs/Aigle.html#doUntil)
- [`doWhilst`](https://suguru03.github.io/aigle/docs/Aigle.html#doWhilst)
- [`parallel`](https://suguru03.github.io/aigle/docs/Aigle.html#parallel)
- [`props`](https://suguru03.github.io/aigle/docs/Aigle.html#props)
- [`race`](https://suguru03.github.io/aigle/docs/Aigle.html#race)
- [`times`](https://suguru03.github.io/aigle/docs/Aigle.html#times)
- [`timesSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#timesSeries)
- [`timesLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#timesLimit)
- [`until`](https://suguru03.github.io/aigle/docs/Aigle.html#until)
- [`whilst`](https://suguru03.github.io/aigle/docs/Aigle.html#whilst)

#### class functions

- [`Promise.all`](https://suguru03.github.io/aigle/docs/global.html#all)
- [`Promise.doUntil`](https://suguru03.github.io/aigle/docs/global.html#doUntil)
- [`Promise.doWhilst`](https://suguru03.github.io/aigle/docs/global.html#doWhilst)
- [`Promise.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel)
- [`Promise.props`](https://suguru03.github.io/aigle/docs/global.html#props)
- [`Promise.race`](https://suguru03.github.io/aigle/docs/global.html#race)
- [`Promise.retry`](https://suguru03.github.io/aigle/docs/global.html#retry)
- [`Promise.times`](https://suguru03.github.io/aigle/docs/global.html#times)
- [`Promise.timesSeries`](https://suguru03.github.io/aigle/docs/global.html#timesSeries)
- [`Promise.timesLimit`](https://suguru03.github.io/aigle/docs/global.html#timesLimit)
- [`Promise.until`](https://suguru03.github.io/aigle/docs/global.html#until)
- [`Promise.whilst`](https://suguru03.github.io/aigle/docs/global.html#whilst)

### Utils

#### prototype functions

- [`delay`](https://suguru03.github.io/aigle/docs/Aigle.html#delay)
- [`promisify`](https://suguru03.github.io/aigle/docs/Aigle.html#promisify)
- [`promisifyAll`](https://suguru03.github.io/aigle/docs/Aigle.html#promisifyAll)
- [`timeout`](https://suguru03.github.io/aigle/docs/Aigle.html#timeout)

#### class functions

- [`Promise.delay`](https://suguru03.github.io/aigle/docs/global.html#delay)
- [`Promise.mixin`](https://suguru03.github.io/aigle/docs/global.html#mixin)
- [`Promise.promisify`](https://suguru03.github.io/aigle/docs/global.html#promisify)
- [`Promise.promisifyAll`](https://suguru03.github.io/aigle/docs/global.html#promisifyAll)
- [`Promise.config`](https://suguru03.github.io/aigle/docs/global.html#config)

### Debug

#### class functions

- [`Promise.longStackTraces`](https://suguru03.github.io/aigle/docs/global.html#longStackTrases)
