'use strict';

const assert = require('assert');

const _  = require('lodash');

const Aigle = require('../../');

const { supportAsyncHook } = require('../../lib/internal/util');

const describe = supportAsyncHook ? global.describe : global.describe.skip;

describe('asyncHook', () => {

  const { createHook, executionAsyncId, AsyncResource } = require('async_hooks');

  const hooks = {};
  const create = name => hooks[name] = (asyncId, ...args) => map[name].set(asyncId, args);
  _.forEach(['init', 'before', 'after', 'destroy', 'promiseResolve'], create);
  const map = _.mapValues(hooks, () => new Map());
  const hook = createHook(hooks);

  before(() => Aigle.config({ asyncResource: true }));

  after(() => Aigle.config({ asyncResource: false }));

  afterEach(() => {
    hook.disable();
    _.forOwn(map, map => map.clear());
  });

  it('should create an async resource', () => {
    hook.enable();
    const tid = executionAsyncId();
    return Aigle.resolve()
      .then(() => {
        const id = executionAsyncId();
        const args = map.init.get(id);
        assert.ok(args);
        const [type, triggerId, resource] = args;
        assert.strictEqual(type, 'PROMISE');
        assert.strictEqual(triggerId, tid);
        assert.ok(resource instanceof AsyncResource);
      });
  });
});
