import { FormGroup } from '@angular/forms';
import { PartialStateUpdater, SignalStoreFeature, signalStoreFeature, withState } from '@ngrx/signals';

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

/**
 * Store Feature related to form management domain.
 * </br>
 * Add to the store a named state <b>{name}FormState</b> dedicated to form changes management.
 * The added state contains:
 * <ul>
 *     <li>value: the form controls value representation</li>
 *     <li>controlsMarkedAsChanged: the form controls marked as changed. A control is marked as changed when its value is not equals to the corresponding stored one</li>
 * </ul>
 * Provide methods:
 * <ul>
 *     <li>handleComputedValueChanges(name, computedChanges) to update the state with computed values and remove controls marks.</li>
 *     <li>handleFormValueChanges(form, name) to update the state according to from controls changes and add marks to changed ones.</li>
 * </ul>
 */
export function withForm<Form extends string>(name?: Form): SignalStoreFeature<
    { state: NonNullable<unknown>, signals: NonNullable<unknown>, methods: NonNullable<unknown> },
    {
        state: NamedFormState<Form>;
        signals: NonNullable<unknown>;
        methods: NonNullable<unknown>;
    }
>;
export function withForm(name: string): SignalStoreFeature {
    return signalStoreFeature(
        withState<{ [name: string]: FormState }>({
            [`${name}FormState`]: {
                value: {},
                controlsMarkedAsChanged: []
            }
        })
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
