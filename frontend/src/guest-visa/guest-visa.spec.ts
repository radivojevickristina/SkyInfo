import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestVisa } from './guest-visa';

describe('GuestVisa', () => {
  let component: GuestVisa;
  let fixture: ComponentFixture<GuestVisa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestVisa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestVisa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
