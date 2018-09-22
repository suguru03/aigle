---
id: all-prototype
title: #All
---

`Aigle#all` executes the result of the parent instance using `Aigle.all`.

## Arguments

## Returns
(Aigle): An Aigle instance

## Example

### Array

```js
const order = [];
const makeDelay = async (num, delay) => {
  await Aigle.delay(delay);
  order.push(num);
  return num;
};
const tasks = [
  makeDelay(1, 30),
  makeDelay(2, 20),
  makeDelay(3, 10)
];
(async () => {
  const array = await Aigle.resolve(tasks).all();
  console.log(array); // [1, 2, 3];
  console.log(order); // [3, 2, 1];
})();
```

```js
const order = [];
const makeDelay = (num, delay) => {
  return Aigle.delay(delay)
    .then(() => {
      order.push(num);
      return num;
    });
};
const tasks = [
  makeDelay(1, 30),
  makeDelay(2, 20),
  makeDelay(3, 10)
];
Aigle.resolve(tasks)
  .all()
  .then(array => {
    console.log(array); // [1, 2, 3];
    console.log(order); // [3, 2, 1];
  });
```

### Set

```js
const tasks = new Set([
  Aigle.delay(10, 1),
  Promise.resolve(2),
  3,
]);
(async () => {
  const array = await Aigle.resolve(tasks).all();
  console.log(array); // [1, 2, 3];
})();
```
