'use strict';

const Aigle = require('./aigle');

module.exports = flow;

/**
 * @param {Function[]} funcs
 * @return {Function} Returns the new composite function
 * @example
 *   const add = (a, b) => Aigle.delay(10, a + b);
 *   const square = n => Aigle.delay(10, n * n);
 *   const addSquare = Aigle.flow(add, square);
 *   return addSquare(1, 2).then(value => {
 *     console.log(value); // 9
 *   });
 */
function flow(...funcs) {
  const [handler = thru, ...handlers] = flatArray(funcs);
  return (...args) =>
    Aigle.resolve(handler(...args)).then(data =>
      Aigle.reduce(handlers, (acc, func) => func(acc), data)
    );
}

function thru(arg) {
  return arg;
}

function flatArray(args) {
  const l = args.length;
  const array = [];
  let i = -1;
  while (++i < l) {
    const arg = args[i];
    Array.isArray(arg) ? array.push(...arg) : array.push(arg);
  }
  return array;
}
