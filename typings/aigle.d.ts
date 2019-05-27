export default Aigle;
export { Aigle };
declare class Aigle<R> implements PromiseLike<R> {
  constructor(
    executor: (
      resolve: (thenableOrResult?: R | PromiseLike<R>) => void,
      reject: (error?: any) => void,
      onCancel?: (callback: () => void) => void
    ) => void
  );

  then<T>(
    onFulfill?: (value: R) => Aigle.ReturnType<T>,
    onReject?: (error: any) => Aigle.ReturnType<T>
  ): Aigle<T>;

  then<TResult1 = R, TResult2 = never>(
    onfulfilled?: ((value: R) => Aigle.ReturnType<TResult1>) | null,
    onrejected?: ((reason: any) => Aigle.ReturnType<TResult2>) | null
  ): Aigle<TResult1 | TResult2>;

  /* catch */

  catch(onReject: (error: any) => Aigle.ReturnType<R>): Aigle<R>;

  catch<T>(onReject: ((error: any) => Aigle.ReturnType<T>) | undefined | null): Aigle<T | R>;

  catch<E1>(filter1: Aigle.CatchFilter<E1>, onReject: (error: E1) => Aigle.ReturnType<R>): Aigle<R>;

  catch<E1, E2>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    onReject: (error: E1 | E2) => Aigle.ReturnType<R>
  ): Aigle<R>;

  catch<E1, E2, E3>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    filter3: Aigle.CatchFilter<E3>,
    onReject: (error: E1 | E2 | E3) => Aigle.ReturnType<R>
  ): Aigle<R>;

  catch<E1, E2, E3, E4>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    filter3: Aigle.CatchFilter<E3>,
    filter4: Aigle.CatchFilter<E4>,
    onReject: (error: E1 | E2 | E3 | E4) => Aigle.ReturnType<R>
  ): Aigle<R>;

  catch<E1, E2, E3, E4, E5>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    filter3: Aigle.CatchFilter<E3>,
    filter4: Aigle.CatchFilter<E4>,
    filter5: Aigle.CatchFilter<E5>,
    onReject: (error: E1 | E2 | E3 | E4 | E5) => Aigle.ReturnType<R>
  ): Aigle<R>;

  catch<T, E1>(
    filter1: Aigle.CatchFilter<E1>,
    onReject: (error: E1) => Aigle.ReturnType<T>
  ): Aigle<T | R>;

  catch<T, E1, E2>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    onReject: (error: E1 | E2) => Aigle.ReturnType<T>
  ): Aigle<T | R>;

  catch<T, E1, E2, E3>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    filter3: Aigle.CatchFilter<E3>,
    onReject: (error: E1 | E2 | E3) => Aigle.ReturnType<T>
  ): Aigle<T | R>;

  catch<T, E1, E2, E3, E4>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    filter3: Aigle.CatchFilter<E3>,
    filter4: Aigle.CatchFilter<E4>,
    onReject: (error: E1 | E2 | E3 | E4) => Aigle.ReturnType<T>
  ): Aigle<T | R>;

  catch<T, E1, E2, E3, E4, E5>(
    filter1: Aigle.CatchFilter<E1>,
    filter2: Aigle.CatchFilter<E2>,
    filter3: Aigle.CatchFilter<E3>,
    filter4: Aigle.CatchFilter<E4>,
    filter5: Aigle.CatchFilter<E5>,
    onReject: (error: E1 | E2 | E3 | E4 | E5) => Aigle.ReturnType<T>
  ): Aigle<T | R>;

  /* finally */

  finally<T>(handler: () => Aigle.ReturnType<T>): Aigle<R>;

  /* all */

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Aigle.
   */
  all<T1>(this: Aigle<[T1 | PromiseLike<T1>]>): Aigle<[T1]>;

  all<T1, T2>(this: Aigle<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]>): Aigle<[T1, T2]>;

  all<T1, T2, T3>(
    this: Aigle<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]>
  ): Aigle<[T1, T2, T3]>;

  all<T1, T2, T3, T4>(
    this: Aigle<
      [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]
    >
  ): Aigle<[T1, T2, T3, T4]>;

  all<T1, T2, T3, T4, T5>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5]>;

  all<T1, T2, T3, T4, T5, T6>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  all<T1, T2, T3, T4, T5, T6, T7>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  all<T1, T2, T3, T4, T5, T6, T7, T8>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>,
        T8 | PromiseLike<T8>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    this: Aigle<
      [
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
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    this: Aigle<
      [
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
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  all<T>(this: Aigle<(T | PromiseLike<T>)[]>): Aigle<T[]>;

  /* allSettled */

  allSettled<T1>(
    this: Aigle<[T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]>
  ): Aigle<[Aigle.AllSettledResponse<T1>]>;

  allSettled<T1, T2>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
      ]
    >
  ): Aigle<[Aigle.AllSettledResponse<T1>, Aigle.AllSettledResponse<T2>]>;

  allSettled<T1, T2, T3>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
      ]
    >
  ): Aigle<
    [Aigle.AllSettledResponse<T1>, Aigle.AllSettledResponse<T2>, Aigle.AllSettledResponse<T3>]
  >;

  allSettled<T1, T2, T3, T4>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>
    ]
  >;

  allSettled<T1, T2, T3, T4, T5>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>
    ]
  >;

  allSettled<T1, T2, T3, T4, T5, T6>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>
    ]
  >;

  allSettled<T1, T2, T3, T4, T5, T6, T7>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>
    ]
  >;

  allSettled<T1, T2, T3, T4, T5, T6, T7, T8>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>,
      Aigle.AllSettledResponse<T8>
    ]
  >;

  allSettled<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>,
      Aigle.AllSettledResponse<T8>,
      Aigle.AllSettledResponse<T9>
    ]
  >;

  allSettled<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
        T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
      ]
    >
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>,
      Aigle.AllSettledResponse<T8>,
      Aigle.AllSettledResponse<T9>,
      Aigle.AllSettledResponse<T10>
    ]
  >;

  allSettled<T>(
    this: Aigle<(T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]>
  ): Aigle<Aigle.AllSettledResponse<T>[]>;

  /* race */

  /**
   * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
   * or rejected.
   * @param values An array of Promises.
   * @returns A new Aigle.
   */
  race<T1>(this: Aigle<[T1 | PromiseLike<T1>]>): Aigle<T1>;

  race<T1, T2>(this: Aigle<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]>): Aigle<T1 | T2>;

  race<T1, T2, T3>(
    this: Aigle<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]>
  ): Aigle<T1 | T2 | T3>;

  race<T1, T2, T3, T4>(
    this: Aigle<
      [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]
    >
  ): Aigle<T1 | T2 | T3 | T4>;

  race<T1, T2, T3, T4, T5>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>
      ]
    >
  ): Aigle<T1 | T2 | T3 | T4 | T5>;

  race<T1, T2, T3, T4, T5, T6>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>
      ]
    >
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6>;

  race<T1, T2, T3, T4, T5, T6, T7>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>
      ]
    >
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7>;

  race<T1, T2, T3, T4, T5, T6, T7, T8>(
    this: Aigle<
      [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>,
        T8 | PromiseLike<T8>
      ]
    >
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;

  race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    this: Aigle<
      [
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
    >
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;

  race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    this: Aigle<
      [
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
    >
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;

  race<T>(this: Aigle<(T | PromiseLike<T>)[]>): Aigle<T>;

  /* prpps */

  props<K, V>(this: Aigle<Map<K, PromiseLike<V> | V>>): Aigle<Map<K, V>>;

  props<T>(this: Aigle<Aigle.ResolvableProps<T>>): Aigle<T>;

  /* series */

  series<T1>(this: Aigle<[T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]>): Aigle<[T1]>;

  series<T1, T2>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
      ]
    >
  ): Aigle<[T1, T2]>;

  series<T1, T2, T3>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
      ]
    >
  ): Aigle<[T1, T2, T3]>;

  series<T1, T2, T3, T4>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
      ]
    >
  ): Aigle<[T1, T2, T3, T4]>;

  series<T1, T2, T3, T4, T5>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5]>;

  series<T1, T2, T3, T4, T5, T6>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  series<T1, T2, T3, T4, T5, T6, T7>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  series<T1, T2, T3, T4, T5, T6, T7, T8>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  series<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  series<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
        T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  series<T>(this: Aigle<(T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]>): Aigle<T[]>;

  /* parallel */

  parallel<T1>(this: Aigle<[T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]>): Aigle<[T1]>;

  parallel<T1, T2>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
      ]
    >
  ): Aigle<[T1, T2]>;

  parallel<T1, T2, T3>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
      ]
    >
  ): Aigle<[T1, T2, T3]>;

  parallel<T1, T2, T3, T4>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
      ]
    >
  ): Aigle<[T1, T2, T3, T4]>;

  parallel<T1, T2, T3, T4, T5>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5]>;

  parallel<T1, T2, T3, T4, T5, T6>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  parallel<T1, T2, T3, T4, T5, T6, T7>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  parallel<T1, T2, T3, T4, T5, T6, T7, T8>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  parallel<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  parallel<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
        T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
      ]
    >
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  parallel<T>(this: Aigle<(T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]>): Aigle<T[]>;

  /* parallelLimit */

  parallelLimit<T1>(
    this: Aigle<[T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]>,
    limit?: number
  ): Aigle<[T1]>;

  parallelLimit<T1, T2>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2]>;

  parallelLimit<T1, T2, T3>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3]>;

  parallelLimit<T1, T2, T3, T4>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4]>;

  parallelLimit<T1, T2, T3, T4, T5>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5]>;

  parallelLimit<T1, T2, T3, T4, T5, T6>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  parallelLimit<T1, T2, T3, T4, T5, T6, T7>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  parallelLimit<T1, T2, T3, T4, T5, T6, T7, T8>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  parallelLimit<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  parallelLimit<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    this: Aigle<
      [
        T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
        T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
        T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
        T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
        T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
        T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
        T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
        T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
        T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
        T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
      ]
    >,
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  parallelLimit<T>(
    this: Aigle<(T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]>,
    limit?: number
  ): Aigle<T[]>;

  /* each/forEach */

  each<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  each<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, any>): Aigle<Aigle.List<T>>;

  each<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T, any>): Aigle<T>;

  forEach<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  forEach<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  forEach<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T, any>): Aigle<T>;

  /* eachSeries/forEachSeries */

  eachSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  eachSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  eachSeries<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T, any>): Aigle<T>;

  forEachSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  forEachSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  forEachSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  /* eachLimit/forEachLimit */

  eachLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  eachLimit<T>(this: Aigle<T[]>, limit: number, iterator: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  eachLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  eachLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  eachLimit<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T, any>): Aigle<T>;

  eachLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  forEachLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  forEachLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, any>
  ): Aigle<T[]>;

  forEachLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  forEachLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  forEachLimit<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T, any>): Aigle<T>;

  forEachLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  /* map */

  map<T, R>(this: Aigle<T[]>, iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;

  map<T, R>(this: Aigle<Aigle.List<T>>, iterator: Aigle.ListIterator<T, R>): Aigle<R[]>;

  map<T extends object, R>(this: Aigle<T>, iterator: Aigle.ObjectIterator<T, R>): Aigle<R[]>;

  /* mapSeries */

  mapSeries<T, R>(this: Aigle<T[]>, iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;

  mapSeries<T, R>(this: Aigle<Aigle.List<T>>, iterator: Aigle.ListIterator<T, R>): Aigle<R[]>;

  mapSeries<T extends object, R>(this: Aigle<T>, iterator: Aigle.ObjectIterator<T, R>): Aigle<R[]>;

  /* mapLimit */

  mapLimit<T, R>(this: Aigle<T[]>, iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;

  mapLimit<T, R>(this: Aigle<T[]>, limit: number, iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;

  mapLimit<T, R>(this: Aigle<Aigle.List<T>>, iterator: Aigle.ListIterator<T, R>): Aigle<R[]>;

  mapLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, R>
  ): Aigle<R[]>;

  mapLimit<T extends object, R>(this: Aigle<T>, iterator: Aigle.ObjectIterator<T, R>): Aigle<R[]>;

  mapLimit<T extends object, R>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, R>
  ): Aigle<R[]>;

  /* mapValues */

  mapValues<T, R>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValues<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValues<T extends object, R>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  /* mapValuesSeries */

  mapValuesSeries<T, R>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValuesSeries<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValuesSeries<T extends object, R>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  /* mapValuesLimit */

  mapValuesLimit<T, R>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValuesLimit<T, R>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValuesLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;
  mapValuesLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  mapValuesLimit<T extends object, R>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  mapValuesLimit<T extends object, R>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  /* concat */

  concat<T, R>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, R | R[]>): Aigle<R[]>;

  concat<T, R>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, R | R[]>): Aigle<R[]>;

  concat<T extends object, R>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* concatSeries */

  concatSeries<T, R>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, R | R[]>): Aigle<R[]>;

  concatSeries<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;

  concatSeries<T extends object, R>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* concatLimit */

  concatLimit<T, R>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, R | R[]>): Aigle<R[]>;

  concatLimit<T, R>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, R | R[]>
  ): Aigle<R[]>;

  concatLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;

  concatLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;

  concatLimit<T extends object, R>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  concatLimit<T extends object, R>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* every */

  every<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  every<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<boolean>;

  every<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* everySeries */

  everySeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  everySeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  everySeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* everyLimit */

  everyLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  everyLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<boolean>;

  everyLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  everyLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  everyLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  everyLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* some */

  some<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  some<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<boolean>;

  some<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* someSeries */

  someSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  someSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  someSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* someLimit */

  someLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  someLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<boolean>;

  someLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  someLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  someLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  someLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* filter */

  filter<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  filter<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T[]>;

  filter<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* filterSeries */

  filterSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  filterSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  filterSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* filterLimit */

  filterLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  filterLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T[]>;

  filterLimit<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T[]>;

  filterLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  filterLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  filterLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* reject */

  reject<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  reject<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T[]>;

  reject<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* rejectSeries */

  rejectSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  rejectSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  rejectSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* rejectLimit */

  rejectLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  rejectLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T[]>;

  rejectLimit<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T[]>;

  rejectLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  rejectLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  rejectLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* sortBy */

  sortBy<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<T[]>;

  sortBy<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T>): Aigle<T[]>;

  sortBy<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  /* sortBySeries */

  sortBySeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<T[]>;

  sortBySeries<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T>): Aigle<T[]>;

  sortBySeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  /* sortByLimit */

  sortByLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<T[]>;

  sortByLimit<T>(this: Aigle<T[]>, limit: number, iterator: Aigle.ArrayIterator<T>): Aigle<T[]>;

  sortByLimit<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T>): Aigle<T[]>;

  sortByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<T[]>;

  sortByLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  sortByLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  /* find / detect */

  find<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  find<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  find<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  detect<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  detect<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  detect<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  /* findSeries / detectSeries */

  findSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  findSeries<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  findSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  detectSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  detectSeries<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  detectSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  /* findLimit / detectLimit */

  findLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  findLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T>;

  findLimit<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  findLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;

  findLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  findLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  detectLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  detectLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T>;

  detectLimit<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  detectLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;

  detectLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  detectLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  /* findIndex */

  findIndex<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<number>;

  findIndex<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  findIndex<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  /* findIndexSeries */

  findIndexSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<number>;

  findIndexSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  findIndexSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  /* findIndexLimit */

  findIndexLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<number>;

  findIndexLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<number>;

  findIndexLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  findIndexLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  findIndexLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  findIndexLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  /* findKey */

  findKey<T>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKey<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKey<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  /* findKeySeries */

  findKeySeries<T>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeySeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeySeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  /* findKeyLimit */

  findKeyLimit<T>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeyLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeyLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeyLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeyLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  findKeyLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  /* groupBy */

  groupBy<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T[]>>;

  groupBy<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupBy<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* groupBySeries */

  groupBySeries<T>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupBySeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupBySeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* groupByLimit */

  groupByLimit<T>(
    this: Aigle<T[]>,
    iterator?: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupByLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupByLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  groupByLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* omit */

  omit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omit<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  /* omitBy */

  omitBy<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omitBy<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitBy<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  /* omitSeries / omitBySeries */

  omitSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omitSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitBySeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omitBySeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitBySeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  /* omitLimit / omitByLimit */

  omitLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omitLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;
  omitLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitByLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  omitByLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitByLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  omitByLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  /* pick */

  pick<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pick<T>(this: Aigle<Aigle.List<T>>, iterator?: Aigle.ListIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pick<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T>): Aigle<Partial<T>>;

  /* pickBy */

  pickBy<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pickBy<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickBy<T extends object>(this: Aigle<T>, iterator?: Aigle.ObjectIterator<T>): Aigle<Partial<T>>;

  /* pickSeries / pickBySeries */

  pickSeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pickSeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickSeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Partial<T>>;

  pickBySeries<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pickBySeries<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickBySeries<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Partial<T>>;

  /* pickLimit / pickByLimit */

  pickLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pickLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Partial<T>>;

  pickLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Partial<T>>;

  pickByLimit<T>(this: Aigle<T[]>, iterator?: Aigle.ArrayIterator<T>): Aigle<Aigle.Dictionary<T>>;

  pickByLimit<T>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickByLimit<T>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T>>;

  pickByLimit<T extends object>(
    this: Aigle<T>,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Partial<T>>;
  pickByLimit<T extends object>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Partial<T>>;

  /* transform */

  transform<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transform<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transform<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transform<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transform<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transform<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  /* transformSeries */

  transformSeries<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transformSeries<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformSeries<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transformSeries<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformSeries<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformSeries<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  /* transformLimit */

  transformLimit<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transformLimit<T, R>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transformLimit<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformLimit<T, R>(
    this: Aigle<T[]>,
    limit: number,
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transformLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;

  transformLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformLimit<T, R>(
    this: Aigle<Aigle.List<T>>,
    limit: number,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformLimit<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformLimit<T extends object, R>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  transformLimit<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  transformLimit<T extends object, R>(
    this: Aigle<T>,
    limit: number,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  /* reduce */

  reduce<T, R>(
    this: Aigle<T[]>,
    iterator: Aigle.MemoArrayIterator<T, R, R>,
    accumulator?: R
  ): Aigle<R>;

  reduce<T, R>(
    this: Aigle<Aigle.List<T>>,
    iterator: Aigle.MemoListIterator<T, R, R>,
    accumulator?: R
  ): Aigle<R>;

  reduce<T extends object, R>(
    this: Aigle<T>,
    iterator: Aigle.MemoObjectIterator<T, R, R>,
    accumulator?: R
  ): Aigle<R>;

  /* delay */

  delay(ms: number): Aigle<R>;

  /* tap */

  tap(intercepter: (value: R) => Aigle.ReturnType<any>): Aigle<R>;

  /* thru */

  thru<T>(intercepter: (value: R) => Aigle.ReturnType<T>): Aigle<T>;

  /* times */

  times<T>(this: Aigle<number>, iterator?: (num: number) => Aigle.ReturnType<T>): Aigle<T[]>;

  /* timesSeries */

  timesSeries<T>(this: Aigle<number>, iterator?: (num: number) => Aigle.ReturnType<T>): Aigle<T[]>;

  /* timesLimit */

  timesLimit<T>(this: Aigle<number>, iterator?: (num: number) => Aigle.ReturnType<T>): Aigle<T[]>;

  timesLimit<T>(
    this: Aigle<number>,
    limit: number,
    iterator: (num: number) => Aigle.ReturnType<T>
  ): Aigle<T[]>;

  /* doUntil */

  doUntil<T>(
    this: Aigle<T>,
    iterator: (value: T) => Aigle.ReturnType<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>
  ): Aigle<T>;

  /* doWhilst */

  doWhilst<T>(
    this: Aigle<T>,
    iterator: (value: T) => Aigle.ReturnType<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>
  ): Aigle<T>;

  /* until */

  until<T>(
    this: Aigle<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>,
    iterator: (value: T) => Aigle.ReturnType<T>
  ): Aigle<T>;

  /* whilst */

  whilst<T>(
    this: Aigle<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>,
    iterator: (value: T) => Aigle.ReturnType<T>
  ): Aigle<T>;

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

  disposer(fn: (value: R) => any): Aigle.Disposer<R>;

  /* suppressUnhandledRejections */

  suppressUnhandledRejections(): void;

  /* timeout */

  timeout(ms: number, message?: string | Error): Aigle<R>;

  /* toString */

  toString(): string;

  /** static **/

  /* core functions */

  static resolve(): Aigle<void>;

  static resolve<T>(value: Aigle.ReturnType<T>): Aigle<T>;

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
  static all<T1>(values: [Aigle.ReturnType<T1>]): Aigle<[T1]>;

  static all<T1, T2>(values: [Aigle.ReturnType<T1>, Aigle.ReturnType<T2>]): Aigle<[T1, T2]>;

  static all<T1, T2, T3>(
    values: [Aigle.ReturnType<T1>, Aigle.ReturnType<T2>, Aigle.ReturnType<T3>]
  ): Aigle<[T1, T2, T3]>;

  static all<T1, T2, T3, T4>(
    values: [Aigle.ReturnType<T1>, Aigle.ReturnType<T2>, Aigle.ReturnType<T3>, Aigle.ReturnType<T4>]
  ): Aigle<[T1, T2, T3, T4]>;

  static all<T1, T2, T3, T4, T5>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>
    ]
  ): Aigle<[T1, T2, T3, T4, T5]>;

  static all<T1, T2, T3, T4, T5, T6>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  static all<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  static all<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>,
      Aigle.ReturnType<T8>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>,
      Aigle.ReturnType<T8>,
      Aigle.ReturnType<T9>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>,
      Aigle.ReturnType<T8>,
      Aigle.ReturnType<T9>,
      Aigle.ReturnType<T10>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  static all<T>(values: (Aigle.ReturnType<T>)[]): Aigle<T[]>;

  /* allSettled */

  static allSettled<T1>(
    values: [T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]
  ): Aigle<[Aigle.AllSettledResponse<T1>]>;

  static allSettled<T1, T2>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
    ]
  ): Aigle<[Aigle.AllSettledResponse<T1>, Aigle.AllSettledResponse<T2>]>;

  static allSettled<T1, T2, T3>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
    ]
  ): Aigle<
    [Aigle.AllSettledResponse<T1>, Aigle.AllSettledResponse<T2>, Aigle.AllSettledResponse<T3>]
  >;

  static allSettled<T1, T2, T3, T4>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>
    ]
  >;

  static allSettled<T1, T2, T3, T4, T5>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>
    ]
  >;

  static allSettled<T1, T2, T3, T4, T5, T6>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>
    ]
  >;

  static allSettled<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>
    ]
  >;

  static allSettled<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>,
      Aigle.AllSettledResponse<T8>
    ]
  >;

  static allSettled<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>,
      Aigle.AllSettledResponse<T8>,
      Aigle.AllSettledResponse<T9>
    ]
  >;

  static allSettled<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
      T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
    ]
  ): Aigle<
    [
      Aigle.AllSettledResponse<T1>,
      Aigle.AllSettledResponse<T2>,
      Aigle.AllSettledResponse<T3>,
      Aigle.AllSettledResponse<T4>,
      Aigle.AllSettledResponse<T5>,
      Aigle.AllSettledResponse<T6>,
      Aigle.AllSettledResponse<T7>,
      Aigle.AllSettledResponse<T8>,
      Aigle.AllSettledResponse<T9>,
      Aigle.AllSettledResponse<T10>
    ]
  >;

  static allSettled<T>(
    values: (T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]
  ): Aigle<Aigle.AllSettledResponse<T>[]>;

  /* rase */

  /**
   * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
   * or rejected.
   * @param values An array of Promises.
   * @returns A new Aigle.
   */
  static race<T1>(values: [Aigle.ReturnType<T1>]): Aigle<T1>;

  static race<T1, T2>(values: [Aigle.ReturnType<T1>, Aigle.ReturnType<T2>]): Aigle<T1 | T2>;

  static race<T1, T2, T3>(
    values: [Aigle.ReturnType<T1>, Aigle.ReturnType<T2>, Aigle.ReturnType<T3>]
  ): Aigle<T1 | T2 | T3>;

  static race<T1, T2, T3, T4>(
    values: [Aigle.ReturnType<T1>, Aigle.ReturnType<T2>, Aigle.ReturnType<T3>, Aigle.ReturnType<T4>]
  ): Aigle<T1 | T2 | T3 | T4>;

  static race<T1, T2, T3, T4, T5>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>
    ]
  ): Aigle<T1 | T2 | T3 | T4 | T5>;

  static race<T1, T2, T3, T4, T5, T6>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>
    ]
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6>;

  static race<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>
    ]
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7>;

  static race<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>,
      Aigle.ReturnType<T8>
    ]
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;

  static race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>,
      Aigle.ReturnType<T8>,
      Aigle.ReturnType<T9>
    ]
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;

  static race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      Aigle.ReturnType<T1>,
      Aigle.ReturnType<T2>,
      Aigle.ReturnType<T3>,
      Aigle.ReturnType<T4>,
      Aigle.ReturnType<T5>,
      Aigle.ReturnType<T6>,
      Aigle.ReturnType<T7>,
      Aigle.ReturnType<T8>,
      Aigle.ReturnType<T9>,
      Aigle.ReturnType<T10>
    ]
  ): Aigle<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;

  static race<T>(values: (Aigle.ReturnType<T>)[]): Aigle<T>;

  /* props */

  static props<K, V>(
    map: PromiseLike<Map<K, PromiseLike<V> | V>> | Map<K, PromiseLike<V> | V>
  ): Aigle<Map<K, V>>;

  static props<T>(
    object: Aigle.ResolvableProps<T> | PromiseLike<Aigle.ResolvableProps<T>>
  ): Aigle<T>;

  /* series */

  static series<T1>(values: [T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]): Aigle<[T1]>;

  static series<T1, T2>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
    ]
  ): Aigle<[T1, T2]>;

  static series<T1, T2, T3>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
    ]
  ): Aigle<[T1, T2, T3]>;

  static series<T1, T2, T3, T4>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
    ]
  ): Aigle<[T1, T2, T3, T4]>;

  static series<T1, T2, T3, T4, T5>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
    ]
  ): Aigle<[T1, T2, T3, T4, T5]>;

  static series<T1, T2, T3, T4, T5, T6>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  static series<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  static series<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  static series<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  static series<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
      T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  static series<T>(values: (T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]): Aigle<T[]>;

  /* parallel */

  static parallel<T1>(values: [T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>]): Aigle<[T1]>;

  static parallel<T1, T2>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
    ]
  ): Aigle<[T1, T2]>;

  static parallel<T1, T2, T3>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
    ]
  ): Aigle<[T1, T2, T3]>;

  static parallel<T1, T2, T3, T4>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
    ]
  ): Aigle<[T1, T2, T3, T4]>;

  static parallel<T1, T2, T3, T4, T5>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
    ]
  ): Aigle<[T1, T2, T3, T4, T5]>;

  static parallel<T1, T2, T3, T4, T5, T6>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  static parallel<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  static parallel<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  static parallel<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  static parallel<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
      T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
    ]
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  static parallel<T>(values: (T | PromiseLike<T> | Aigle.PromiseCallback<T>)[]): Aigle<T[]>;

  /* parallelLimit */

  static parallelLimit<T1>(
    values: [T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>],
    limit?: number
  ): Aigle<[T1]>;

  static parallelLimit<T1, T2>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>
    ],
    limit?: number
  ): Aigle<[T1, T2]>;

  static parallelLimit<T1, T2, T3>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3]>;

  static parallelLimit<T1, T2, T3, T4>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4]>;

  static parallelLimit<T1, T2, T3, T4, T5>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5]>;

  static parallelLimit<T1, T2, T3, T4, T5, T6>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6]>;

  static parallelLimit<T1, T2, T3, T4, T5, T6, T7>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7]>;

  static parallelLimit<T1, T2, T3, T4, T5, T6, T7, T8>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  static parallelLimit<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  static parallelLimit<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
    values: [
      T1 | PromiseLike<T1> | Aigle.PromiseCallback<T1>,
      T2 | PromiseLike<T2> | Aigle.PromiseCallback<T2>,
      T3 | PromiseLike<T3> | Aigle.PromiseCallback<T3>,
      T4 | PromiseLike<T4> | Aigle.PromiseCallback<T4>,
      T5 | PromiseLike<T5> | Aigle.PromiseCallback<T5>,
      T6 | PromiseLike<T6> | Aigle.PromiseCallback<T6>,
      T7 | PromiseLike<T7> | Aigle.PromiseCallback<T7>,
      T8 | PromiseLike<T8> | Aigle.PromiseCallback<T8>,
      T9 | PromiseLike<T9> | Aigle.PromiseCallback<T9>,
      T10 | PromiseLike<T10> | Aigle.PromiseCallback<T10>
    ],
    limit?: number
  ): Aigle<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  static parallelLimit<T>(
    values: (T | PromiseLike<T> | Aigle.PromiseCallback<T>)[],
    limit?: number
  ): Aigle<T[]>;

  /* each/forEach */

  static each<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  static each<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  static each<T extends object>(collection: T, iterator?: Aigle.ObjectIterator<T, any>): Aigle<T>;

  static forEach<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  static forEach<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  static forEach<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  /* eachSeries/forEachSeries */

  static eachSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  static eachSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  static eachSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  static forEachSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;

  static forEachSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  static forEachSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  /* eachLimit/forEachLimit */

  static eachLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;
  static eachLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, any>
  ): Aigle<T[]>;

  static eachLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;
  static eachLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  static eachLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;
  static eachLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  static forEachLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, any>): Aigle<T[]>;
  static forEachLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, any>
  ): Aigle<T[]>;

  static forEachLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;
  static forEachLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, any>
  ): Aigle<Aigle.List<T>>;

  static forEachLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;
  static forEachLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, any>
  ): Aigle<T>;

  /* map */

  static map<T, R>(collection: T[], iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;

  static map<T, R>(collection: Aigle.List<T>, iterator: Aigle.ListIterator<T, R>): Aigle<R[]>;

  static map<T extends object, R>(collection: T, iterator: Aigle.ObjectIterator<T, R>): Aigle<R[]>;

  /* mapSeries */

  static mapSeries<T, R>(collection: T[], iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;

  static mapSeries<T, R>(collection: Aigle.List<T>, iterator: Aigle.ListIterator<T, R>): Aigle<R[]>;

  static mapSeries<T extends object, R>(
    collection: T,
    iterator: Aigle.ObjectIterator<T, R>
  ): Aigle<R[]>;

  /* mapLimit */

  static mapLimit<T, R>(collection: T[], iterator: Aigle.ArrayIterator<T, R>): Aigle<R[]>;
  static mapLimit<T, R>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, R>
  ): Aigle<R[]>;

  static mapLimit<T, R>(collection: Aigle.List<T>, iterator: Aigle.ListIterator<T, R>): Aigle<R[]>;
  static mapLimit<T, R>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, R>
  ): Aigle<R[]>;

  static mapLimit<T extends object, R>(
    collection: T,
    iterator: Aigle.ObjectIterator<T, R>
  ): Aigle<R[]>;
  static mapLimit<T extends object, R>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, R>
  ): Aigle<R[]>;

  /* mapValues */

  static mapValues<T, R>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  static mapValues<T, R>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  static mapValues<T extends object, R>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  /* mapValuesSeries */

  static mapValuesSeries<T, R>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  static mapValuesSeries<T, R>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  static mapValuesSeries<T extends object, R>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  /* mapValuesLimit */

  static mapValuesLimit<T, R>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;
  static mapValuesLimit<T, R>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  static mapValuesLimit<T, R>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;
  static mapValuesLimit<T, R>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, R>
  ): Aigle<Aigle.Dictionary<R>>;

  static mapValuesLimit<T extends object, R>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;
  static mapValuesLimit<T extends object, R>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, R>
  ): Aigle<Record<keyof T, R>>;

  /* concat */

  static concat<T, R>(collection: T[], iterator?: Aigle.ArrayIterator<T, R | R[]>): Aigle<R[]>;

  static concat<T, R>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;

  static concat<T extends object, R>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* concatSeries */

  static concatSeries<T, R>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, R | R[]>
  ): Aigle<R[]>;

  static concatSeries<T, R>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;

  static concatSeries<T extends object, R>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* concatLimit */

  static concatLimit<T, R>(collection: T[], iterator?: Aigle.ArrayIterator<T, R | R[]>): Aigle<R[]>;
  static concatLimit<T, R>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, R | R[]>
  ): Aigle<R[]>;

  static concatLimit<T, R>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;
  static concatLimit<T, R>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, R | R[]>
  ): Aigle<R[]>;

  static concatLimit<T extends object, R>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;
  static concatLimit<T extends object, R>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, R | R[]>
  ): Aigle<R[]>;

  /* every */

  static every<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  static every<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  static every<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* everySeries */

  static everySeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<boolean>;

  static everySeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  static everySeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* everyLimit */

  static everyLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;
  static everyLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<boolean>;

  static everyLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;
  static everyLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  static everyLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;
  static everyLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* some */

  static some<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  static some<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  static some<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* someSeries */

  static someSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;

  static someSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  static someSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* someLimit */

  static someLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<boolean>;
  static someLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<boolean>;

  static someLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;
  static someLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<boolean>;

  static someLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;
  static someLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<boolean>;

  /* filter */

  static filter<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  static filter<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  static filter<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* filterSeries */

  static filterSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  static filterSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  static filterSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* filterLimit */

  static filterLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;
  static filterLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T[]>;

  static filterLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;
  static filterLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  static filterLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;
  static filterLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* reject */

  static reject<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>; // tslint:disable-line:adjacent-overload-signatures

  static reject<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  static reject<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* rejectSeries */

  static rejectSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;

  static rejectSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  static rejectSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* rejectLimit */

  static rejectLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T[]>;
  static rejectLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T[]>;

  static rejectLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;
  static rejectLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T[]>;

  static rejectLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;
  static rejectLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Array<T[keyof T]>>;

  /* sortBy */

  static sortBy<T>(collection: T[], iterator?: Aigle.ArrayIterator<T>): Aigle<T[]>;

  static sortBy<T>(collection: Aigle.List<T>, iterator?: Aigle.ListIterator<T>): Aigle<T[]>;

  static sortBy<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  /* sortBySeries */

  static sortBySeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T>): Aigle<T[]>;

  static sortBySeries<T>(collection: Aigle.List<T>, iterator?: Aigle.ListIterator<T>): Aigle<T[]>;

  static sortBySeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  /* sortByLimit */

  static sortByLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T>): Aigle<T[]>;
  static sortByLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<T[]>;

  static sortByLimit<T>(collection: Aigle.List<T>, iterator?: Aigle.ListIterator<T>): Aigle<T[]>;
  static sortByLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<T[]>;

  static sortByLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;
  static sortByLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Array<T[keyof T]>>;

  /* find / detect */

  static find<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  static find<T>(collection: Aigle.List<T>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  static find<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  static detect<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  static detect<T>(collection: Aigle.List<T>, iterator?: Aigle.ListIterator<T, boolean>): Aigle<T>;

  static detect<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  /* findSeries / detectSeries */

  static findSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  static findSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;

  static findSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  static detectSeries<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;

  static detectSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;

  static detectSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  /* findLimit / detectLimit */

  static findLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;
  static findLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T>;

  static findLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;
  static findLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;

  static findLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;
  static findLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  static detectLimit<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<T>;
  static detectLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<T>;

  static detectLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;
  static detectLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<T>;

  static detectLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;
  static detectLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<T[keyof T]>;

  /* findIndex */

  static findIndex<T>(collection: T[], iterator?: Aigle.ArrayIterator<T, boolean>): Aigle<number>;

  static findIndex<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  static findIndex<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  /* findIndexSeries */

  static findIndexSeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<number>;

  static findIndexSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  static findIndexSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  /* findIndexLimit */

  static findIndexLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<number>;
  static findIndexLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<number>;

  static findIndexLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;
  static findIndexLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<number>;

  static findIndexLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;
  static findIndexLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<number>;

  /* findKey */

  static findKey<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  static findKey<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  static findKey<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  /* findKeySeries */

  static findKeySeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  static findKeySeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  static findKeySeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  /* findKeyLimit */

  static findKeyLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;
  static findKeyLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<string | undefined>;

  static findKeyLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;
  static findKeyLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<string | undefined>;

  static findKeyLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;
  static findKeyLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<string | undefined>;

  /* groupBy */

  static groupBy<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static groupBy<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static groupBy<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* groupBySeries */

  static groupBySeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static groupBySeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static groupBySeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* groupByLimit */

  static groupByLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;
  static groupByLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static groupByLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;
  static groupByLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static groupByLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;
  static groupByLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* omit */

  static omit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;

  /* omitBy */

  static omitBy<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitBy<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitBy<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;

  /* omitSeries / omitBySeries */

  static omitSeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;

  static omitBySeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitBySeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitBySeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;

  /* omitLimit / omitByLimit */

  static omitLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static omitLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static omitLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;
  static omitLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;

  static omitByLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static omitByLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitByLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static omitByLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static omitByLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;
  static omitByLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Partial<T>>;

  /* pick */

  static pick<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pick<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pick<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  /* pickBy */

  static pickBy<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickBy<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickBy<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  /* pickSeries / pickBySeries */

  static pickSeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickSeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickSeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickBySeries<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickBySeries<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickBySeries<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  /* pickLimit / pickByLimit */

  static pickLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static pickLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static pickLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static pickLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T[]>>;

  static pickByLimit<T>(
    collection: T[],
    iterator?: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static pickByLimit<T>(
    collection: T[],
    limit: number,
    iterator: Aigle.ArrayIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickByLimit<T>(
    collection: Aigle.List<T>,
    iterator?: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static pickByLimit<T>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.ListIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;

  static pickByLimit<T extends object>(
    collection: T,
    iterator?: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T>>;
  static pickByLimit<T extends object>(
    collection: T,
    limit: number,
    iterator: Aigle.ObjectIterator<T, boolean>
  ): Aigle<Aigle.Dictionary<T[]>>;

  /* transform */

  static transform<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transform<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  static transform<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transform<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  static transform<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;
  static transform<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  /* transformSeries */

  static transformSeries<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transformSeries<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  static transformSeries<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transformSeries<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  static transformSeries<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;
  static transformSeries<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  /* transformLimit */

  static transformLimit<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transformLimit<T, R>(
    collection: T[],
    limit: number,
    iterator: Aigle.MemoArrayIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transformLimit<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;
  static transformLimit<T, R>(
    collection: T[],
    limit: number,
    iterator: Aigle.MemoArrayIterator<T, Aigle.Dictionary<R>>,
    accumulator: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  static transformLimit<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transformLimit<T, R>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.MemoListIterator<T, R[]>,
    accumulator?: R[]
  ): Aigle<R[]>;
  static transformLimit<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;
  static transformLimit<T, R>(
    collection: Aigle.List<T>,
    limit: number,
    iterator: Aigle.MemoListIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;

  static transformLimit<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;
  static transformLimit<T extends object, R>(
    collection: T,
    limit: number,
    iterator: Aigle.MemoObjectIterator<T, Aigle.Dictionary<R>>,
    accumulator?: Aigle.Dictionary<R>
  ): Aigle<Aigle.Dictionary<R>>;
  static transformLimit<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;
  static transformLimit<T extends object, R>(
    collection: T,
    limit: number,
    iterator: Aigle.MemoObjectIterator<T, R[]>,
    accumulator: R[]
  ): Aigle<R[]>;

  /* reduce */

  static reduce<T, R>(
    collection: T[],
    iterator: Aigle.MemoArrayIterator<T, R, R>,
    accumulator?: R
  ): Aigle<R>;

  static reduce<T, R>(
    collection: Aigle.List<T>,
    iterator: Aigle.MemoListIterator<T, R, R>,
    accumulator?: R
  ): Aigle<R>;

  static reduce<T extends object, R>(
    collection: T,
    iterator: Aigle.MemoObjectIterator<T, R, R>,
    accumulator?: R
  ): Aigle<R>;

  /* delay */

  static delay<T>(ms: number, value?: T): Aigle<T>;

  /* tap */

  static tap<T>(value: T, intercepter: (value: T) => Aigle.ReturnType<any>): Aigle<T>;

  /* thru */

  static thru<T, R>(value: T, intercepter: (value: T) => Aigle.ReturnType<R>): Aigle<R>;

  /**
   * flow
   * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/lodash/common/util.d.ts#L198
   */
  static flow<R1, R2>(
    f1: () => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>
  ): () => Aigle<R2>;
  static flow<R1, R2, R3>(
    f1: () => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>
  ): () => Aigle<R3>;
  static flow<R1, R2, R3, R4>(
    f1: () => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>
  ): () => Aigle<R4>;
  static flow<R1, R2, R3, R4, R5>(
    f1: () => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>
  ): () => Aigle<R5>;
  static flow<R1, R2, R3, R4, R5, R6>(
    f1: () => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>
  ): () => Aigle<R6>;
  static flow<R1, R2, R3, R4, R5, R6, R7>(
    f1: () => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>,
    f7: (a: R6) => Aigle.ReturnType<R7>,
    ...funcs: Array<Aigle.Many<(a: any) => any>>
  ): () => Aigle<any>;

  // 1-argument first function
  static flow<A1, R1, R2>(
    f1: (a1: A1) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>
  ): (a1: A1) => Aigle<R2>;
  static flow<A1, R1, R2, R3>(
    f1: (a1: A1) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>
  ): (a1: A1) => Aigle<R3>;
  static flow<A1, R1, R2, R3, R4>(
    f1: (a1: A1) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>
  ): (a1: A1) => Aigle<R4>;
  static flow<A1, R1, R2, R3, R4, R5>(
    f1: (a1: A1) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>
  ): (a1: A1) => Aigle<R5>;
  static flow<A1, R1, R2, R3, R4, R5, R6>(
    f1: (a1: A1) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>
  ): (a1: A1) => Aigle<R6>;
  static flow<A1, R1, R2, R3, R4, R5, R6, R7>(
    f1: (a1: A1) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>,
    f7: (a: R6) => Aigle.ReturnType<R7>,
    ...funcs: Array<Aigle.Many<(a: any) => any>>
  ): (a1: A1) => Aigle<any>;

  // 2-argument first function
  static flow<A1, A2, R1, R2>(
    f1: (a1: A1, a2: A2) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>
  ): (a1: A1, a2: A2) => Aigle<R2>;
  static flow<A1, A2, R1, R2, R3>(
    f1: (a1: A1, a2: A2) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>
  ): (a1: A1, a2: A2) => Aigle<R3>;
  static flow<A1, A2, R1, R2, R3, R4>(
    f1: (a1: A1, a2: A2) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>
  ): (a1: A1, a2: A2) => Aigle<R4>;
  static flow<A1, A2, R1, R2, R3, R4, R5>(
    f1: (a1: A1, a2: A2) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>
  ): (a1: A1, a2: A2) => Aigle<R5>;
  static flow<A1, A2, R1, R2, R3, R4, R5, R6>(
    f1: (a1: A1, a2: A2) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>
  ): (a1: A1, a2: A2) => Aigle<R6>;
  static flow<A1, A2, R1, R2, R3, R4, R5, R6, R7>(
    f1: (a1: A1, a2: A2) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>,
    f7: (a: R6) => Aigle.ReturnType<R7>,
    ...funcs: Array<Aigle.Many<(a: any) => any>>
  ): (a1: A1, a2: A2) => Aigle<any>;

  // any-argument first function
  static flow<A1, A2, A3, R1, R2>(
    f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>
  ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R2>;
  static flow<A1, A2, A3, R1, R2, R3>(
    f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>
  ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R3>;
  static flow<A1, A2, A3, R1, R2, R3, R4>(
    f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>
  ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R4>;
  static flow<A1, A2, A3, R1, R2, R3, R4, R5>(
    f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>
  ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R5>;
  static flow<A1, A2, A3, R1, R2, R3, R4, R5, R6>(
    f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>
  ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<R6>;
  static flow<A1, A2, A3, R1, R2, R3, R4, R5, R6, R7>(
    f1: (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle.ReturnType<R1>,
    f2: (a: R1) => Aigle.ReturnType<R2>,
    f3: (a: R2) => Aigle.ReturnType<R3>,
    f4: (a: R3) => Aigle.ReturnType<R4>,
    f5: (a: R4) => Aigle.ReturnType<R5>,
    f6: (a: R5) => Aigle.ReturnType<R6>,
    f7: (a: R6) => Aigle.ReturnType<R7>,
    ...funcs: Array<Aigle.Many<(a: any) => any>>
  ): (a1: A1, a2: A2, a3: A3, ...args: any[]) => Aigle<any>;

  /* times */

  static times<T>(n: number, iterator?: (num: number) => Aigle.ReturnType<T>): Aigle<T[]>;

  /* timesSeries */

  static timesSeries<T>(n: number, iterator?: (num: number) => Aigle.ReturnType<T>): Aigle<T[]>;

  /* timesLimit */

  static timesLimit<T>(n: number, iterator?: (num: number) => Aigle.ReturnType<T>): Aigle<T[]>;
  static timesLimit<T>(
    n: number,
    limit: number,
    iterator: (num: number) => Aigle.ReturnType<T>
  ): Aigle<T[]>;

  /* doUntil */

  static doUntil<T>(
    iterator: (value: T) => Aigle.ReturnType<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>
  ): Aigle<T>;
  static doUntil<T>(
    value: T,
    iterator: (value: T) => Aigle.ReturnType<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>
  ): Aigle<T>;

  /* doWhilst */

  static doWhilst<T>(
    iterator: (value: T) => Aigle.ReturnType<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>
  ): Aigle<T>;
  static doWhilst<T>(
    value: T,
    iterator: (value: T) => Aigle.ReturnType<T>,
    tester: (value: T) => Aigle.ReturnType<boolean>
  ): Aigle<T>;

  /* until */

  static until<T>(
    tester: (value: T) => Aigle.ReturnType<boolean>,
    iterator: (value: T) => Aigle.ReturnType<T>
  ): Aigle<T>;
  static until<T>(
    value: T,
    tester: (value: T) => Aigle.ReturnType<boolean>,
    iterator: (value: T) => Aigle.ReturnType<T>
  ): Aigle<T>;

  /* whilst */

  static whilst<T>(
    tester: (value: T) => Aigle.ReturnType<boolean>,
    iterator: (value: T) => Aigle.ReturnType<T>
  ): Aigle<T>;
  static whilst<T>(
    value: T,
    tester: (value: T) => Aigle.ReturnType<boolean>,
    iterator: (value: T) => Aigle.ReturnType<T>
  ): Aigle<T>;

  /* retry */

  static retry<T>(handler: Aigle.PromiseCallback<T>): Aigle<T>;
  static retry<T>(opts: number | Aigle.RetryOpts, handler: Aigle.PromiseCallback<T>): Aigle<T>;

  /* attempt */

  static attempt<T>(handler: Aigle.PromiseCallback<T>): Aigle<T>;

  /* prommisify */

  static promisify(fn: any, opts?: any): any;

  /* prommisifyAll */

  static promisifyAll(target: any, options?: any): any;

  /* using */

  static using<R1, T>(
    arg1: Aigle.Disposer<R1>,
    executor: (transaction1: R1) => Aigle.ReturnType<T>
  ): Aigle<T>;
  static using<R1, R2, T>(
    arg1: Aigle.Disposer<R1>,
    arg2: Aigle.Disposer<R2>,
    executor: (transaction1: R1, transaction2: R2) => Aigle.ReturnType<T>
  ): Aigle<T>;
  static using<R1, R2, R3, T>(
    arg1: Aigle.Disposer<R1>,
    arg2: Aigle.Disposer<R2>,
    arg3: Aigle.Disposer<R3>,
    executor: (transaction1: R1, transaction2: R2, transaction3: R3) => Aigle.ReturnType<T>
  ): Aigle<T>;

  /* mixin */

  static mixin(sources: any, opts: any): any;

  /* config */

  static config(opts: Aigle.ConfigOpts): void;

  static longStackTraces(): void;
}

declare namespace Aigle {
  export enum State {
    Pending = 'pending',
    Fulfilled = 'fulfilled',
    Rejected = 'rejected'
  }

  export class CancellationError extends Error {}
  export class TimeoutError extends Error {}
  export type ReturnType<T> = T | PromiseLike<T>;
  export type ResolvableProps<T> = object & { [K in keyof T]: ReturnType<T[K]> };

  export type CatchFilter<E> = (new (...args: any[]) => E) | ((error: E) => boolean) | (object & E);
  export type Many<T> = T | T[];
  export type List<T> = ArrayLike<T>;
  export type Dictionary<T> = Record<string, T>;
  export type NotVoid = {} | null | undefined;

  export type PromiseCallback<T> = () => ReturnType<T>;

  export type ArrayIterator<T, TResult = NotVoid> = (
    value: T,
    index: number,
    collection: T[]
  ) => ReturnType<TResult>;
  export type ListIterator<T, TResult = NotVoid> = (
    value: T,
    index: number,
    collection: List<T>
  ) => ReturnType<TResult>;
  export type ObjectIterator<T, TResult = NotVoid> = (
    value: T[keyof T],
    key: string,
    collection: T
  ) => ReturnType<TResult>;

  export type MemoArrayIterator<T, TResult, IResult = any> = (
    accumulator: TResult,
    value: T,
    index: number,
    collection: T[]
  ) => ReturnType<IResult>;
  export type MemoListIterator<T, TResult, IResult = any> = (
    accumulator: TResult,
    value: T,
    index: number,
    collection: List<T>
  ) => ReturnType<IResult>;
  export type MemoObjectIterator<T, TResult, IResult = any> = (
    accumulator: TResult,
    value: T[keyof T],
    key: string,
    collection: T
  ) => ReturnType<IResult>;

  export interface AllSettledFulfilled<T> {
    state: State.Fulfilled;
    value: T;
  }
  export interface AllSettledRejected {
    state: State.Rejected;
    reason: any;
  }
  export type AllSettledResponse<T> = AllSettledFulfilled<T> | AllSettledRejected;

  export interface ConfigOpts {
    longStackTraces?: boolean;
    cancellation?: boolean;
  }

  export interface RetryOpts {
    times?: number;
    interval?: number | ((count?: number) => number);
  }

  export class Disposer<T> {}
}
