export { Aigle };
export default Aigle;
export as namespace Aigle;

type List<T> = ArrayLike<T>;

type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);

type ArrayIterator<T, TResult> = (value: T, index: number, collection: T[]) => TResult | PromiseLike<TResult>;
type ListIterator<T, TResult> = (value: T, index: number, collection: List<T>) => TResult | PromiseLike<TResult>;
type ObjectIterator<TObject, TResult> = (
  value: TObject[keyof TObject],
  key: string,
  collection: TObject
) => TResult | PromiseLike<TResult>;

declare class Aigle<R> implements PromiseLike<R> {
  /* core functions */

  constructor(
    executor: (
      resolve: (thenableOrResult?: R | PromiseLike<R>) => void,
      reject: (error?: any) => void,
      onCancel?: (callback: () => void) => void
    ) => void
  );

  then<T>(onFulfill?: (value: R) => T | PromiseLike<T>, onReject?: (error: any) => T | PromiseLike<T>): Aigle<T>;
  then<TResult1 = R, TResult2 = never>(
    onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Aigle<TResult1 | TResult2>;

  catch(onReject: (error: any) => R | PromiseLike<R>): Aigle<R>;
  catch<T>(onReject: ((error: any) => T | PromiseLike<T>) | undefined | null): Aigle<T | R>;
  catch<E1, E2, E3, E4, E5>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    filter5: CatchFilter<E5>,
    onReject: (error: E1 | E2 | E3 | E4 | E5) => R | PromiseLike<R>
  ): Aigle<R>;
  catch<T, E1, E2, E3, E4, E5>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    filter5: CatchFilter<E5>,
    onReject: (error: E1 | E2 | E3 | E4 | E5) => T | PromiseLike<T>
  ): Aigle<T | R>;

  catch<E1, E2, E3, E4>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    onReject: (error: E1 | E2 | E3 | E4) => R | PromiseLike<R>
  ): Aigle<R>;

  catch<T, E1, E2, E3, E4>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    filter4: CatchFilter<E4>,
    onReject: (error: E1 | E2 | E3 | E4) => T | PromiseLike<T>
  ): Aigle<T | R>;

  catch<E1, E2, E3>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    onReject: (error: E1 | E2 | E3) => R | PromiseLike<R>
  ): Aigle<R>;
  catch<T, E1, E2, E3>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    filter3: CatchFilter<E3>,
    onReject: (error: E1 | E2 | E3) => T | PromiseLike<T>
  ): Aigle<T | R>;

  catch<E1, E2>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    onReject: (error: E1 | E2) => R | PromiseLike<R>
  ): Aigle<R>;
  catch<T, E1, E2>(
    filter1: CatchFilter<E1>,
    filter2: CatchFilter<E2>,
    onReject: (error: E1 | E2) => T | PromiseLike<T>
  ): Aigle<T | R>;

  catch<E>(filter1: CatchFilter<E>, onReject: (error: E) => R | PromiseLike<R>): Aigle<R>;
  catch<T, E>(filter1: CatchFilter<E>, onReject: (error: E) => T | PromiseLike<T>): Aigle<T | R>;

  finally<T>(handler: () => T | PromiseLike<T>): Aigle<R>;

  /* prpps */

  props<K, V>(this: PromiseLike<Map<K, PromiseLike<V> | V>>): Aigle<Map<K, V>>;

  props<T>(this: PromiseLike<Aigle.ResolvableProps<T>>): Aigle<T>;

  /* each/forEach */

  each<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  each<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  each<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;

  forEach<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  forEach<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  forEach<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;

  /* eachSeries/forEachSeries */

  eachSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  eachSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  eachSeries<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;

  forEachSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  forEachSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  forEachSeries<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;

  /* eachLimit/forEachLimit */

  eachLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;
  eachLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, any>): Aigle<T[]>;

  eachLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;
  eachLimit<T>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, any>): Aigle<List<T>>;

  eachLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;
  eachLimit<T extends object>(this: Aigle<T>, limit: number, iterator: ObjectIterator<T, any>): Aigle<T>;

  forEachLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;
  forEachLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, any>): Aigle<T[]>;

  forEachLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;
  forEachLimit<T>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, any>): Aigle<List<T>>;

  forEachLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;
  forEachLimit<T extends object>(this: Aigle<T>, limit: number, iterator: ObjectIterator<T, any>): Aigle<T>;

  /* map */

  map<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R>): Aigle<R[]>;

  map<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R>): Aigle<R[]>;

  map<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R>): Aigle<R[]>;

  /* mapSeries */

  mapSeries<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R>): Aigle<R[]>;

  mapSeries<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R>): Aigle<R[]>;

  mapSeries<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R>): Aigle<R[]>;

  /* mapLimit */

  mapLimit<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R>): Aigle<R[]>;
  mapLimit<T, R>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, R>): Aigle<R[]>;

  mapLimit<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R>): Aigle<R[]>;
  mapLimit<T, R>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, R>): Aigle<R[]>;

  mapLimit<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R>): Aigle<R[]>;
  mapLimit<T extends object, R>(this: Aigle<T>, limit: number, iterator: ObjectIterator<T, R>): Aigle<R[]>;

  /* concat */

  concat<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

  concat<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

  concat<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;

  /* concatSeries */

  concatSeries<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

  concatSeries<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

  concatSeries<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;

  /* concatLimit */

  concatLimit<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;
  concatLimit<T, R>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, R | R[]>): Aigle<R[]>;

  concatLimit<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;
  concatLimit<T, R>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, R | R[]>): Aigle<R[]>;

  concatLimit<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;
  concatLimit<T extends object, R>(this: Aigle<T>, limit: number, iterator: ObjectIterator<T, R | R[]>): Aigle<R[]>;

  /* every */

  every<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

  every<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

  every<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;

  /* everySeries */

  everySeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

  everySeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

  everySeries<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;

  /* everyLimit */

  everyLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;
  everyLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, boolean>): Aigle<boolean>;

  everyLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;
  everyLimit<T>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, boolean>): Aigle<boolean>;

  everyLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;
  everyLimit<T extends object>(this: Aigle<T>, limit: number, iterator: ObjectIterator<T, boolean>): Aigle<boolean>;

  /* filter */

  filter<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

  filter<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

  filter<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<Array<T[keyof T]>>;

  /* filterSeries */

  filterSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

  filterSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

  filterSeries<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<Array<T[keyof T]>>;

  /* filterLimit */

  filterLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;
  filterLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, boolean>): Aigle<T[]>;

  filterLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;
  filterLimit<T>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, boolean>): Aigle<T[]>;

  filterLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<Array<T[keyof T]>>;
  filterLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* delay */

  delay(ms: number): Aigle<R>;

  /** TODO work in progress **/

  cancel(...args: any[]): Aigle<any>;

  disposer(...args: any[]): Aigle<any>;

  doUntil(...args: any[]): Aigle<any>;

  doWhilst(...args: any[]): Aigle<any>;

  find(...args: any[]): Aigle<any>;

  findIndex(...args: any[]): Aigle<any>;

  findIndexLimit(...args: any[]): Aigle<any>;

  findIndexSeries(...args: any[]): Aigle<any>;

  findKey(...args: any[]): Aigle<any>;

  findKeyLimit(...args: any[]): Aigle<any>;

  findKeySeries(...args: any[]): Aigle<any>;

  findLimit(...args: any[]): Aigle<any>;

  findSeries(...args: any[]): Aigle<any>;

  groupBy(...args: any[]): Aigle<any>;

  groupByLimit(...args: any[]): Aigle<any>;

  groupBySeries(...args: any[]): Aigle<any>;

  isCancelled(...args: any[]): Aigle<any>;

  isFulfilled(...args: any[]): Aigle<any>;

  isPending(...args: any[]): Aigle<any>;

  isRejected(...args: any[]): Aigle<any>;

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
  static resolve<T>(value: T | PromiseLike<T>): Aigle<T>;

  static reject(reason: any): Aigle<never>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>,
      T8 | PromiseLike<T8>,
      T9 | PromiseLike<T9>,
      T10 | PromiseLike<T10>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>,
      T8 | PromiseLike<T8>,
      T9 | PromiseLike<T9>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>,
      T8 | PromiseLike<T8>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>,
      T7 | PromiseLike<T7>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4, T5, T6>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>,
      T6 | PromiseLike<T6>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4, T5>(
    values: [
      T1 | PromiseLike<T1>,
      T2 | PromiseLike<T2>,
      T3 | PromiseLike<T3>,
      T4 | PromiseLike<T4>,
      T5 | PromiseLike<T5>
    ]
  ): Aigle<[T1, T2, T3, T4, T5]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3, T4>(
    values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]
  ): Aigle<[T1, T2, T3, T4]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2, T3>(
    values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]
  ): Aigle<[T1, T2, T3]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Aigle<[T1, T2]>;

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   */
  static all<T>(values: (T | PromiseLike<T>)[]): Aigle<T[]>;

  /* props */

  static props<K, V>(map: PromiseLike<Map<K, PromiseLike<V> | V>> | Map<K, PromiseLike<V> | V>): Aigle<Map<K, V>>;

  static props<T>(object: Aigle.ResolvableProps<T> | PromiseLike<Aigle.ResolvableProps<T>>): Aigle<T>;

  /* each/forEach */

  static each<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  static each<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  static each<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;

  static forEach<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  static forEach<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  static forEach<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;

  /* eachSeries/forEachSeries */

  static eachSeries<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  static eachSeries<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  static eachSeries<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;

  static forEachSeries<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;

  static forEachSeries<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

  static forEachSeries<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;

  /* eachLimit/forEachLimit */

  static eachLimit<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;
  static eachLimit<T>(collection: T[], limit: number, iterator: ArrayIterator<T, any>): Aigle<T[]>;

  static eachLimit<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;
  static eachLimit<T>(collection: List<T>, limit: number, iterator: ListIterator<T, any>): Aigle<List<T>>;

  static eachLimit<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;
  static eachLimit<T extends object>(collection: T, limit: number, iterator: ObjectIterator<T, any>): Aigle<T>;

  static forEachLimit<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;
  static forEachLimit<T>(collection: T[], limit: number, iterator: ArrayIterator<T, any>): Aigle<T[]>;

  static forEachLimit<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;
  static forEachLimit<T>(collection: List<T>, limit: number, iterator: ListIterator<T, any>): Aigle<List<T>>;

  static forEachLimit<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;
  static forEachLimit<T extends object>(collection: T, limit: number, iterator: ObjectIterator<T, any>): Aigle<T>;

  /* map */

  static map<T, R>(collection: T[], iterator?: ArrayIterator<T, R>): Aigle<R[]>;

  static map<T, R>(collection: List<T>, iterator?: ListIterator<T, R>): Aigle<R[]>;

  static map<T extends object, R>(collection: T, iterator?: ObjectIterator<T, R>): Aigle<R[]>;

  /* mapSeries */

  static mapSeries<T, R>(collection: T[], iterator?: ArrayIterator<T, R>): Aigle<R[]>;

  static mapSeries<T, R>(collection: List<T>, iterator?: ListIterator<T, R>): Aigle<R[]>;

  static mapSeries<T extends object, R>(collection: T, iterator?: ObjectIterator<T, R>): Aigle<R[]>;

  /* mapLimit */

  static mapLimit<T, R>(collection: T[], iterator?: ArrayIterator<T, R>): Aigle<R[]>;
  static mapLimit<T, R>(collection: T[], limit: number, iterator: ArrayIterator<T, R>): Aigle<R[]>;

  static mapLimit<T, R>(collection: List<T>, iterator?: ListIterator<T, R>): Aigle<R[]>;
  static mapLimit<T, R>(collection: List<T>, limit: number, iterator: ListIterator<T, R>): Aigle<R[]>;

  static mapLimit<T extends object, R>(collection: T, iterator?: ObjectIterator<T, R>): Aigle<R[]>;
  static mapLimit<T extends object, R>(collection: T, limit: number, iterator: ObjectIterator<T, R>): Aigle<R[]>;

  /* concat */

  static concat<T, R>(collection: T[], iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

  static concat<T, R>(collection: List<T>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

  static concat<T extends object, R>(collection: T, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;

  /* concatSeries */

  static concatSeries<T, R>(collection: T[], iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

  static concatSeries<T, R>(collection: List<T>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

  static concatSeries<T extends object, R>(collection: T, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;

  /* concatLimit */

  static concatLimit<T, R>(collection: T[], iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;
  static concatLimit<T, R>(collection: T[], limit: number, iterator: ArrayIterator<T, R | R[]>): Aigle<R[]>;

  static concatLimit<T, R>(collection: List<T>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;
  static concatLimit<T, R>(collection: List<T>, limit: number, iterator: ListIterator<T, R | R[]>): Aigle<R[]>;

  static concatLimit<T extends object, R>(collection: T, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;
  static concatLimit<T extends object, R>(
    collection: T,
    limit: number,
    iterator: ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* every */

  static every<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

  static every<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

  static every<T extends object>(collection: T, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;

  /* everySeries */

  static everySeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

  static everySeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

  static everySeries<T extends object>(collection: T, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;

  /* everyLimit */

  static everyLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;
  static everyLimit<T>(collection: T[], limit: number, iterator: ArrayIterator<T, boolean>): Aigle<boolean>;

  static everyLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;
  static everyLimit<T>(collection: List<T>, limit: number, iterator: ListIterator<T, boolean>): Aigle<boolean>;

  static everyLimit<T extends object>(collection: T, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;
  static everyLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* filter */

  static filter<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

  static filter<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

  static filter<T extends object>(collection: T, iterator?: ObjectIterator<T, boolean>): Aigle<Array<T[keyof T]>>;

  /* filterSeries */

  static filterSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

  static filterSeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

  static filterSeries<T extends object>(collection: T, iterator?: ObjectIterator<T, boolean>): Aigle<Array<T[keyof T]>>;

  /* filterLimit */

  static filterLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;
  static filterLimit<T>(collection: T[], limit: number, iterator: ArrayIterator<T, boolean>): Aigle<T[]>;

  static filterLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;
  static filterLimit<T>(collection: List<T>, limit: number, iterator: ListIterator<T, boolean>): Aigle<T[]>;

  static filterLimit<T extends object>(collection: T, iterator?: ObjectIterator<T, boolean>): Aigle<Array<T[keyof T]>>;
  static filterLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* delay */

  static delay<T>(ms: number, value?: T): Aigle<T>;

  /** TODO work in progress **/

  static attempt(handler: any): Aigle<any>;

  static config(opts: any): void;

  static default: any;

  static detect(collection: any, iterator: any): Aigle<any>;

  static detectLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static detectSeries(collection: any, iterator: any): Aigle<any>;

  static doUntil(value: any, iterator: any, tester: any): Aigle<any>;

  static doWhilst(value: any, iterator: any, tester: any): Aigle<any>;

  static find(collection: any, iterator: any): Aigle<any>;

  static findIndex(collection: any, iterator: any): Aigle<any>;

  static findIndexLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static findIndexSeries(collection: any, iterator: any): Aigle<any>;

  static findKey(collection: any, iterator: any): Aigle<any>;

  static findKeyLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static findKeySeries(collection: any, iterator: any): Aigle<any>;

  static findLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static findSeries(collection: any, iterator: any): Aigle<any>;

  static groupBy(collection: any, iterator: any): Aigle<any>;

  static groupByLimit(collection: any, limit: any, iterator: any): Aigle<any>;

  static groupBySeries(collection: any, iterator: any): Aigle<any>;

  static join(...args: any[]): Aigle<any>;

  static longStackTraces(): void;

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

  static promisify(fn: any, opts?: any): Aigle<any>;

  static promisifyAll<T extends object>(target: T, options?: any): T;

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
  type ResolvableProps<T> = object & { [K in keyof T]: T[K] | PromiseLike<T[K]> };
}
