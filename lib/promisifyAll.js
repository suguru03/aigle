'use strict';

const promisify = require('./promisify');
const skipMap = {
  constructor: true,
  arity: true,
  length: true,
  name: true,
  arguments: true,
  caller: true,
  callee: true,
  prototype: true,
  __isPromisified__: true
};

module.exports = promisifyAll;

/**
 * @param {Object} target
 * @param {Object} [opts]
 * @param {String} [opts.suffix=Async]
 * @param {Function} [opts.filter]
 * @param {Integer} [opts.depth=2]
 * @example
 * const redis = require('redis');
 * Aigle.promisifyAll(redis);
 * const client = redis.createClient();
 *
 * const key = 'test';
 * redis.hsetAsync(key, 1)
 *   .then(() => redis.hgetAsync(key))
 *   .then(value => console.log(value)); // 1
 */
function promisifyAll(target, opts) {
  const { suffix = 'Async', filter = defaultFilter, depth = 2 } = opts || {};
  _promisifyAll(suffix, filter, target, undefined, undefined, depth);
  return target;
}

function defaultFilter(name) {
  return /^(?!_).*/.test(name);
}

function _promisifyAll(suffix, filter, obj, key, target, depth) {
  const memo = {};
  switch (typeof obj) {
    case 'function':
      if (target) {
        if (obj.__isPromisified__) {
          return;
        }
        const _key = `${key}${suffix}`;
        if (target[_key]) {
          if (!target[_key].__isPromisified__) {
            throw new TypeError(
              `Cannot promisify an API that has normal methods with '${suffix}'-suffix`
            );
          }
        } else {
          target[_key] = promisify(obj);
        }
      }
      iterate(suffix, filter, obj, obj, depth, memo);
      iterate(suffix, filter, obj.prototype, obj.prototype, depth, memo);
      break;
    case 'object':
      if (!obj) {
        break;
      }
      iterate(suffix, filter, obj, obj, depth, memo);
      iterate(suffix, filter, Object.getPrototypeOf(obj), obj, depth, memo);
  }
}

const fp = Function.prototype;
const op = Object.prototype;
const ap = Array.prototype;

function iterate(suffix, filter, obj, target, depth, memo) {
  if (depth-- === 0 || !obj || fp === obj || op === obj || ap === obj || Object.isFrozen(obj)) {
    return;
  }
  const keys = Object.getOwnPropertyNames(obj);
  let l = keys.length;
  while (l--) {
    const key = keys[l];
    if (skipMap[key] === true || memo[key] === true || !filter(key)) {
      continue;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (!desc || desc.set || desc.get) {
      continue;
    }
    memo[key] = true;
    _promisifyAll(suffix, filter, obj[key], key, target, depth);
  }
}
