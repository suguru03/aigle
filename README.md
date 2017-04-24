# Aigle

[![npm](https://img.shields.io/npm/v/aigle.svg)](https://www.npmjs.com/package/aigle)
[![CircleCI branch](https://img.shields.io/circleci/project/github/suguru03/aigle/master.svg)](https://circleci.com/gh/suguru03/aigle/tree/master)
[![Codecov branch](https://img.shields.io/codecov/c/github/suguru03/aigle/master.svg)](https://codecov.io/gh/suguru03/aigle)

Aigle is an ideal Promise library, faster and more functional than other Promise libraries.
It is never slow down even if you mix different Aigle versions.

Also it has a lot of [async](https://github.com/caolan/async) functions, you can start using `Promise` easily.

- [benchmark](https://github.com/suguru03/bluebird/tree/aigle/benchmark)
- [What makes Aigle fast](https://hackernoon.com/how-to-make-the-fastest-promise-library-f632fd69f3cb)

Usage
--

### node
```sh
npm install --save aigle
```

```js
const Promise = require('aigle');
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
- [`toString`](https://suguru03.github.io/aigle/docs/Aigle.html#toString)

#### class functions

- [`Promise.resolve`](https://suguru03.github.io/aigle/docs/global.html#resolve)
- [`Promise.reject`](https://suguru03.github.io/aigle/docs/global.html#reject)
- [`Promise.attempt`](https://suguru03.github.io/aigle/docs/global.html#attempt)
- [`Promise.try`](https://suguru03.github.io/aigle/docs/global.html#try) -> - [`Promise.attempt`](https://suguru03.github.io/aigle/docs/global.html#try)
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
- [`omitSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitSeries)
- [`omitLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#omitLimit)
- [`pick`](https://suguru03.github.io/aigle/docs/Aigle.html#pick)
- [`pickSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#pickSeries)
- [`pickLimit`](https://suguru03.github.io/aigle/docs/Aigle.html#pickLimit)
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
- [`Promise.omitSeries`](https://suguru03.github.io/aigle/docs/global.html#omitSeries)
- [`Promise.omitLimit`](https://suguru03.github.io/aigle/docs/global.html#omitLimit)
- [`Promise.pick`](https://suguru03.github.io/aigle/docs/global.html#pick)
- [`Promise.pickSeries`](https://suguru03.github.io/aigle/docs/global.html#pickSeries)
- [`Promise.pickLimit`](https://suguru03.github.io/aigle/docs/global.html#pickLimit)
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
- [`Promise.promisify`](https://suguru03.github.io/aigle/docs/global.html#promisify)
- [`Promise.promisifyAll`](https://suguru03.github.io/aigle/docs/global.html#promisifyAll)
