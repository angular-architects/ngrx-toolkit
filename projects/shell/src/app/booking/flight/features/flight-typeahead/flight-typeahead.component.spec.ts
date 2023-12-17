import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightTypeaheadComponent } from './flight-typeahead.component';

describe('FlightTypeaheadComponent', () => {
  let component: FlightTypeaheadComponent;
  let fixture: ComponentFixture<FlightTypeaheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightTypeaheadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlightTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
