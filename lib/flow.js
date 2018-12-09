'use strict';

const Aigle = require('./aigle');

module.exports = flow;

function flow([handler, ...handlers]) {
  return (...args) =>
    Aigle.resolve(handler(...args)).then(data =>
      Aigle.reduce(handlers, (acc, func) => func(acc), data)
    );
}
