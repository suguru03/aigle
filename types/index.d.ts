type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);

declare class Aigle<T> implements PromiseLike<T> {

  static test: string;

  constructor(executor: (resolve: (thenableOrResult?: T | PromiseLike<T>) => void, reject: (error?: any) => void, onCancel?: (callback: () => void) => void) => void);

  then<R>(onFulfill?: (value: T) => R | PromiseLike<T>, onReject?: (error: any) => R | PromiseLike<R>): Aigle<R>;
  then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Aigle<TResult1 | TResult2>;

  catch<R>(onFulfill?: (value: T) => R | PromiseLike<R>, onReject?: (error: any) => R | PromiseLike<R>): Aigle<R>;
}

export = Aigle;
export as namespace Aigle;
