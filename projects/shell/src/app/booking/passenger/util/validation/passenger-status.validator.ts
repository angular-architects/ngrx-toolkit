import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";


export function validatePassengerStatus(validStatus: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value && !validStatus.includes(control.value)) {
      return {
        passengerStatus: {
          actualStatus: control.value,
          validStatus
        }
      };
    }

    return null;
  }
}
