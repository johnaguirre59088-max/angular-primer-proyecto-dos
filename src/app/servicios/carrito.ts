import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ItemPedido } from '../entidades/item-pedido';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private itemsSubject = new BehaviorSubject<ItemPedido[]>([]);
  items$ = this.itemsSubject.asObservable();

  agregar(item: ItemPedido, cantidad: number = 1) {
    const actuales = this.itemsSubject.value;
    const existente = actuales.find(i => i.id === item.id && i.tipo === item.tipo);

    if (existente) {
      existente.cantidad += cantidad;
      this.itemsSubject.next([...actuales]);
    } else {
      item.cantidad = cantidad;
      this.itemsSubject.next([...actuales, item]);
    }
  }

  quitar(id: string, tipo: 'comida' | 'bebida') {
    const actuales = this.itemsSubject.value.filter(i => !(i.id === id && i.tipo === tipo));
    this.itemsSubject.next(actuales);
  }

  actualizarCantidad(id: string, tipo: 'comida' | 'bebida', cantidad: number) {
    if (cantidad < 1) return;
    const actuales = this.itemsSubject.value;
    const item = actuales.find(i => i.id === id && i.tipo === tipo);
    if (item) {
      item.cantidad = cantidad;
      this.itemsSubject.next([...actuales]);
    }
  }

  obtenerItems(): ItemPedido[] {
    return this.itemsSubject.value;
  }

  cantidadTotalItems(): number {
    return this.itemsSubject.value.reduce((acc, i) => acc + i.cantidad, 0);
  }

  total(): number {
    return this.itemsSubject.value.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  }

  vaciar() {
    this.itemsSubject.next([]);
  }
}
