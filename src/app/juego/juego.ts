import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MealApiService } from '../servicios/meal-api';
import { CocktailApiService } from '../servicios/cocktail-api';

interface Pareja {
  clave: string;
  nombre: string;
  imagen: string;
}

interface CartaMemo extends Pareja {
  volteada: boolean;
  encontrada: boolean;
}

// Respaldo local: no depende de red ni de ninguna API externa. Si
// TheMealDB / TheCocktailDB no responden (CORS, caída, límite de
// peticiones), el juego igual carga con estas 8 parejas.
const PAREJAS_RESPALDO: Pareja[] = [
  { clave: 'r-adobo', nombre: 'Adobo', imagen: '🍢' },
  { clave: 'r-lumpia', nombre: 'Lumpia', imagen: '🥟' },
  { clave: 'r-sinigang', nombre: 'Sinigang', imagen: '🍲' },
  { clave: 'r-pancit', nombre: 'Pancit', imagen: '🍜' },
  { clave: 'r-halohalo', nombre: 'Halo-halo', imagen: '🍨' },
  { clave: 'r-mango', nombre: 'Mango Fizz', imagen: '🥭' },
  { clave: 'r-mule', nombre: 'Manila Mule', imagen: '🍹' },
  { clave: 'r-buko', nombre: 'Buko Pandan', imagen: '🥥' },
];

function mezclar<T>(arreglo: T[]): T[] {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

@Component({
  selector: 'app-juego',
  imports: [CommonModule],
  templateUrl: './juego.html',
  styleUrl: './juego.css',
})
export class Juego implements OnInit {
  // Las parejas se piden a la API una sola vez por sesión de navegador y
  // se guardan aquí. Volver a entrar a la página solo vuelve a mezclar,
  // sin depender de una nueva petición de red cada vez.
  private static parejasCache: Pareja[] | null = null;

  cartas = signal<CartaMemo[]>([]);
  cargando = signal(true);
  usandoRespaldo = signal(false);
  movimientos = signal(0);
  bloqueado = signal(false);

  private seleccionadas: number[] = [];

  parejasEncontradas = computed(
    () => this.cartas().filter(c => c.encontrada).length / 2
  );

  ganado = computed(
    () => this.cartas().length > 0 && this.cartas().every(c => c.encontrada)
  );

  constructor(
    private mealApi: MealApiService,
    private cocktailApi: CocktailApiService
  ) {}

  ngOnInit(): void {
    this.iniciarJuego();
  }

  iniciarJuego(): void {
    this.movimientos.set(0);
    this.seleccionadas = [];
    this.bloqueado.set(false);

    if (Juego.parejasCache) {
      this.armarTablero(Juego.parejasCache);
      return;
    }

    this.cargando.set(true);

    // Cada llamada se protege por separado: si UNA de las dos APIs falla
    // (CORS, caída temporal, límite de peticiones), no se cae todo el
    // juego — simplemente esa mitad usa el respaldo local.
    forkJoin({
      comidas: this.mealApi.obtenerPorCategoria('Dessert').pipe(catchError(() => of(null))),
      bebidas: this.cocktailApi.obtenerPorCategoria('Cocktail').pipe(catchError(() => of(null))),
    }).subscribe(({ comidas, bebidas }) => {
      const platos: Pareja[] = (comidas?.meals ?? []).slice(0, 4).map((m: any) => ({
        clave: 'plato-' + m.idMeal,
        nombre: m.strMeal,
        imagen: m.strMealThumb,
      }));

      const tragos: Pareja[] = (bebidas?.drinks ?? []).slice(0, 4).map((d: any) => ({
        clave: 'bebida-' + d.idDrink,
        nombre: d.strDrink,
        imagen: d.strDrinkThumb,
      }));

      let parejas = [...platos, ...tragos];

      if (parejas.length < 8) {
        // Completa lo que falte (o todo) con el respaldo local, así el
        // juego siempre tiene sus 8 parejas sin importar qué falló.
        this.usandoRespaldo.set(true);
        const yaUsadas = new Set(parejas.map(p => p.clave));
        for (const respaldo of PAREJAS_RESPALDO) {
          if (parejas.length >= 8) break;
          if (!yaUsadas.has(respaldo.clave)) parejas.push(respaldo);
        }
      }

      Juego.parejasCache = parejas;
      this.armarTablero(parejas);
    });
  }

  private armarTablero(parejas: Pareja[]): void {
    const cartas: CartaMemo[] = mezclar(
      [...parejas, ...parejas].map(p => ({ ...p, volteada: false, encontrada: false }))
    );
    this.cartas.set(cartas);
    this.cargando.set(false);
  }

  voltear(indice: number): void {
    if (this.bloqueado()) return;

    const cartas = this.cartas();
    const carta = cartas[indice];
    if (!carta || carta.volteada || carta.encontrada) return;
    if (this.seleccionadas.includes(indice)) return;

    this.cartas.update(actuales =>
      actuales.map((c, i) => (i === indice ? { ...c, volteada: true } : c))
    );

    this.seleccionadas.push(indice);

    if (this.seleccionadas.length === 2) {
      this.movimientos.update(m => m + 1);
      this.bloqueado.set(true);

      const [i, j] = this.seleccionadas;
      const cartaA = this.cartas()[i];
      const cartaB = this.cartas()[j];

      if (cartaA.clave === cartaB.clave) {
        setTimeout(() => {
          this.cartas.update(actuales =>
            actuales.map((c, k) => (k === i || k === j ? { ...c, encontrada: true } : c))
          );
          this.seleccionadas = [];
          this.bloqueado.set(false);
        }, 450);
      } else {
        setTimeout(() => {
          this.cartas.update(actuales =>
            actuales.map((c, k) => (k === i || k === j ? { ...c, volteada: false } : c))
          );
          this.seleccionadas = [];
          this.bloqueado.set(false);
        }, 800);
      }
    }
  }
}
