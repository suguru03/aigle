Aigle
--

[Work In Progress]

Aigle is an ideal promise library.
Aigle is never slow down even if you mix different Aigle versions and other promise libraries.
All Aigle class is extended by same [Aigle-Core](https://github.com/suguru03/aigle-core). [benchmark](https://github.com/suguru03/aigle-benchmark)

Also Aigle has a lot of [async](https://github.com/caolan/async) functions, you can start to use `Promise` easily.

Let's stop using Async, let's start to use Aigle.

Usage
--

#### node
```sh
npm install --save aigle
```

```js
var Promise = require('aigle');
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