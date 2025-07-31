import { Component, inject, linkedSignal } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { FormsModule } from '@angular/forms';
import { withConnect } from '@angular-architects/ngrx-toolkit';

const initialState = { user: { name: 'Max' } };

const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withConnect()
);

@Component({
  template: `
    <h2>
      <pre>withConnect</pre>
    </h2>
    <p>
      withConnect() adds a method to connect Signals back to your store.
      Everytime these Signals change, the store will be updated accordingly.
    </p>

    <p>User name in Store: {{ userStore.user.name() }}</p>

    <p>Connected local user name: <input [(ngModel)]="userName" /></p>
  `,
  imports: [FormsModule],
})
export class ConnectComponent {
  protected readonly userStore = inject(UserStore);
  protected readonly userName = linkedSignal(() => this.userStore.user.name());

  constructor() {
    this.userStore.connect(() => ({
      user: {
        name: this.userName(),
      },
    }));
  }
}
