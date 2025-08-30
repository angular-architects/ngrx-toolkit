import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
  selector: 'demo-counter-mutation',
  imports: [CommonModule],
  templateUrl: './counter-mutation.html',
  styleUrl: './counter-mutation.css',
})
export class CounterMutation {
  private store = inject(CounterStore);

  protected counter = this.store.counter;
  protected error = this.store.incrementError;
  protected processing = this.store.incrementProcessing;
  protected status = this.store.incrementStatus;

  increment() {
    this.store.increment({ value: 1 });
  }
}
