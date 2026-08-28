import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { MealApiService } from './meal-api';

describe('MealApiService', () => {
  let service: MealApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(MealApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
