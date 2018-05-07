'use strict';

module.exports = {
  resolveStack,
  reconstructStack
};

function resolveStack(promise, parent) {
  const { stack } = new Error();
  promise._stacks = promise._stacks || [];
  if (parent && parent._stacks) {
    promise._stacks.push(...parent._stacks);
  }
  const stacks = stack.split('\n').slice(4);
  promise._stacks.push(stacks.join('\n'));
}

function reconstructStack(promise) {
  const { _value, _stacks } = promise;
  if (_value instanceof Error === false || !_stacks || _value._reconstructed) {
    return;
  }
  const stacks = _value.stack.split('\n');
  let l = _stacks.length;
  while (l--) {
    stacks.push('From previous event:');
    stacks.push(_stacks[l]);
  }
  _value.stack = stacks.join('\n');
  _value._reconstructed = true;
}
