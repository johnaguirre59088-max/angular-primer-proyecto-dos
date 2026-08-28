import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CocktailApiService } from '../servicios/cocktail-api';
import { Bebida } from '../entidades/bebida';
import { ItemPedido } from '../entidades/item-pedido';
import { CarritoService } from '../servicios/carrito';

// Categorías del brief (bebida ordinaria / coctel), con su valor real de la
// API. Reemplaza la tira dinámica anterior que traía TODAS las categorías
// de TheCocktailDB (incluidas con espacios, ej. "Ordinary Drink"), lo que
// rompía el filtro porque la API exige guion bajo en vez de espacio.
const CATEGORIAS_BEBIDA = [
  { valor: 'Cocktail', etiqueta: 'Coctel' },
  { valor: 'Ordinary_Drink', etiqueta: 'Bebida ordinaria' },
];

@Component({
  selector: 'app-bebidas',
  imports: [CommonModule, FormsModule],
  templateUrl: './bebidas.html',
  styleUrl: './bebidas.css',
})
export class Bebidas implements OnInit {
  categoriasBebida = CATEGORIAS_BEBIDA;
  bebidas = signal<Bebida[]>([]);
  categoriaActiva = '';
  cargando = false;

  busquedaNombre = '';
  busquedaIngrediente = '';
  tipoBebida = '';       // 'alcoholic' | 'non_alcoholic' | ''
  categoriaBebida = '';  // 'ordinary_drink' | 'cocktail' | ''

  bebidaSeleccionada = signal<Bebida | null>(null);
  cantidadSeleccionada = 1;

  constructor(
    private cocktailApi: CocktailApiService,
    private carrito: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.seleccionarCategoria(this.categoriasBebida[0].valor);
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaActiva = categoria;
    this.limpiarFiltros(false);
    this.cargando = true;
    // TheCocktailDB solo reconoce categorías multi-palabra con "_" en vez
    // de espacio (ej. "Ordinary_Drink"); esto lo garantiza sin importar
    // de dónde venga el valor.
    const categoriaApi = categoria.trim().replace(/\s+/g, '_');
    this.cocktailApi.obtenerPorCategoria(categoriaApi).subscribe({
      next: (data) => this.cargarDetalles(data.drinks ?? []),
      error: (err) => { console.error('error filtro categoria:', err); this.cargando = false; }
    });
  }

  buscar() {
    this.cargando = true;

    if (this.busquedaNombre.trim().length > 0) {
      this.categoriaActiva = '';
      this.cocktailApi.buscarPorNombre(this.busquedaNombre.trim()).subscribe({
        next: (data) => this.mostrarDesdeDetalleCompleto(data.drinks ?? []),
        error: (err) => { console.error('error busqueda nombre:', err); this.cargando = false; }
      });
      return;
    }

    if (this.busquedaIngrediente.trim().length > 0) {
      this.categoriaActiva = '';
      this.cocktailApi.obtenerPorIngrediente(this.busquedaIngrediente.trim()).subscribe({
        next: (data) => this.cargarDetalles(data.drinks ?? []),
        error: (err) => { console.error('error busqueda ingrediente:', err); this.cargando = false; }
      });
      return;
    }

    if (this.tipoBebida) {
      this.categoriaActiva = '';
      const tipoApi = this.tipoBebida === 'alcoholic' ? 'Alcoholic' : 'Non_Alcoholic';
      this.cocktailApi.obtenerPorTipo(tipoApi).subscribe({
        next: (data) => this.cargarDetalles(data.drinks ?? []),
        error: (err) => { console.error('error filtro tipo:', err); this.cargando = false; }
      });
      return;
    }

    if (this.categoriaBebida) {
      const categoriaApi = this.categoriaBebida === 'cocktail' ? 'Cocktail' : 'Ordinary_Drink';
      this.seleccionarCategoria(categoriaApi);
      return;
    }

    this.seleccionarCategoria(this.categoriaActiva || this.categoriasBebida[0].valor);
  }

  verDetalle(bebida: Bebida) {
    this.bebidaSeleccionada.set(bebida);
    this.cantidadSeleccionada = 1;
  }

  aumentarCantidad() {
    this.cantidadSeleccionada++;
  }

  disminuirCantidad() {
    if (this.cantidadSeleccionada > 1) this.cantidadSeleccionada--;
  }

  agregarAlPedido(bebida: Bebida) {
    const item = new ItemPedido();
    item.id = bebida.idDrink;
    item.nombre = bebida.strDrink;
    item.imagen = bebida.strDrinkThumb;
    item.precio = bebida.precio;
    item.tipo = 'bebida';
    this.carrito.agregar(item, this.cantidadSeleccionada);
    this.router.navigate(['/carrito']);
  }

  etiquetaCategoria(valor: string): string {
    return this.categoriasBebida.find(c => c.valor === valor)?.etiqueta ?? valor;
  }

  private limpiarFiltros(limpiarCategoriaSelect: boolean = true) {
    this.busquedaNombre = '';
    this.busquedaIngrediente = '';
    this.tipoBebida = '';
    if (limpiarCategoriaSelect) this.categoriaBebida = '';
  }

  private cargarDetalles(drinksBasicos: any[]) {
    if (drinksBasicos.length === 0) {
      this.bebidas.set([]);
      this.cargando = false;
      return;
    }

    const peticiones = drinksBasicos.map(d => this.cocktailApi.obtenerDetalle(d.idDrink));

    forkJoin(peticiones).subscribe({
      next: (resultados: any[]) => {
        const detalles = resultados.map(r => r.drinks[0]);
        this.mostrarDesdeDetalleCompleto(detalles);
      },
      error: (err) => { console.error('error lookup detalles bebidas:', err); this.cargando = false; }
    });
  }

  private mostrarDesdeDetalleCompleto(detalles: any[]) {
    const bebidas: Bebida[] = detalles.map(d => {
      const b = new Bebida();
      b.idDrink = d.idDrink;
      b.strDrink = d.strDrink;
      b.strDrinkThumb = d.strDrinkThumb;
      b.strCategory = d.strCategory;
      b.strAlcoholic = d.strAlcoholic;
      b.ingredientes = this.extraerIngredientes(d);
      b.precio = this.generarPrecio();
      return b;
    });
    this.bebidas.set(bebidas);
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
    return Math.floor(Math.random() * (28000 - 10000 + 1)) + 10000;
  }
}
