export default AigleCore.Aigle;
export class Aigle<R> extends AigleCore.Aigle<R> {}
export as namespace Aigle;

declare namespace AigleCore {
  class CancellationError extends Error {}
  class TimeoutError extends Error {}
  type ResolvableProps<T> = object & { [K in keyof T]: T[K] | PromiseLike<T[K]> };

  type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);
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
  }
}
