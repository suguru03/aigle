'use strict';

const Aigle = require('./aigle');

module.exports = flow;

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
