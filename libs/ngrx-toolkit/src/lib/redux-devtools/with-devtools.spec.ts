import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

type Flight = {
  id: number;
  from: string;
  to: string;
  date: Date;
  delayed: boolean;
};

describe('Devtools', () => {
  it('should not fail if no Redux Devtools are available', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Flights = signalStore(withEntities<Flight>());
  });
  it.todo('add a state');
  it.todo('add multiple store as feature stores');
  it.todo('should index store names by default');
  it.todo('should fail, if indexing is disabled');
  it.todo('should work with a signalStore added lazily, i.e. after a CD cycle');
  it.todo('should patchState with action name');
  it.todo('should use patchState with default action name');
  it.todo('should group multiple patchStates (glitch-free) in one action');
  it.todo('should not run if in prod mode');
});
