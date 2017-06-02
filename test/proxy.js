'use strict';
const path = require('path');

const AiglePath = path.resolve(process.cwd(), process.env.ENTRY || './');
module.exports = require(AiglePath);