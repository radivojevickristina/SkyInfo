import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotenPassword } from './forgoten-password';

describe('ForgotenPassword', () => {
  let component: ForgotenPassword;
  let fixture: ComponentFixture<ForgotenPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotenPassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotenPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
