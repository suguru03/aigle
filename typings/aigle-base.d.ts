export default AigleCore.Aigle;
export class Aigle<R> extends AigleCore.Aigle<R> {}
export as namespace Aigle;

declare namespace AigleCore {
  class CancellationError extends Error {}
  class TimeoutError extends Error {}
  type ResolvableProps<T> = object & { [K in keyof T]: T[K] | PromiseLike<T[K]> };

  type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);
  type Many<T> = T | T[];
  type List<T> = ArrayLike<T>;
  type Dictionary<T> = Record<string, T>;
  type NotVoid = {} | null | undefined;

  type ArrayIterator<T, TResult = NotVoid> = (
    value: T,
    index: number,
    collection: T[]
  ) => TResult | PromiseLike<TResult>;
  type ListIterator<T, TResult = NotVoid> = (
    value: T,
    index: number,
    collection: List<T>
  ) => TResult | PromiseLike<TResult>;
  type ObjectIterator<T, TResult = NotVoid> = (
    value: T[keyof T],
    key: keyof T,
    collection: T
  ) => TResult | PromiseLike<TResult>;

  type MemoArrayIterator<T, TResult, IResult = any> = (
    accumulator: TResult,
    value: T,
    index: number,
    collection: T[]
  ) => IResult | Promise<IResult>;
  type MemoListIterator<T, TResult, IResult = any> = (
    accumulator: TResult,
    value: T,
    index: number,
    collection: List<T>
  ) => IResult | Promise<IResult>;
  type MemoObjectIterator<T, TResult, IResult = any> = (
    accumulator: TResult,
    value: T[keyof T],
    key: keyof T,
    collection: T
  ) => IResult | Promise<IResult>;

  type PromiseCallback<T> = () => T | Promise<T> | PromiseLike<T>;

  interface ConfigOpts {
    longStackTraces?: boolean;
    cancellation?: boolean;
  }

  interface RetryOpts {
    times?: number;
    interval?: number | ((count?: number) => number);
  }

  export class Aigle<R> implements PromiseLike<R> {
    constructor(
      executor: (
        resolve: (thenableOrResult?: R | PromiseLike<R>) => void,
        reject: (error?: any) => void,
        onCancel?: (callback: () => void) => void
      ) => void
    );

    /* then */

    then<T>(
      onFulfill?: (value: R) => T | PromiseLike<T>,
      onReject?: (error: any) => T | PromiseLike<T>
    ): Aigle<T>;

    then<TResult1 = R, TResult2 = never>(
      onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Aigle<TResult1 | TResult2>;

    /* catch */

    catch(onReject: (error: any) => R | PromiseLike<R>): Aigle<R>;

    catch<T>(onReject: ((error: any) => T | PromiseLike<T>) | undefined | null): Aigle<T | R>;

    @Times(5, 'E', { args: { filter: 'multi' } })
    catch<E>(filter: CatchFilter<E>, onReject: (error: E) => R | PromiseLike<R>): Aigle<R>;

    @Times(5, 'E', { args: { filter: 'multi' } })
    catch<T, E>(filter: CatchFilter<E>, onReject: (error: E) => T | PromiseLike<T>): Aigle<T | R>;

    /* finally */

    finally<T>(handler: () => T | PromiseLike<T>): Aigle<R>;

    /* all */

    /**
     * Creates a Promise that is resolved with an array of results when all of the provided Promises
     * resolve, or rejected when any Promise is rejected.
     * @param values An array of Promises.
     * @returns A new Aigle.
     */
    @Times(10, 'T', { args: { this: 'arrayMulti' }, returnType: 'arrayMulti' })
    all<T>(this: Aigle<[T | PromiseLike<T>]>): Aigle<[T]>;

    all<T>(this: Aigle<(T | PromiseLike<T>)[]>): Aigle<T[]>;

    /* race */

    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
     * or rejected.
     * @param values An array of Promises.
     * @returns A new Aigle.
     */
    @Times(10, 'T', { args: { this: 'arrayMulti' } })
    race<T>(this: Aigle<[T | PromiseLike<T>]>): Aigle<T>;

    race<T>(this: Aigle<(T | PromiseLike<T>)[]>): Aigle<T>;

    /* prpps */

    props<K, V>(this: Aigle<Map<K, PromiseLike<V> | V>>): Aigle<Map<K, V>>;

    props<T>(this: Aigle<ResolvableProps<T>>): Aigle<T>;

    /* series */

    @Times(10, 'T', { args: { this: 'arrayMulti' }, returnType: 'arrayMulti' })
    series<T>(this: Aigle<[T | PromiseLike<T> | PromiseCallback<T>]>): Aigle<[T]>;

    series<T>(this: Aigle<(T | PromiseLike<T> | PromiseCallback<T>)[]>): Aigle<T[]>;

    /* parallel */

    @Times(10, 'T', { args: { this: 'arrayMulti' }, returnType: 'arrayMulti' })
    parallel<T>(this: Aigle<[T | PromiseLike<T> | PromiseCallback<T>]>): Aigle<[T]>;

    parallel<T>(this: Aigle<(T | PromiseLike<T> | PromiseCallback<T>)[]>): Aigle<T[]>;

    /* parallelLimit */

    @Times(10, 'T', { args: { this: 'arrayMulti' }, returnType: 'arrayMulti' })
    parallelLimit<T>(
      this: Aigle<[T | PromiseLike<T> | PromiseCallback<T>]>,
      limit?: number
    ): Aigle<[T]>;

    parallelLimit<T>(
      this: Aigle<(T | PromiseLike<T> | PromiseCallback<T>)[]>,
      limit?: number
    ): Aigle<T[]>;

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

    eachLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, any>
    ): Aigle<List<T>>;

    eachLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;

    eachLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, any>
    ): Aigle<T>;

    forEachLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, any>): Aigle<T[]>;

    forEachLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, any>): Aigle<T[]>;

    forEachLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, any>): Aigle<List<T>>;

    forEachLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, any>
    ): Aigle<List<T>>;

    forEachLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, any>): Aigle<T>;

    forEachLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, any>
    ): Aigle<T>;

    /* map */

    map<T, R>(this: Aigle<T[]>, iterator: ArrayIterator<T, R>): Aigle<R[]>;

    map<T, R>(this: Aigle<List<T>>, iterator: ListIterator<T, R>): Aigle<R[]>;

    map<T extends object, R>(this: Aigle<T>, iterator: ObjectIterator<T, R>): Aigle<R[]>;

    /* mapSeries */

    mapSeries<T, R>(this: Aigle<T[]>, iterator: ArrayIterator<T, R>): Aigle<R[]>;

    mapSeries<T, R>(this: Aigle<List<T>>, iterator: ListIterator<T, R>): Aigle<R[]>;

    mapSeries<T extends object, R>(this: Aigle<T>, iterator: ObjectIterator<T, R>): Aigle<R[]>;

    /* mapLimit */

    mapLimit<T, R>(this: Aigle<T[]>, iterator: ArrayIterator<T, R>): Aigle<R[]>;

    mapLimit<T, R>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, R>): Aigle<R[]>;

    mapLimit<T, R>(this: Aigle<List<T>>, iterator: ListIterator<T, R>): Aigle<R[]>;

    mapLimit<T, R>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, R>): Aigle<R[]>;

    mapLimit<T extends object, R>(this: Aigle<T>, iterator: ObjectIterator<T, R>): Aigle<R[]>;

    mapLimit<T extends object, R>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, R>
    ): Aigle<R[]>;

    /* mapValues */

    mapValues<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R>): Aigle<Dictionary<R>>;

    mapValues<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R>): Aigle<Dictionary<R>>;

    mapValues<T extends object, R>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    /* mapValuesSeries */

    mapValuesSeries<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R>): Aigle<Dictionary<R>>;

    mapValuesSeries<T, R>(
      this: Aigle<List<T>>,
      iterator?: ListIterator<T, R>
    ): Aigle<Dictionary<R>>;

    mapValuesSeries<T extends object, R>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    /* mapValuesLimit */

    mapValuesLimit<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R>): Aigle<Dictionary<R>>;

    mapValuesLimit<T, R>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, R>
    ): Aigle<Dictionary<R>>;

    mapValuesLimit<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R>): Aigle<Dictionary<R>>;
    mapValuesLimit<T, R>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, R>
    ): Aigle<Dictionary<R>>;

    mapValuesLimit<T extends object, R>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    mapValuesLimit<T extends object, R>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    /* concat */

    concat<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

    concat<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

    concat<T extends object, R>(this: Aigle<T>, iterator?: ObjectIterator<T, R | R[]>): Aigle<R[]>;

    /* concatSeries */

    concatSeries<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

    concatSeries<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

    concatSeries<T extends object, R>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;

    /* concatLimit */

    concatLimit<T, R>(this: Aigle<T[]>, iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

    concatLimit<T, R>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, R | R[]>
    ): Aigle<R[]>;

    concatLimit<T, R>(this: Aigle<List<T>>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

    concatLimit<T, R>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, R | R[]>
    ): Aigle<R[]>;

    concatLimit<T extends object, R>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;

    concatLimit<T extends object, R>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;

    /* every */

    every<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    every<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    every<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;

    /* everySeries */

    everySeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    everySeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    everySeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* everyLimit */

    everyLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    everyLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<boolean>;

    everyLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    everyLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<boolean>;

    everyLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    everyLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* some */

    some<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    some<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    some<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T, boolean>): Aigle<boolean>;

    /* someSeries */

    someSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    someSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    someSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* someLimit */

    someLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    someLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<boolean>;

    someLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    someLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<boolean>;

    someLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    someLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* filter */

    filter<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    filter<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    filter<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* filterSeries */

    filterSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    filterSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    filterSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* filterLimit */

    filterLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    filterLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<T[]>;

    filterLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    filterLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T[]>;

    filterLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    filterLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* reject */

    reject<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    reject<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    reject<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* rejectSeries */

    rejectSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    rejectSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    rejectSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* rejectLimit */

    rejectLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    rejectLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<T[]>;

    rejectLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    rejectLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T[]>;

    rejectLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    rejectLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* sortBy */

    sortBy<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<T[]>;

    sortBy<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<T[]>;

    sortBy<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    /* sortBySeries */

    sortBySeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<T[]>;

    sortBySeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<T[]>;

    sortBySeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    /* sortByLimit */

    sortByLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<T[]>;

    sortByLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T>): Aigle<T[]>;

    sortByLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<T[]>;

    sortByLimit<T>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T>): Aigle<T[]>;

    sortByLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    sortByLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    /* find / detect */

    find<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    find<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    find<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    detect<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    detect<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    detect<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    /* findSeries / detectSeries */

    findSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    findSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    findSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    detectSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    detectSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    detectSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    /* findLimit / detectLimit */

    findLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    findLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, boolean>): Aigle<T>;

    findLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    findLimit<T>(this: Aigle<List<T>>, limit: number, iterator: ListIterator<T, boolean>): Aigle<T>;

    findLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    findLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    detectLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    detectLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T, boolean>): Aigle<T>;

    detectLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    detectLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T>;

    detectLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    detectLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    /* findIndex */

    findIndex<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<number>;

    findIndex<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<number>;

    findIndex<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<number>;

    /* findIndexSeries */

    findIndexSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<number>;

    findIndexSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<number>;

    findIndexSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<number>;

    /* findIndexLimit */

    findIndexLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<number>;

    findIndexLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<number>;

    findIndexLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T, boolean>): Aigle<number>;

    findIndexLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<number>;

    findIndexLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<number>;

    findIndexLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<number>;

    /* findKey */

    findKey<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T, boolean>): Aigle<string | undefined>;

    findKey<T>(
      this: Aigle<List<T>>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKey<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    /* findKeySeries */

    findKeySeries<T>(
      this: Aigle<T[]>,
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeySeries<T>(
      this: Aigle<List<T>>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeySeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    /* findKeyLimit */

    findKeyLimit<T>(
      this: Aigle<T[]>,
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeyLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeyLimit<T>(
      this: Aigle<List<T>>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeyLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeyLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    findKeyLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    /* groupBy */

    groupBy<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T[]>>;

    groupBy<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T[]>>;

    groupBy<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Dictionary<T[]>>;

    /* groupBySeries */

    groupBySeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T[]>>;

    groupBySeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T[]>>;

    groupBySeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;

    /* groupByLimit */

    groupByLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T[]>>;

    groupByLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T>
    ): Aigle<Dictionary<T[]>>;

    groupByLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T[]>>;

    groupByLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<Dictionary<T[]>>;

    groupByLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;

    groupByLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;

    /* omit */

    omit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    omit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Dictionary<T>>;

    /* omitBy */

    omitBy<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omitBy<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    omitBy<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Dictionary<T>>;

    /* omitSeries / omitBySeries */

    omitSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omitSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    omitSeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T>>;

    omitBySeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omitBySeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    omitBySeries<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T>>;

    /* omitLimit / omitByLimit */

    omitLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omitLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omitLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    omitLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<Dictionary<T>>;

    omitLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Dictionary<T>>;
    omitLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Dictionary<T>>;

    omitByLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    omitByLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T>
    ): Aigle<Dictionary<T>>;

    omitByLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    omitByLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<Dictionary<T>>;

    omitByLimit<T extends object>(
      this: Aigle<T>,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T>>;

    omitByLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Dictionary<T>>;

    /* pick */

    pick<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pick<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    pick<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Partial<T>>;

    /* pickBy */

    pickBy<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pickBy<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    pickBy<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Partial<T>>;

    /* pickSeries / pickBySeries */

    pickSeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pickSeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    pickSeries<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Partial<T>>;

    pickBySeries<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pickBySeries<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    pickBySeries<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Partial<T>>;

    /* pickLimit / pickByLimit */

    pickLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pickLimit<T>(this: Aigle<T[]>, limit: number, iterator: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pickLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    pickLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<Dictionary<T>>;

    pickLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Partial<T>>;

    pickLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Partial<T>>;

    pickByLimit<T>(this: Aigle<T[]>, iterator?: ArrayIterator<T>): Aigle<Dictionary<T>>;

    pickByLimit<T>(
      this: Aigle<T[]>,
      limit: number,
      iterator: ArrayIterator<T>
    ): Aigle<Dictionary<T>>;

    pickByLimit<T>(this: Aigle<List<T>>, iterator?: ListIterator<T>): Aigle<Dictionary<T>>;

    pickByLimit<T>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<Dictionary<T>>;

    pickByLimit<T extends object>(this: Aigle<T>, iterator?: ObjectIterator<T>): Aigle<Partial<T>>;
    pickByLimit<T extends object>(
      this: Aigle<T>,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Partial<T>>;

    /* transform */

    transform<T, R>(
      this: Aigle<T[]>,
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transform<T, R>(
      this: Aigle<T[]>,
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transform<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transform<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transform<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transform<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    /* transformSeries */

    transformSeries<T, R>(
      this: Aigle<T[]>,
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transformSeries<T, R>(
      this: Aigle<T[]>,
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformSeries<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transformSeries<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformSeries<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformSeries<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    /* transformLimit */

    transformLimit<T, R>(
      this: Aigle<T[]>,
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transformLimit<T, R>(
      this: Aigle<T[]>,
      limit: number,
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transformLimit<T, R>(
      this: Aigle<T[]>,
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformLimit<T, R>(
      this: Aigle<T[]>,
      limit: number,
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformLimit<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transformLimit<T, R>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;

    transformLimit<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformLimit<T, R>(
      this: Aigle<List<T>>,
      limit: number,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformLimit<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformLimit<T extends object, R>(
      this: Aigle<T>,
      limit: number,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    transformLimit<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    transformLimit<T extends object, R>(
      this: Aigle<T>,
      limit: number,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    /* reduce */

    reduce<T, R>(this: Aigle<T[]>, iterator: MemoArrayIterator<T, R, R>, accumulator?: R): Aigle<R>;

    reduce<T, R>(
      this: Aigle<List<T>>,
      iterator: MemoListIterator<T, R, R>,
      accumulator?: R
    ): Aigle<R>;

    reduce<T extends object, R>(
      this: Aigle<T>,
      iterator: MemoObjectIterator<T, R, R>,
      accumulator?: R
    ): Aigle<R>;

    /* delay */

    delay(ms: number): Aigle<R>;

    /* tap */

    tap<T>(this: Aigle<T>, intercepter: (value: T) => any): Aigle<T>;

    /* thru */

    thru<T, R>(this: Aigle<T>, intercepter: (value: T) => R): Aigle<R>;

    /* times */

    times<T>(this: Aigle<number>, iterator?: (num: number) => T): Aigle<T[]>;

    /* timesSeries */

    timesSeries<T>(this: Aigle<number>, iterator?: (num: number) => T): Aigle<T[]>;

    /* timesLimit */

    timesLimit<T>(this: Aigle<number>, iterator?: (num: number) => T): Aigle<T[]>;

    timesLimit<T>(this: Aigle<number>, limit: number, iterator: (num: number) => T): Aigle<T[]>;

    /* doUntil */

    doUntil<T>(this: Aigle<T>, iterator: (value: T) => T, tester: (value: T) => boolean): Aigle<T>;

    /* doWhilst */

    doWhilst<T>(this: Aigle<T>, iterator: (value: T) => T, tester: (value: T) => boolean): Aigle<T>;

    /* until */

    until<T>(this: Aigle<T>, tester: (value: T) => boolean, iterator: (value: T) => T): Aigle<T>;

    /* whilst */

    whilst<T>(this: Aigle<T>, tester: (value: T) => boolean, iterator: (value: T) => T): Aigle<T>;

    /* isCancelled */

    isCancelled(): boolean;

    /* isFulfilled */

    isFulfilled(): boolean;

    /* isPending */

    isPending(): boolean;

    /* isRejected */

    isRejected(): boolean;

    /* value */

    value(): any;

    /* reason */

    reason(): any;

    /* cancel */

    cancel(): void;

    /* disposer */

    disposer(): any;

    /* suppressUnhandledRejections */

    suppressUnhandledRejections(): void;

    /* timeout */

    timeout(ms: number, message?: string | Error): Aigle<R>;

    /* toString */

    toString(): string;

    /** static **/

    /* core functions */

    static resolve(): Aigle<void>;

    static resolve<T>(value: T | PromiseLike<T>): Aigle<T>;

    static reject(reason: any): Aigle<never>;

    static join<T>(...values: T[]): Aigle<T[]>;

    static join<T>(...values: PromiseLike<T>[]): Aigle<T[]>;

    /* all */

    /**
     * Creates a Promise that is resolved with an array of results when all of the provided Promises
     * resolve, or rejected when any Promise is rejected.
     * @param values An array of Promises.
     * @returns A new Aigle.
     */
    @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
    static all<T>(values: [T | PromiseLike<T>]): Aigle<[T]>;

    static all<T>(values: (T | PromiseLike<T>)[]): Aigle<T[]>;

    /* rase */

    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
     * or rejected.
     * @param values An array of Promises.
     * @returns A new Aigle.
     */
    @Times(10, 'T', { args: { values: 'arrayMulti' } })
    static race<T>(values: [T | PromiseLike<T>]): Aigle<T>;

    static race<T>(values: (T | PromiseLike<T>)[]): Aigle<T>;

    /* props */

    static props<K, V>(
      map: PromiseLike<Map<K, PromiseLike<V> | V>> | Map<K, PromiseLike<V> | V>
    ): Aigle<Map<K, V>>;

    static props<T>(object: ResolvableProps<T> | PromiseLike<ResolvableProps<T>>): Aigle<T>;

    /* series */

    @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
    static series<T>(values: [T | PromiseLike<T> | PromiseCallback<T>]): Aigle<[T]>;

    static series<T>(values: (T | PromiseLike<T> | PromiseCallback<T>)[]): Aigle<T[]>;

    /* parallel */

    @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
    static parallel<T>(values: [T | PromiseLike<T> | PromiseCallback<T>]): Aigle<[T]>;

    static parallel<T>(values: (T | PromiseLike<T> | PromiseCallback<T>)[]): Aigle<T[]>;

    /* parallelLimit */

    @Times(10, 'T', { args: { values: 'arrayMulti' }, returnType: 'arrayMulti' })
    static parallelLimit<T>(
      values: [T | PromiseLike<T> | PromiseCallback<T>],
      limit?: number
    ): Aigle<[T]>;

    static parallelLimit<T>(
      values: (T | PromiseLike<T> | PromiseCallback<T>)[],
      limit?: number
    ): Aigle<T[]>;

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

    static forEachSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, any>
    ): Aigle<T>;

    /* eachLimit/forEachLimit */

    static eachLimit<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;
    static eachLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, any>
    ): Aigle<T[]>;

    static eachLimit<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;
    static eachLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, any>
    ): Aigle<List<T>>;

    static eachLimit<T extends object>(collection: T, iterator?: ObjectIterator<T, any>): Aigle<T>;
    static eachLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, any>
    ): Aigle<T>;

    static forEachLimit<T>(collection: T[], iterator?: ArrayIterator<T, any>): Aigle<T[]>;
    static forEachLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, any>
    ): Aigle<T[]>;

    static forEachLimit<T>(collection: List<T>, iterator?: ListIterator<T, any>): Aigle<List<T>>;
    static forEachLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, any>
    ): Aigle<List<T>>;

    static forEachLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, any>
    ): Aigle<T>;
    static forEachLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, any>
    ): Aigle<T>;

    /* map */

    static map<T, R>(collection: T[], iterator: ArrayIterator<T, R>): Aigle<R[]>;

    static map<T, R>(collection: List<T>, iterator: ListIterator<T, R>): Aigle<R[]>;

    static map<T extends object, R>(collection: T, iterator: ObjectIterator<T, R>): Aigle<R[]>;

    /* mapSeries */

    static mapSeries<T, R>(collection: T[], iterator: ArrayIterator<T, R>): Aigle<R[]>;

    static mapSeries<T, R>(collection: List<T>, iterator: ListIterator<T, R>): Aigle<R[]>;

    static mapSeries<T extends object, R>(
      collection: T,
      iterator: ObjectIterator<T, R>
    ): Aigle<R[]>;

    /* mapLimit */

    static mapLimit<T, R>(collection: T[], iterator: ArrayIterator<T, R>): Aigle<R[]>;
    static mapLimit<T, R>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, R>
    ): Aigle<R[]>;

    static mapLimit<T, R>(collection: List<T>, iterator: ListIterator<T, R>): Aigle<R[]>;
    static mapLimit<T, R>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, R>
    ): Aigle<R[]>;

    static mapLimit<T extends object, R>(collection: T, iterator: ObjectIterator<T, R>): Aigle<R[]>;
    static mapLimit<T extends object, R>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, R>
    ): Aigle<R[]>;

    /* mapValues */

    static mapValues<T, R>(collection: T[], iterator?: ArrayIterator<T, R>): Aigle<Dictionary<R>>;

    static mapValues<T, R>(
      collection: List<T>,
      iterator?: ListIterator<T, R>
    ): Aigle<Dictionary<R>>;

    static mapValues<T extends object, R>(
      collection: T,
      iterator?: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    /* mapValuesSeries */

    static mapValuesSeries<T, R>(
      collection: T[],
      iterator?: ArrayIterator<T, R>
    ): Aigle<Dictionary<R>>;

    static mapValuesSeries<T, R>(
      collection: List<T>,
      iterator?: ListIterator<T, R>
    ): Aigle<Dictionary<R>>;

    static mapValuesSeries<T extends object, R>(
      collection: T,
      iterator?: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    /* mapValuesLimit */

    static mapValuesLimit<T, R>(
      collection: T[],
      iterator?: ArrayIterator<T, R>
    ): Aigle<Dictionary<R>>;
    static mapValuesLimit<T, R>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, R>
    ): Aigle<Dictionary<R>>;

    static mapValuesLimit<T, R>(
      collection: List<T>,
      iterator?: ListIterator<T, R>
    ): Aigle<Dictionary<R>>;
    static mapValuesLimit<T, R>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, R>
    ): Aigle<Dictionary<R>>;

    static mapValuesLimit<T extends object, R>(
      collection: T,
      iterator?: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;
    static mapValuesLimit<T extends object, R>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, R>
    ): Aigle<Record<keyof T, R>>;

    /* concat */

    static concat<T, R>(collection: T[], iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

    static concat<T, R>(collection: List<T>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

    static concat<T extends object, R>(
      collection: T,
      iterator?: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;

    /* concatSeries */

    static concatSeries<T, R>(collection: T[], iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;

    static concatSeries<T, R>(collection: List<T>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;

    static concatSeries<T extends object, R>(
      collection: T,
      iterator?: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;

    /* concatLimit */

    static concatLimit<T, R>(collection: T[], iterator?: ArrayIterator<T, R | R[]>): Aigle<R[]>;
    static concatLimit<T, R>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, R | R[]>
    ): Aigle<R[]>;

    static concatLimit<T, R>(collection: List<T>, iterator?: ListIterator<T, R | R[]>): Aigle<R[]>;
    static concatLimit<T, R>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, R | R[]>
    ): Aigle<R[]>;

    static concatLimit<T extends object, R>(
      collection: T,
      iterator?: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;
    static concatLimit<T extends object, R>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, R | R[]>
    ): Aigle<R[]>;

    /* every */

    static every<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    static every<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    static every<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* everySeries */

    static everySeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    static everySeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    static everySeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* everyLimit */

    static everyLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;
    static everyLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<boolean>;

    static everyLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;
    static everyLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<boolean>;

    static everyLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;
    static everyLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* some */

    static some<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    static some<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    static some<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* someSeries */

    static someSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;

    static someSeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;

    static someSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* someLimit */

    static someLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<boolean>;
    static someLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<boolean>;

    static someLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<boolean>;
    static someLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<boolean>;

    static someLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<boolean>;
    static someLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<boolean>;

    /* filter */

    static filter<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    static filter<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    static filter<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* filterSeries */

    static filterSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    static filterSeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    static filterSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* filterLimit */

    static filterLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;
    static filterLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<T[]>;

    static filterLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;
    static filterLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T[]>;

    static filterLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;
    static filterLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* reject */

    static reject<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>; // tslint:disable-line:adjacent-overload-signatures

    static reject<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    static reject<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* rejectSeries */

    static rejectSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;

    static rejectSeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;

    static rejectSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* rejectLimit */

    static rejectLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T[]>;
    static rejectLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<T[]>;

    static rejectLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T[]>;
    static rejectLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T[]>;

    static rejectLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;
    static rejectLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Array<T[keyof T]>>;

    /* sortBy */

    static sortBy<T>(collection: T[], iterator?: ArrayIterator<T>): Aigle<T[]>;

    static sortBy<T>(collection: List<T>, iterator?: ListIterator<T>): Aigle<T[]>;

    static sortBy<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    /* sortBySeries */

    static sortBySeries<T>(collection: T[], iterator?: ArrayIterator<T>): Aigle<T[]>;

    static sortBySeries<T>(collection: List<T>, iterator?: ListIterator<T>): Aigle<T[]>;

    static sortBySeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    /* sortByLimit */

    static sortByLimit<T>(collection: T[], iterator?: ArrayIterator<T>): Aigle<T[]>;
    static sortByLimit<T>(collection: T[], limit: number, iterator: ArrayIterator<T>): Aigle<T[]>;

    static sortByLimit<T>(collection: List<T>, iterator?: ListIterator<T>): Aigle<T[]>;
    static sortByLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<T[]>;

    static sortByLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;
    static sortByLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Array<T[keyof T]>>;

    /* find / detect */

    static find<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    static find<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    static find<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    static detect<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    static detect<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    static detect<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    /* findSeries / detectSeries */

    static findSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    static findSeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    static findSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    static detectSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T>;

    static detectSeries<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T>;

    static detectSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    /* findLimit / detectLimit */

    static findLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T>;
    static findLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<T>;

    static findLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T>;
    static findLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T>;

    static findLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;
    static findLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    static detectLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<T>;
    static detectLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<T>;

    static detectLimit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<T>;
    static detectLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<T>;

    static detectLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;
    static detectLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<T[keyof T]>;

    /* findIndex */

    static findIndex<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<number>;

    static findIndex<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<number>;

    static findIndex<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<number>;

    /* findIndexSeries */

    static findIndexSeries<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<number>;

    static findIndexSeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<number>;

    static findIndexSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<number>;

    /* findIndexLimit */

    static findIndexLimit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<number>;
    static findIndexLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<number>;

    static findIndexLimit<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<number>;
    static findIndexLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<number>;

    static findIndexLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<number>;
    static findIndexLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<number>;

    /* findKey */

    static findKey<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;

    static findKey<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    static findKey<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    /* findKeySeries */

    static findKeySeries<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;

    static findKeySeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    static findKeySeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    /* findKeyLimit */

    static findKeyLimit<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;
    static findKeyLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<string | undefined>;

    static findKeyLimit<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<string | undefined>;
    static findKeyLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<string | undefined>;

    static findKeyLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;
    static findKeyLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<string | undefined>;

    /* groupBy */

    static groupBy<T>(collection: T[], iterator?: ArrayIterator<T>): Aigle<Dictionary<T[]>>;

    static groupBy<T>(collection: List<T>, iterator?: ListIterator<T>): Aigle<Dictionary<T[]>>;

    static groupBy<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;

    /* groupBySeries */

    static groupBySeries<T>(collection: T[], iterator?: ArrayIterator<T>): Aigle<Dictionary<T[]>>;

    static groupBySeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T>
    ): Aigle<Dictionary<T[]>>;

    static groupBySeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;

    /* groupByLimit */

    static groupByLimit<T>(collection: T[], iterator?: ArrayIterator<T>): Aigle<Dictionary<T[]>>;
    static groupByLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T>
    ): Aigle<Dictionary<T[]>>;

    static groupByLimit<T>(collection: List<T>, iterator?: ListIterator<T>): Aigle<Dictionary<T[]>>;
    static groupByLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T>
    ): Aigle<Dictionary<T[]>>;

    static groupByLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;
    static groupByLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T>
    ): Aigle<Dictionary<T[]>>;

    /* omit */

    static omit<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<Dictionary<T>>;

    static omit<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<Dictionary<T>>;

    static omit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;

    /* omitBy */

    static omitBy<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<Dictionary<T>>;

    static omitBy<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitBy<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;

    /* omitSeries / omitBySeries */

    static omitSeries<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitSeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;

    static omitBySeries<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitBySeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitBySeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;

    /* omitLimit / omitByLimit */

    static omitLimit<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static omitLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitLimit<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static omitLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;
    static omitLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;

    static omitByLimit<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static omitByLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitByLimit<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static omitByLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static omitByLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;
    static omitByLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Partial<T>>;

    /* pick */

    static pick<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<Dictionary<T>>;

    static pick<T>(collection: List<T>, iterator?: ListIterator<T, boolean>): Aigle<Dictionary<T>>;

    static pick<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    /* pickBy */

    static pickBy<T>(collection: T[], iterator?: ArrayIterator<T, boolean>): Aigle<Dictionary<T>>;

    static pickBy<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickBy<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    /* pickSeries / pickBySeries */

    static pickSeries<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickSeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickSeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickBySeries<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickBySeries<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickBySeries<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    /* pickLimit / pickByLimit */

    static pickLimit<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static pickLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickLimit<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static pickLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static pickLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T[]>>;

    static pickByLimit<T>(
      collection: T[],
      iterator?: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static pickByLimit<T>(
      collection: T[],
      limit: number,
      iterator: ArrayIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickByLimit<T>(
      collection: List<T>,
      iterator?: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static pickByLimit<T>(
      collection: List<T>,
      limit: number,
      iterator: ListIterator<T, boolean>
    ): Aigle<Dictionary<T>>;

    static pickByLimit<T extends object>(
      collection: T,
      iterator?: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T>>;
    static pickByLimit<T extends object>(
      collection: T,
      limit: number,
      iterator: ObjectIterator<T, boolean>
    ): Aigle<Dictionary<T[]>>;

    /* transform */

    static transform<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transform<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    static transform<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transform<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    static transform<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;
    static transform<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    /* transformSeries */

    static transformSeries<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transformSeries<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    static transformSeries<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transformSeries<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    static transformSeries<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;
    static transformSeries<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    /* transformLimit */

    static transformLimit<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transformLimit<T, R>(
      collection: T[],
      limit: number,
      iterator: MemoArrayIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transformLimit<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;
    static transformLimit<T, R>(
      collection: T[],
      limit: number,
      iterator: MemoArrayIterator<T, Dictionary<R>>,
      accumulator: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    static transformLimit<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transformLimit<T, R>(
      collection: List<T>,
      limit: number,
      iterator: MemoListIterator<T, R[]>,
      accumulator?: R[]
    ): Aigle<R[]>;
    static transformLimit<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;
    static transformLimit<T, R>(
      collection: List<T>,
      limit: number,
      iterator: MemoListIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;

    static transformLimit<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;
    static transformLimit<T extends object, R>(
      collection: T,
      limit: number,
      iterator: MemoObjectIterator<T, Dictionary<R>>,
      accumulator?: Dictionary<R>
    ): Aigle<Dictionary<R>>;
    static transformLimit<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;
    static transformLimit<T extends object, R>(
      collection: T,
      limit: number,
      iterator: MemoObjectIterator<T, R[]>,
      accumulator: R[]
    ): Aigle<R[]>;

    /* reduce */

    static reduce<T, R>(
      collection: T[],
      iterator: MemoArrayIterator<T, R, R>,
      accumulator?: R
    ): Aigle<R>;

    static reduce<T, R>(
      collection: List<T>,
      iterator: MemoListIterator<T, R, R>,
      accumulator?: R
    ): Aigle<R>;

    static reduce<T extends object, R>(
      collection: T,
      iterator: MemoObjectIterator<T, R, R>,
      accumulator?: R
    ): Aigle<R>;

    /* delay */

    static delay<T>(ms: number, value?: T): Aigle<T>;

    /* tap */

    static tap<T>(value: T, intercepter: (value: T) => any): Aigle<T>;

    /* thru */

    static thru<T, R>(value: T, intercepter: (value: T) => R): Aigle<R>;

    /**
     * flow
     * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/lodash/common/util.d.ts#L198
     */
    static flow<R1, R2>(
      f1: () => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>
    ): () => Aigle<R2>;
    static flow<R1, R2, R3>(
      f1: () => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>
    ): () => Aigle<R3>;
    static flow<R1, R2, R3, R4>(
      f1: () => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>
    ): () => Aigle<R4>;
    static flow<R1, R2, R3, R4, R5>(
      f1: () => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>
    ): () => Aigle<R5>;
    static flow<R1, R2, R3, R4, R5, R6>(
      f1: () => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>
    ): () => Aigle<R6>;
    static flow<R1, R2, R3, R4, R5, R6, R7>(
      f1: () => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>,
      f7: (a: R6) => R7 | PromiseLike<R7>,
      ...funcs: Array<Many<(a: any) => any>>
    ): () => Aigle<any>;

    // 1-argument first function
    static flow<A1, R1, R2>(
      f1: (a1: A1) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>
    ): (a1: A1) => Aigle<R2>;
    static flow<A1, R1, R2, R3>(
      f1: (a1: A1) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>
    ): (a1: A1) => Aigle<R3>;
    static flow<A1, R1, R2, R3, R4>(
      f1: (a1: A1) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>
    ): (a1: A1) => Aigle<R4>;
    static flow<A1, R1, R2, R3, R4, R5>(
      f1: (a1: A1) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>
    ): (a1: A1) => Aigle<R5>;
    static flow<A1, R1, R2, R3, R4, R5, R6>(
      f1: (a1: A1) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>
    ): (a1: A1) => Aigle<R6>;
    static flow<A1, R1, R2, R3, R4, R5, R6, R7>(
      f1: (a1: A1) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>,
      f7: (a: R6) => R7 | PromiseLike<R7>,
      ...funcs: Array<Many<(a: any) => any>>
    ): (a1: A1) => Aigle<any>;

    // 2-argument first function
    static flow<A1, A2, R1, R2>(
      f1: (a1: A1, a2: A2) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>
    ): (a1: A1, a2: A2) => Aigle<R2>;
    static flow<A1, A2, R1, R2, R3>(
      f1: (a1: A1, a2: A2) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>
    ): (a1: A1, a2: A2) => Aigle<R3>;
    static flow<A1, A2, R1, R2, R3, R4>(
      f1: (a1: A1, a2: A2) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>
    ): (a1: A1, a2: A2) => Aigle<R4>;
    static flow<A1, A2, R1, R2, R3, R4, R5>(
      f1: (a1: A1, a2: A2) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>
    ): (a1: A1, a2: A2) => Aigle<R5>;
    static flow<A1, A2, R1, R2, R3, R4, R5, R6>(
      f1: (a1: A1, a2: A2) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>
    ): (a1: A1, a2: A2) => Aigle<R6>;
    static flow<A1, A2, R1, R2, R3, R4, R5, R6, R7>(
      f1: (a1: A1, a2: A2) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>,
      f7: (a: R6) => R7 | PromiseLike<R7>,
      ...funcs: Array<Many<(a: any) => any>>
    ): (a1: A1, a2: A2) => Aigle<any>;

    // any-argument first function
    static flow<A1, A2, A3, R1, R2>(
      f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>
    ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R2>;
    static flow<A1, A2, A3, R1, R2, R3>(
      f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>
    ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R3>;
    static flow<A1, A2, A3, R1, R2, R3, R4>(
      f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>
    ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R4>;
    static flow<A1, A2, A3, R1, R2, R3, R4, R5>(
      f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>
    ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R5>;
    static flow<A1, A2, A3, R1, R2, R3, R4, R5, R6>(
      f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>
    ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R6>;
    static flow<A1, A2, A3, R1, R2, R3, R4, R5, R6, R7>(
      f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => R1 | PromiseLike<R1>,
      f2: (a: R1) => R2 | PromiseLike<R2>,
      f3: (a: R2) => R3 | PromiseLike<R3>,
      f4: (a: R3) => R4 | PromiseLike<R4>,
      f5: (a: R4) => R5 | PromiseLike<R5>,
      f6: (a: R5) => R6 | PromiseLike<R6>,
      f7: (a: R6) => R7 | PromiseLike<R7>,
      ...funcs: Array<Many<(a: any) => any>>
    ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<any>;

    /* times */

    static times<T>(n: number, iterator?: (num: number) => T): Aigle<T[]>;

    /* timesSeries */

    static timesSeries<T>(n: number, iterator?: (num: number) => T): Aigle<T[]>;

    /* timesLimit */

    static timesLimit<T>(n: number, iterator?: (num: number) => T): Aigle<T[]>;
    static timesLimit<T>(n: number, limit: number, iterator: (num: number) => T): Aigle<T[]>;

    /* doUntil */

    static doUntil<T>(iterator: (value: T) => T, tester: (value: T) => boolean): Aigle<T>;
    static doUntil<T>(value: T, iterator: (value: T) => T, tester: (value: T) => boolean): Aigle<T>;

    /* doWhilst */

    static doWhilst<T>(iterator: (value: T) => T, tester: (value: T) => boolean): Aigle<T>;
    static doWhilst<T>(
      value: T,
      iterator: (value: T) => T,
      tester: (value: T) => boolean
    ): Aigle<T>;

    /* until */

    static until<T>(tester: (value: T) => boolean, iterator: (value: T) => T): Aigle<T>;
    static until<T>(value: T, tester: (value: T) => boolean, iterator: (value: T) => T): Aigle<T>;

    /* whilst */

    static whilst<T>(tester: (value: T) => boolean, iterator: (value: T) => T): Aigle<T>;
    static whilst<T>(value: T, tester: (value: T) => boolean, iterator: (value: T) => T): Aigle<T>;

    /* retry */

    static retry<T>(handler: () => T | PromiseLike<T>): Aigle<T>;
    static retry<T>(opts: number | RetryOpts, handler: () => T | PromiseLike<T>): Aigle<T>;

    /* config */

    static config(opts: ConfigOpts): void;

    static longStackTraces(): void;

    /** TODO work in progress **/

    static attempt(handler: any): Aigle<any>;

    static default: any;

    static mixin(sources: any, opts: any): any;

    static promisify(fn: any, opts?: any): any;

    static promisifyAll<T extends object>(target: T, options?: any): T;

    static using(...args: any[]): Aigle<any>;
  }
}
