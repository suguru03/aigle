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

  static resolve(): Aigle<void>;
  static resolve<R>(value: R | PromiseLike<R>): Aigle<R>;

  static reject(reason: any): Aigle<never>;
}

export = Aigle;
export as namespace Aigle;
