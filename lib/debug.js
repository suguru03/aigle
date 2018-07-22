'use strict';

module.exports = {
  resolveStack,
  reconstructStack
};

function resolveStack(promise) {
  Error.captureStackTrace(promise);
}

function reconstructStack(promise) {
  const { stack, _value } = promise;
  if (_value instanceof Error === false || !stack) {
    return;
  }
  if (!_value._reconstruct) {
    _value.stack = reconstruct(_value.stack).join('\n');
    _value._reconstruct = true;
  }
  const stacks = reconstruct(stack);
  stacks[0] = '\nFrom previous event:';
  _value.stack += stacks.join('\n');
}

function reconstruct(stack) {
  const result = [];
  const stacks = stack.split('\n');
  for (let i = 0; i < stacks.length; i++) {
    const s = stacks[i];
    if (/node_modules/.test(s)) {
      continue;
    }
    result.push(s);
  }
  return result;
}
