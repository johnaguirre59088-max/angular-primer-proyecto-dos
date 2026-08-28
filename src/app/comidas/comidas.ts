import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MealApiService } from '../servicios/meal-api';
import { Comida } from '../entidades/comida';
import { ItemPedido } from '../entidades/item-pedido';
import { CarritoService } from '../servicios/carrito';
import { Router } from '@angular/router';

// Traducción de las categorías de TheMealDB, solo para mostrar en pantalla.
// El valor real usado para llamar a la API (strCategory) no cambia.
const TRADUCCION_CATEGORIAS_COMIDA: Record<string, string> = {
  Beef: 'Res',
  Chicken: 'Pollo',
  Dessert: 'Postres',
  Lamb: 'Cordero',
  Miscellaneous: 'Variados',
  Pasta: 'Pasta',
  Pork: 'Cerdo',
  Seafood: 'Mariscos',
  Side: 'Acompañamientos',
  Starter: 'Entradas',
  Vegan: 'Vegano',
  Vegetarian: 'Vegetariano',
  Breakfast: 'Desayuno',
  Goat: 'Cabra',
};

@Component({
  selector: 'app-comidas',
  imports: [CommonModule, FormsModule],
  templateUrl: './comidas.html',
  styleUrl: './comidas.css',
})
export class Comidas implements OnInit {
  categorias = signal<any[]>([]);
  comidas = signal<Comida[]>([]);
  categoriaActiva = '';
  cargando = false;
  cantidadSeleccionada = 1;

  busquedaNombre = '';
  busquedaIngrediente = '';

  comidaSeleccionada = signal<Comida | null>(null);

  constructor(
    private mealApi: MealApiService,
    private carrito: CarritoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.mealApi.obtenerCategorias().subscribe({
      next: (data) => {
        this.categorias.set(data.categories);
        if (data.categories.length > 0) {
          this.seleccionarCategoria(data.categories[0].strCategory);
        }
      },
      error: (err) => console.error('error categorias:', err)
    });
  }

  verDetalle(comida: Comida) {
    this.comidaSeleccionada.set(comida);
    this.cantidadSeleccionada = 1; // 👈 reinicia cada vez que abres el modal
  }

  aumentarCantidad() {
    this.cantidadSeleccionada++;
  }

  disminuirCantidad() {
    if (this.cantidadSeleccionada > 1) this.cantidadSeleccionada--;
  }

  agregarAlPedido(comida: Comida) {
    const item = new ItemPedido();
    item.id = comida.idMeal;
    item.nombre = comida.strMeal;
    item.imagen = comida.strMealThumb;
    item.precio = comida.precio;
    item.tipo = 'comida';
    this.carrito.agregar(item, this.cantidadSeleccionada);
    this.router.navigate(['/carrito']); // 👈 nuevo
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaActiva = categoria;
    this.busquedaNombre = '';
    this.busquedaIngrediente = '';
    this.cargando = true;
    this.mealApi.obtenerPorCategoria(categoria).subscribe({
      next: (data) => this.cargarDetalles(data.meals ?? []),
      error: (err) => { console.error('error filtro categoria:', err); this.cargando = false; }
    });
  }

  buscar() {
    this.cargando = true;

    if (this.busquedaNombre.trim().length > 0) {
      this.categoriaActiva = '';
      this.mealApi.buscarPorNombre(this.busquedaNombre.trim()).subscribe({
        next: (data) => this.mostrarDesdeDetalleCompleto(data.meals ?? []),
        error: (err) => { console.error('error busqueda nombre:', err); this.cargando = false; }
      });
      return;
    }

    if (this.busquedaIngrediente.trim().length > 0) {
      this.categoriaActiva = '';
      this.mealApi.obtenerPorIngrediente(this.busquedaIngrediente.trim()).subscribe({
        next: (data) => this.cargarDetalles(data.meals ?? []),
        error: (err) => { console.error('error busqueda ingrediente:', err); this.cargando = false; }
      });
      return;
    }

    this.seleccionarCategoria(this.categoriaActiva);
  }

  private cargarDetalles(mealsBasicos: any[]) {
    if (mealsBasicos.length === 0) {
      this.comidas.set([]);
      this.cargando = false;
      return;
    }

    const peticiones = mealsBasicos.map(m => this.mealApi.obtenerDetalle(m.idMeal));

    forkJoin(peticiones).subscribe({
      next: (resultados: any[]) => {
        const detalles = resultados.map(r => r.meals[0]);
        this.mostrarDesdeDetalleCompleto(detalles);
      },
      error: (err) => { console.error('error lookup detalles:', err); this.cargando = false; }
    });
  }

  private mostrarDesdeDetalleCompleto(detalles: any[]) {
    const comidas: Comida[] = detalles.map(d => {
      const c = new Comida();
      c.idMeal = d.idMeal;
      c.strMeal = d.strMeal;
      c.strMealThumb = d.strMealThumb;
      c.strCategory = d.strCategory;
      c.ingredientes = this.extraerIngredientes(d);
      c.precio = this.generarPrecio();
      return c;
    });
    this.comidas.set(comidas);
    this.cargando = false;
  }

  private extraerIngredientes(detalle: any): string[] {
    const ingredientes: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingrediente = detalle[`strIngredient${i}`];
      if (!ingrediente || ingrediente.trim().length === 0) break;
      ingredientes.push(ingrediente);
    }
    return ingredientes;
  }

  private generarPrecio(): number {
    return Math.floor(Math.random() * (35000 - 12000 + 1)) + 12000;
  }

  traducirCategoria(categoria: string): string {
    return TRADUCCION_CATEGORIAS_COMIDA[categoria] ?? categoria;
  }
}
