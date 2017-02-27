# Aigle

[![npm](https://img.shields.io/npm/v/aigle.svg)](https://www.npmjs.com/package/aigle)
[![CircleCI branch](https://img.shields.io/circleci/project/github/suguru03/aigle/master.svg)](https://circleci.com/gh/suguru03/aigle/tree/master)
[![Codecov branch](https://img.shields.io/codecov/c/github/suguru03/aigle/master.svg)](https://codecov.io/gh/suguru03/aigle)

Aigle is an ideal Promise library, faster and more functional than other Promise libraries.  
Aigle is never slow down even if you mix different Aigle versions and other promise libraries.  
All Aigle class is extended by same [Aigle-Core](https://github.com/suguru03/aigle-core). ([benchmark](https://github.com/suguru03/aigle-benchmark) is here)  

Also Aigle has a lot of [async](https://github.com/caolan/async) functions, you can start using `Promise` easily.  

Let's stop using Async and start using Aigle.

Usage
--

#### node
```sh
npm install --save aigle
```

```js
const Promise = require('aigle');
```

#### browser
Recommend to use [webpack](https://github.com/webpack/webpack), [browserify](https://github.com/substack/node-browserify), [Rollup](https://github.com/rollup/rollup) or any bundling tool.

##### or prebuilt scripts from [here](https://github.com/suguru03/aigle/tree/master/dist/).
This will expose to global as `window.Promise`.
```html
<script src="dist/aigle.min.js"></script>
```

```js
window.Promise;
```
