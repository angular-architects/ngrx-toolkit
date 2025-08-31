import {
  concatMap,
  exhaustMap,
  mergeMap,
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
  switchMap,
} from 'rxjs';

export type RxJsFlatteningOperator = <T, O extends ObservableInput<unknown>>(
  project: (value: T, index: number) => O,
) => OperatorFunction<T, ObservedValueOf<O>>;

/**
 * A wrapper for an RxJS flattening operator.
 * This wrapper informs about whether the operator has exhaust semantics or not.
 */
export type FlatteningOperator = {
  rxJsOperator: RxJsFlatteningOperator;
  exhaustSemantics: boolean;
};

export const switchOp: FlatteningOperator = {
  rxJsOperator: switchMap,
  exhaustSemantics: false,
};

export const mergeOp: FlatteningOperator = {
  rxJsOperator: mergeMap,
  exhaustSemantics: false,
};

export const concatOp: FlatteningOperator = {
  rxJsOperator: concatMap,
  exhaustSemantics: false,
};

export const exhaustOp: FlatteningOperator = {
  rxJsOperator: exhaustMap,
  exhaustSemantics: true,
};
