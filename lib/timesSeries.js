'use strict';

const timesLimit = require('./timesLimit');

module.exports = timesSeries;

/**
 * @param {integer} times
 * @param {Function} iterator
 */
function timesSeries(times, iterator) {
  return timesLimit(times, 1, iterator);
}
