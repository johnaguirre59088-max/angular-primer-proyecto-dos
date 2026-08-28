import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bebidas } from './bebidas';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('Bebidas', () => {
  let component: Bebidas;
  let fixture: ComponentFixture<Bebidas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bebidas],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(Bebidas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
