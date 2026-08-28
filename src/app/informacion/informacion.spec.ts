import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Informacion } from './informacion';
import { provideHttpClient } from '@angular/common/http';

describe('Informacion', () => {
  let component: Informacion;
  let fixture: ComponentFixture<Informacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Informacion],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(Informacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
