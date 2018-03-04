type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);

declare class Aigle<R> implements PromiseLike<R> {

  static test: string;

  constructor(executor: (resolve: (thenableOrResult?: R | PromiseLike<R>) => void, reject: (error?: any) => void, onCancel?: (callback: () => void) => void) => void);

  then<U>(onFulfill?: (value: R) => U | PromiseLike<U>, onReject?: (error: any) => U | PromiseLike<U>): Aigle<U>;
  then<TResult1 = R, TResult2 = never>(
      onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Aigle<TResult1 | TResult2>;

  catch(onReject: (error: any) => R | PromiseLike<R>): Aigle<R>;
  catch<U>(onReject: ((error: any) => U | PromiseLike<U>) | undefined | null): Aigle<U | R>;

  static resolve(): Aigle<void>;
  static resolve<R>(value: R | PromiseLike<R>): Aigle<R>;

  static reject(reason: any): Aigle<never>;
}

export = Aigle;
export as namespace Aigle;
