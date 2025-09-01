import { concatOp, rxMutation } from '@angular-architects/ngrx-toolkit';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

export type Params = {
  value: number;
};

@Component({
  selector: 'demo-counter-rx-mutation',
  imports: [CommonModule],
  templateUrl: './counter-rx-mutation.html',
  styleUrl: './counter-rx-mutation.css',
})
export class CounterRxMutation {
  private counterSignal = signal(0);

  private increment = rxMutation({
    operation: (params: Params) => {
      return calcSum(this.counterSignal(), params.value);
    },
    operator: concatOp,
    onSuccess: (result) => {
      this.counterSignal.set(result);
    },
    onError: (error) => {
      console.error('Error occurred:', error);
    },
  });

  // Expose signals for template
  protected counter = this.counterSignal.asReadonly();
  protected error = this.increment.error;
  protected isPending = this.increment.isPending;
  protected status = this.increment.status;
  protected value = this.increment.value;
  protected hasValue = this.increment.hasValue;

  async incrementCounter() {
    const result = await this.increment({ value: 1 });
    if (result.status === 'success') {
      console.log('Success:', result.value);
    }
    if (result.status === 'error') {
      console.log('Error:', result.error);
    }
    if (result.status === 'aborted') {
      console.log('Operation aborted');
    }
  }

  async incrementBy13() {
    await this.increment({ value: 13 });
  }
}

function calcSum(a: number, b: number): Observable<number> {
  const result = a + b;
  if (b === 13) {
    return throwError(() => ({
      message: 'error due to bad luck!',
      a,
      b,
      result,
    }));
  }
  return of(result).pipe(delay(500));
}
