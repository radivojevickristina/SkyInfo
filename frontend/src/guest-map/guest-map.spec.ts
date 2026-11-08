import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestMap } from './guest-map';

describe('GuestMap', () => {
  let component: GuestMap;
  let fixture: ComponentFixture<GuestMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
