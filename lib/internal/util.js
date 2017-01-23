'use strict';

const errorObj = { e: undefined };

module.exports = {
  INTERNAL,
  errorObj,
  tryCatch,
  tryCatchWithKey
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

function tryCatchWithKey(func, value, key) {
  try {
    return func(value, key);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}
