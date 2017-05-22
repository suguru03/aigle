'use strict';

module.exports = ({ Aigle, Bluebird }) => {

  function callResolve(resolve) {
    process.nextTick(resolve);
  }
  return {
    'join': {
      doc: true,
      setup: () => {
        this._f0 = () => new Promise(callResolve);
        this._f1 = () => new Promise(callResolve);
        this._f2 = () => new Promise(callResolve);
        this._f3 = () => new Promise(callResolve);
        this._f4 = () => new Promise(callResolve);
        this._f5 = () => new Promise(callResolve);
        this._f6 = () => new Promise(callResolve);
        this._f7 = () => new Promise(callResolve);
        this._f8 = () => new Promise(callResolve);
        this._f9 = () => new Promise(callResolve);
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.join(
          this._f0(),
          this._f1(),
          this._f2(),
          this._f3(),
          this._f4(),
          this._f5(),
          this._f6(),
          this._f7(),
          this._f8(),
          this._f9(),
          this._fn);
      },
      bluebird: () => {
        return Bluebird.join(
          this._f0(),
          this._f1(),
          this._f2(),
          this._f3(),
          this._f4(),
          this._f5(),
          this._f6(),
          this._f7(),
          this._f8(),
          this._f9(),
          this._fn);
      }
    },
    'join:1': {
      setup: () => {
        this._f0 = () => new Promise(callResolve);
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.join(this._f0, this._fn);
      },
      bluebird: () => {
        return Bluebird.join(this._f0, this._fn);
      }
    },
    'join:5': {
      setup: () => {
        this._f0 = () => new Promise(callResolve);
        this._f1 = () => new Promise(callResolve);
        this._f2 = () => new Promise(callResolve);
        this._f3 = () => new Promise(callResolve);
        this._f4 = () => new Promise(callResolve);
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.join(
          this._f0(),
          this._f1(),
          this._f2(),
          this._f3(),
          this._f4(),
          this._fn);
      },
      bluebird: () => {
        return Bluebird.join(
          this._f0(),
          this._f1(),
          this._f2(),
          this._f3(),
          this._f4(),
          this._fn);
      }
    }
  };
};
