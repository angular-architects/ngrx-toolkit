import { Injector, Signal, inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { Observable, Unsubscribable, map, pipe } from "rxjs";


type RxMethodInput<Input> = Input | Observable<Input> | Signal<Input>;

type RxMethodRef = {
  destroy: () => void;
}

type RxMethod<Input, MethodInput = Input, MethodResult = unknown> = ((
  input: RxMethodInput<Input>,
  resultMethod: (input: MethodInput) => MethodResult
) => RxMethodRef) & RxMethodRef;

export function reduxMethod<Input, MethodInput = Input>(
  generator: (source$: Observable<Input>) => Observable<MethodInput>,
  config?: { injector?: Injector }
): RxMethod<Input, MethodInput>;
export function reduxMethod<Input, MethodInput = Input, MethodResult = unknown>(
  generator: (source$: Observable<Input>) => Observable<MethodInput>,
  resultMethod: (input: MethodInput) => MethodResult,
  config?: {
    injector?: Injector
  }
): RxMethod<Input, MethodInput, MethodResult>;
export function reduxMethod<Input, MethodInput = Input, MethodResult = unknown>(
  generator: (source$: Observable<Input>) => Observable<MethodInput>,
  resultMethodOrConfig?: ((input: MethodInput) => MethodResult) | {
    injector?: Injector
  },
  config?: {
    injector?: Injector
  }
): RxMethod<Input, MethodInput, MethodResult>  {
  const injector = inject(Injector);

  if (typeof resultMethodOrConfig === 'function') {
    let unsubscribable: Unsubscribable;
    const inputResultFn = ((
      input: RxMethodInput<Input>,
      resultMethod = resultMethodOrConfig
    ) => {

      const rxMethodWithResult = rxMethod<Input>(pipe(
        generator,
        map(resultMethod)
      ), {
        ...(config || {}),
        injector: config?.injector || injector
      });
      const rxWithInput = rxMethodWithResult(input);
      unsubscribable = { unsubscribe: rxWithInput.destroy.bind(rxWithInput) };

      return rxWithInput;
    }) as RxMethod<Input, MethodInput, MethodResult>;

    inputResultFn.destroy = () => unsubscribable?.unsubscribe();

    return inputResultFn;
  }

  return rxMethod<Input>(generator, resultMethodOrConfig);
}
