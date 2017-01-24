'use strict';

const errorObj = { e: undefined };

module.exports = {
  INTERNAL,
  errorObj,
  tryCatch
};

function INTERNAL() {}

function tryCatch(func, value) {
  try {
    return func(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}
