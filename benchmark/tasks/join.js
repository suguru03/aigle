'use strict';

module.exports = ({ Aigle, Bluebird }) => {

  return {
    'join:1': {
      doc: true,
      setup: () => {
        this._f0 = () => 0;
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
      doc: true,
      setup: () => {
        this._f0 = () => 0;
        this._f1 = () => 1;
        this._f2 = () => 2;
        this._f3 = () => 3;
        this._f4 = () => 4;
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.join(this._f0, this._f1, this._f2, this._f3, this._f4, this._fn);
      },
      bluebird: () => {
        return Bluebird.join(this._f0, this._f1, this._f2, this._f3, this._f4, this._fn);
      }
    },
    'join:10': {
      doc: true,
      setup: () => {
        this._f0 = () => 0;
        this._f1 = () => 1;
        this._f2 = () => 2;
        this._f3 = () => 3;
        this._f4 = () => 4;
        this._f5 = () => 5;
        this._f6 = () => 6;
        this._f7 = () => 7;
        this._f8 = () => 8;
        this._f9 = () => 9;
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.join(
          this._f0,
          this._f1,
          this._f2,
          this._f3,
          this._f4,
          this._f5,
          this._f6,
          this._f7,
          this._f8,
          this._f9,
          this._fn);
      },
      bluebird: () => {
        return Bluebird.join(
          this._f0,
          this._f1,
          this._f2,
          this._f3,
          this._f4,
          this._f5,
          this._f6,
          this._f7,
          this._f8,
          this._f9,
          this._fn);
      }
    }
  };
};
