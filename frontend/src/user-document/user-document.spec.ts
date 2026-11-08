import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDocument } from './user-document';

describe('UserDocument', () => {
  let component: UserDocument;
  let fixture: ComponentFixture<UserDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDocument]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDocument);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
