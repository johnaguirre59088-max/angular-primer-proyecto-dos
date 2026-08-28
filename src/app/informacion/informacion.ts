// src/app/informacion/informacion.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealApiService } from '../servicios/meal-api';
import { CocktailApiService } from '../servicios/cocktail-api';

@Component({
  selector: 'app-informacion',
  imports: [CommonModule],
  templateUrl: './informacion.html',
  styleUrl: './informacion.css',
})
export class Informacion implements OnInit {
  platoEstrella = signal<any>(null);
  bebidaEstrella = signal<any>(null);
  precioPlato = 0;
  precioBebida = 0;

  constructor(
    private mealApi: MealApiService,
    private cocktailApi: CocktailApiService
  ) {}

  ngOnInit(): void {
    this.mealApi.obtenerAleatoria().subscribe({
      next: (data) => {
        this.platoEstrella.set(data.meals[0]);
        this.precioPlato = this.generarPrecio();
      },
      error: (err) => console.error('error API comidas:', err)
    });

    this.cocktailApi.obtenerAleatoria().subscribe({
      next: (data) => {
        this.bebidaEstrella.set(data.drinks[0]);
        this.precioBebida = this.generarPrecio();
      },
      error: (err) => console.error('error API bebidas:', err)
    });
  }

  private generarPrecio(): number {
    return Math.floor(Math.random() * (35000 - 12000 + 1)) + 12000;
  }
}
