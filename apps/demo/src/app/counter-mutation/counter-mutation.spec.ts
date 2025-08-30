import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CounterMutation } from './counter-mutation';

describe('CounterMutation', () => {
  let component: CounterMutation;
  let fixture: ComponentFixture<CounterMutation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterMutation],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterMutation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
