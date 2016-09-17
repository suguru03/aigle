'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');

module.exports = funcs => {

  return _.transform(fs.readdirSync(__dirname), (result, filename) => {
    const filepath = `${__dirname}/${filename}`;
    if (path.extname(filename) === '.js' && filename !== 'index.js') {
      const jsname = path.basename(filename, '.js');
      result[jsname] = require(filepath)(funcs);
    }
  }, {});
};

