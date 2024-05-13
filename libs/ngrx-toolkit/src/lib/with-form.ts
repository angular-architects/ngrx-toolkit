import { inject, Injector, runInInjectionContext } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { PartialStateUpdater, patchState, SignalStoreFeature, signalStoreFeature, StateSignal, withMethods, withState } from '@ngrx/signals';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { capitalize } from './with-data-service';

export enum Status {
  Disabled,
  Enabled
}

export class SetValue {
  value: any;
  options?: {
    onlySelf?: boolean;
    emitEvent?: boolean;
    emitModelToViewChange?: boolean;
    emitViewToModelChange?: boolean;
  };
  constructor(value: any, options?: {
    onlySelf?: boolean;
    emitEvent?: boolean;
    emitModelToViewChange?: boolean;
    emitViewToModelChange?: boolean;
  }) {
    this.value = value;
    this.options = options;
  }
}

export class Reset {
  value?: any;
  options?: {
    onlySelf?: boolean;
    emitEvent?: boolean;
  };
  constructor(value?: any, options?: {
    onlySelf?: boolean;
    emitEvent?: boolean;
  }) {
    this.value = value;
    this.options = options;
  }
}

export type ControlChange = {
  controlName: string;
  operation: SetValue | Reset;
  status?: Status;
};

export type FormState = {
  value: any;
  controlsMarkedAsChanged: string[];
};

export type NamedFormState<Form extends string> = {
  [K in Form as `${K}FormState`]: FormState;
};

export type NamedFormMethod<Form extends string> = {
  [K in Form as `set${Capitalize<K>}FormGroup`]: (formGroup: FormGroup, store: StateSignal<any>) => void;
};

/**
 * Store Feature related to form management domain.
 * </br>
 * Add to the store a named state <b>{name}FormState</b> dedicated to form changes management.
 * The added state contains :
 * <ul>
 *     <li>value: the form controls value representation</li>
 *     <li>controlsMarkedAsChanged: the form controls marked as changed. A control is marked as changed when its value is not equals to the corresponding stored one</li>
 * </ul>
 * Provide methods :
 * <ul>
 *     <li>set{Name}FormGroup to pass the form group associated to the managed state</li>
 *     <li>handleComputedValueChanges(name, computedChanges) to update the state with computed values and remove controls marks.</li>
 *     <li>handleFormValueChanges(form, name) to update the state according to from controls changes and add marks to changed ones.</li>
 * </ul>
 * </br>
 * The feature updates the form state on form group value changes and patch the form controls with computed values.
 * To allow form patching with computed business values, the store MUST provide the computed method
 * <b>{name}FormComputedChanges</b>. This business method computes the list of controls changes (SetValue, Reset, etc.) to be applied
 * to the form (or an empty list when no changes) :
 * <ul>
 *     <li>On form changes => the feature propagate changes to the store and mark changed controls</li>
 *     <li>On form state changes => the computed method <b>{formFeatureName}FormUpdatedFields()</b> is triggered and the defined business logic compute the list of changes to apply to
 * the form controls. The business logic can rely on changed marked controls from the form state.</li>
 *     <li>On ControlChange[] changes => the feature apply computed changes to the form controls</li>
 * </ul>
 * To handle business action after form modification or submission, the store method <b>handle{FormFeatureName}Form()</b>
 * is called by the feature when the retrieved list of computed control changes is empty (no more changes computed).
 */
export function withForm<Form extends string, Debounce extends number>(name?: Form, debounce?: Debounce): SignalStoreFeature<
  { state: NonNullable<unknown>, signals: NonNullable<unknown>, methods: NonNullable<unknown> },
  {
    state: NamedFormState<Form>;
    signals: NonNullable<unknown>;
    methods: NamedFormMethod<Form>;
  }
>;
export function withForm(name: string, debounce: number): SignalStoreFeature {
  return signalStoreFeature(
    withState<{ [name: string]: FormState }>({
      [`${name}FormState`]: {
        value: {},
        controlsMarkedAsChanged: []
      }
    }),
    withMethods((partialStore, injector = inject(Injector)) => ({
      [`set${capitalize(name)}FormGroup`](formGroup: FormGroup, finalStore: any) {
        runInInjectionContext(injector, () => {
          formGroup.valueChanges
            .pipe(
              debounceTime(debounce),
              distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
              takeUntilDestroyed()
            )
            .subscribe(() => {
              patchState(finalStore, handleFormValueChanges(formGroup, name));
            });

          toObservable(finalStore[`${name}FormComputedChanges`])
            .pipe(
              filter((changes: any) => changes.length > 0),
              takeUntilDestroyed()
            )
            .subscribe((changes: ControlChange[]) => {
              patchState(finalStore, handleComputedValueChanges(name, changes));
              changes.forEach((change: ControlChange) => {
                const control = formGroup.get(change.controlName);
                if (control) {
                  if (change.operation instanceof SetValue) {
                    control.setValue(change.operation.value, change.operation.options);
                  }
                  if (change.operation instanceof Reset) {
                    control.reset(change.operation.value, change.operation.options);
                  }
                  if (change.status === Status.Disabled) {
                    control.disable(change.operation.options);
                  }
                  if (change.status === Status.Enabled) {
                    control.enable(change.operation.options);
                  }
                }
              });
            });

          if (finalStore[`handle${capitalize(name)}Form`]) {
            toObservable(finalStore[`${name}FormComputedChanges`])
              .pipe(
                filter((fields: any) => fields.length === 0),
                filter(() => formGroup.valid)
              )
              .subscribe(() => finalStore[`handle${capitalize(name)}Form`]());
          }
        });
      }
    }))
  );
}

/**
 * Update the form state with computed values.
 * The list of controls marked as changed is also cleared.
 * @param name the name of the form state in the store
 * @param computedValues the changes list to apply to stored values
 */
export function handleComputedValueChanges(name: string, computedValues: ControlChange[]): PartialStateUpdater<NamedFormState<string>> {
  return (state) => {
    const updatedValue = { ...state[`${name}FormState`].value };
    computedValues.forEach((field) => {
      updatedValue[field.controlName] = field.operation.value;
    });
    return {
      ...state, [`${name}FormState`]: {
        value: updatedValue,
        controlsMarkedAsChanged: []
      }
    };
  };
}

/**
 * Update the form state with values of controls declared in the formGroup.
 * When the existing stored control value is not equals to the corresponding one in the form, the control name is added
 * to the list of controls marked as changed.
 * @param form the form group
 * @param name the name of the form state in the store
 */
export function handleFormValueChanges(form: FormGroup, name: string): PartialStateUpdater<NamedFormState<string>> {
  return (state) => {
    const formValue = form.getRawValue();
    const storeFormValue = state[`${name}FormState`].value;

    const changedControls: string [] = [];
    for (const key in formValue) {
      if (
        (formValue[key] === '' && !!storeFormValue[key]) ||
        (formValue[key] !== '' && formValue[key] != storeFormValue[key])
      ) {
        changedControls.push(key);
      }
    }
    if (changedControls.length > 0) {
      return {
        ...state, [`${name}FormState`]: {
          value: formValue,
          controlsMarkedAsChanged: changedControls
        }
      };
    } else {
      return state;
    }
  };
}
