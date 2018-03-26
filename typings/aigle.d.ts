export default Aigle;
export as namespace Aigle;

type List<T> = ArrayLike<T>;

type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);

type ArrayIterator<T, TResult> = (value: T, index: number, collection: T[]) => TResult | PromiseLike<TResult>;
type ListIterator<T, TResult> = (value: T, index: number, collection: List<T>) => TResult | PromiseLike<TResult>;
type ObjectIterator<TObject, TResult> = (value: TObject[keyof TObject], key: string, collection: TObject) => TResult | PromiseLike<TResult>;

declare class Aigle<R> implements PromiseLike<R> {

  /* core functions */

  constructor(executor: (resolve: (thenableOrResult?: R | PromiseLike<R>) => void, reject: (error?: any) => void, onCancel?: (callback: () => void) => void) => void);

  then<U>(onFulfill?: (value: R) => U | PromiseLike<U>, onReject?: (error: any) => U | PromiseLike<U>): Aigle<U>;
  then<TResult1 = R, TResult2 = never>(
    onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Aigle<TResult1 | TResult2>;

  catch(onReject: (error: any) => R | PromiseLike<R>): Aigle<R>;
  catch<U>(onReject: ((error: any) => U | PromiseLike<U>) | undefined | null): Aigle<U | R>;
  catch<E1, E2, E3, E4, E5>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    filter5: CatchFilter<E5>,
    onReject: (error: E1 | E2 | E3 | E4 | E5) => R | PromiseLike<R>,
  ): Aigle<R>;
  catch<U, E1, E2, E3, E4, E5>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    filter5: CatchFilter<E5>,
    onReject: (error: E1 | E2 | E3 | E4 | E5) => U | PromiseLike<U>,
  ): Aigle<U | R>;

  catch<E1, E2, E3, E4>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    onReject: (error: E1 | E2 | E3 | E4) => R | PromiseLike<R>,
  ): Aigle<R>;

  catch<U, E1, E2, E3, E4>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    onReject: (error: E1 | E2 | E3 | E4) => U | PromiseLike<U>,
  ): Aigle<U | R>;

  catch<E1, E2, E3>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    onReject: (error: E1 | E2 | E3) => R | PromiseLike<R>,
  ): Aigle<R>;
  catch<U, E1, E2, E3>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    onReject: (error: E1 | E2 | E3) => U | PromiseLike<U>,
  ): Aigle<U | R>;

  catch<E1, E2>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    onReject: (error: E1 | E2) => R | PromiseLike<R>,
  ): Aigle<R>;
  catch<U, E1, E2>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    onReject: (error: E1 | E2) => U | PromiseLike<U>,
  ): Aigle<U | R>;

  catch<E1>(
    filter1: CatchFilter<E1>,
    onReject: (error: E1) => R | PromiseLike<R>,
  ): Aigle<R>;
  catch<U, E1>(
    filter1: CatchFilter<E1>,
    onReject: (error: E1) => U | PromiseLike<U>,
  ): Aigle<U | R>;

  finally<U>(handler: () => U | PromiseLike<U>): Aigle<R>;

  /* each */

  each<R>(
    this: Aigle<R[]>,
    iterator?: ArrayIterator<R, any>,
  ): Aigle<R[]>;

  each<R>(
    this: Aigle<List<R>>,
    iterator?: ListIterator<R, any>,
  ): Aigle<List<R>>;

  each<R extends object>(
    this: Aigle<R>,
    iterator?: ObjectIterator<R, any>,
  ): Aigle<R>;

  forEach<R>(
    this: Aigle<R[]>,
    iterator?: ArrayIterator<R, any>,
  ): Aigle<R[]>;

  forEach<R>(
    this: Aigle<List<R>>,
    iterator?: ListIterator<R, any>,
  ): Aigle<List<R>>;

  forEach<R extends object>(
    this: Aigle<R>,
    iterator?: ObjectIterator<R, any>,
  ): Aigle<R>;

  /** TODO work in progress **/

  all(...args: any[]): Aigle<any>;

  cancel(...args: any[]): Aigle<any>;

  concat(...args: any[]): Aigle<any>;

  concatLimit(...args: any[]): Aigle<any>;

  concatSeries(...args: any[]): Aigle<any>;

  delay(...args: any[]): Aigle<any>;

  disposer(...args: any[]): Aigle<any>;

  doUntil(...args: any[]): Aigle<any>;

  doWhilst(...args: any[]): Aigle<any>;

  eachLimit(...args: any[]): Aigle<any>;

  eachSeries(...args: any[]): Aigle<any>;

  every(...args: any[]): Aigle<any>;

  everyLimit(...args: any[]): Aigle<any>;

  everySeries(...args: any[]): Aigle<any>;

  filter(...args: any[]): Aigle<any>;

  filterLimit(...args: any[]): Aigle<any>;

  filterSeries(...args: any[]): Aigle<any>;

  find(...args: any[]): Aigle<any>;

  findIndex(...args: any[]): Aigle<any>;

  findIndexLimit(...args: any[]): Aigle<any>;

  findIndexSeries(...args: any[]): Aigle<any>;

  findKey(...args: any[]): Aigle<any>;

  findKeyLimit(...args: any[]): Aigle<any>;

  findKeySeries(...args: any[]): Aigle<any>;

  findLimit(...args: any[]): Aigle<any>;

  findSeries(...args: any[]): Aigle<any>;

  forEachLimit(...args: any[]): Aigle<any>;

  forEachSeries(...args: any[]): Aigle<any>;

  groupBy(...args: any[]): Aigle<any>;

  groupByLimit(...args: any[]): Aigle<any>;

  groupBySeries(...args: any[]): Aigle<any>;

  isCancelled(...args: any[]): Aigle<any>;

  isFulfilled(...args: any[]): Aigle<any>;

  isPending(...args: any[]): Aigle<any>;

  isRejected(...args: any[]): Aigle<any>;

  map(...args: any[]): Aigle<any>;

  mapLimit(...args: any[]): Aigle<any>;

  mapSeries(...args: any[]): Aigle<any>;

  mapValues(...args: any[]): Aigle<any>;

  mapValuesLimit(...args: any[]): Aigle<any>;

  mapValuesSeries(...args: any[]): Aigle<any>;

  omit(...args: any[]): Aigle<any>;

  omitLimit(...args: any[]): Aigle<any>;

  omitSeries(...args: any[]): Aigle<any>;

  parallel(...args: any[]): Aigle<any>;

  pick(...args: any[]): Aigle<any>;

  pickLimit(...args: any[]): Aigle<any>;

  pickSeries(...args: any[]): Aigle<any>;

  props(...args: any[]): Aigle<any>;

  race(...args: any[]): Aigle<any>;

  reason(...args: any[]): Aigle<any>;

  reduce(...args: any[]): Aigle<any>;

  reject(...args: any[]): Aigle<any>;

  rejectLimit(...args: any[]): Aigle<any>;

  rejectSeries(...args: any[]): Aigle<any>;

  some(...args: any[]): Aigle<any>;

  someLimit(...args: any[]): Aigle<any>;

  someSeries(...args: any[]): Aigle<any>;

  sortBy(...args: any[]): Aigle<any>;

  sortByLimit(...args: any[]): Aigle<any>;

  sortBySeries(...args: any[]): Aigle<any>;

  spread(...args: any[]): Aigle<any>;

  suppressUnhandledRejections(...args: any[]): Aigle<any>;

  tap(...args: any[]): Aigle<any>;

  thru(...args: any[]): Aigle<any>;

  timeout(...args: any[]): Aigle<any>;

  times(...args: any[]): Aigle<any>;

  timesLimit(...args: any[]): Aigle<any>;

  timesSeries(...args: any[]): Aigle<any>;

  toString(...args: any[]): Aigle<any>;

  transform(...args: any[]): Aigle<any>;

  transformLimit(...args: any[]): Aigle<any>;

  transformSeries(...args: any[]): Aigle<any>;

  until(...args: any[]): Aigle<any>;

  value(...args: any[]): Aigle<any>;

  whilst(...args: any[]): Aigle<any>;

  /** static **/

  /* core functions */

  static resolve(): Aigle<void>;
  static resolve<R>(value: R | PromiseLike<R>): Aigle<R>;

  static reject(reason: any): Aigle<never>;

  /* each/forEach */

  static each<R>(
    collection: R[],
    iterator?: ArrayIterator<R, any>,
  ): Aigle<R[]>;

  static each<R>(
    collection: List<R>,
    iterator?: ListIterator<R, any>,
  ): Aigle<List<R>>;

  static each<R extends object>(
    collection: R,
    iterator?: ObjectIterator<R, any>,
  ): Aigle<R>;

  static forEach<R>(
    collection: R[],
    iterator?: ArrayIterator<R, any>,
  ): Aigle<R[]>;

  static forEach<R>(
    collection: List<R>,
    iterator?: ListIterator<R, any>,
  ): Aigle<List<R>>;

  static forEach<R extends object>(
    collection: R,
    iterator?: ObjectIterator<R, any>,
  ): Aigle<R>;

  /** TODO work in progress **/

  static all(array: any): Aigle<any>;

  static attempt(handler: any): Aigle<any>;

  static concat(collection: any, iterator: any): Aigle<any>;

  static concatLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static concatSeries(collection: any, iterator: any): Aigle<any>;

  static config(opts: any): void;

  static default: any;

  static delay(ms: any, value: any): Aigle<any>;

  static detect(collection: any, iterator: any): Aigle<any>;

  static detectLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static detectSeries(collection: any, iterator: any): Aigle<any>;

  static doUntil(value: any, iterator: any, tester: any): Aigle<any>;

  static doWhilst(value: any, iterator: any, tester: any): Aigle<any>;

  static eachLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static eachSeries(collection: any, iterator: any): Aigle<any>;

  static every(collection: any, iterator: any): Aigle<any>;

  static everyLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static everySeries(collection: any, iterator: any): Aigle<any>;

  static filter(collection: any, iterator: any): Aigle<any>;

  static filterLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static filterSeries(collection: any, iterator: any): Aigle<any>;

  static find(collection: any, iterator: any): Aigle<any>;

  static findIndex(collection: any, iterator: any): Aigle<any>;

  static findIndexLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static findIndexSeries(collection: any, iterator: any): Aigle<any>;

  static findKey(collection: any, iterator: any): Aigle<any>;

  static findKeyLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static findKeySeries(collection: any, iterator: any): Aigle<any>;

  static findLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static findSeries(collection: any, iterator: any): Aigle<any>;

  static forEachLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static forEachSeries(collection: any, iterator: any): Aigle<any>;

  static groupBy(collection: any, iterator: any): Aigle<any>;

  static groupByLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static groupBySeries(collection: any, iterator: any): Aigle<any>;

  static join(...args: any[]): Aigle<any>;

  static longStackTraces(): void;

  static map(collection: any, iterator: any): Aigle<any>;

  static mapLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static mapSeries(collection: any, iterator: any): Aigle<any>;

  static mapValues(collection: any, iterator: any): Aigle<any>;

  static mapValuesLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static mapValuesSeries(collection: any, iterator: any): Aigle<any>;

  static mixin(sources: any, opts: any): any;

  static omit(collection: any, iterator: any): Aigle<any>;

  static omitLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static omitSeries(collection: any, iterator: any): Aigle<any>;

  static parallel(collection: any): Aigle<any>;

  static pick(collection: any, iterator: any): Aigle<any>;

  static pickLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static pickSeries(collection: any, iterator: any): Aigle<any>;

  static promisify(fn: any, opts: any): Aigle<any>;

  static promisifyAll(target: any, opts: any): Aigle<any>;

  static props(object: any): Aigle<any>;

  static race(collection: any): Aigle<any>;

  static reduce(collection: any, iterator: any, result: any): Aigle<any>;

  static rejectLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static rejectSeries(collection: any, iterator: any): Aigle<any>;

  static retry(times: any, handler: any): Aigle<any>;

  static some(collection: any, iterator: any): Aigle<any>;

  static someLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static someSeries(collection: any, iterator: any): Aigle<any>;

  static sortBy(collection: any, iterator: any): Aigle<any>;

  static sortByLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static sortBySeries(collection: any, iterator: any): Aigle<any>;

  static tap(value: any, onFulfilled: any): Aigle<any>;

  static thru(value: any, onFulfilled: any): Aigle<any>;

  static times(times: any, iterator: any): Aigle<any>;

  static timesLimit(times: any, limit: any, iterator: any): Aigle<any>;

  static timesSeries(times: any, iterator: any): Aigle<any>;

  static transform(collection: any, iterator: any, accumulator: any): Aigle<any>;

  static transformLimit(collection: any, limit: any, iterator: any, accumulator: any): Aigle<any>;

  static transformSeries(collection: any, iterator: any, accumulator: any): Aigle<any>;

  static until(value: any, tester: any, iterator: any): Aigle<any>;

  static using(...args: any[]): Aigle<any>;

  static whilst(value: any, tester: any, iterator: any): Aigle<any>;
}

declare namespace Aigle {
  class CancellationError extends Error {}
  class TimeoutError extends Error {}
}
