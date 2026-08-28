import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CocktailApiService } from './cocktail-api';

describe('CocktailApiService', () => {
  let service: CocktailApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(CocktailApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
