import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CarritoService } from '../servicios/carrito';

@Component({
  selector: 'app-navegacion',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navegacion.html',
  styleUrl: './navegacion.css',
})
export class Navegacion implements OnInit {
  cantidadCarrito = signal(0);

  constructor(private carrito: CarritoService) {}

  ngOnInit(): void {
    this.carrito.items$.subscribe(() => {
      this.cantidadCarrito.set(this.carrito.cantidadTotalItems());
    });
  }
}
