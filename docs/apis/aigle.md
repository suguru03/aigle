---
id: aigle
title: Aigle
---

🦅  It is a production-ready library that implements the Promise A+ standard.
The basic usage is the same as [the native Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

It also has cancellation mode, if enabled, you can use cancellation functions.

## Arguments
1. executor (Function): It is the same as the native Promise.

## Returns
(Aigle): An Aigle instance that the first state is `pending`.

## Example

```js
const Aigle = require('aigle');

const promise = new Aigle((resolve, reject) => {
 fs.readFile('filepath', (err, data) => {
   if (err) {
     return reject(err);
  }
  resolve(data);
});
promise.resolve(file => console.log(file));
```
