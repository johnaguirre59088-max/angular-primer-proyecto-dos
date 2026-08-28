import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../servicios/carrito';
import { ItemPedido } from '../entidades/item-pedido';
import type jsPDF from 'jspdf';

declare const bootstrap: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  items = signal<ItemPedido[]>([]);
  mostrarPago = signal(false);

  nombreCliente = signal('');
  celularCliente = signal('');
  direccionCliente = signal('');

  errores = signal<string[]>([]);
  modalTitulo = signal('');
  modalMensaje = signal('');

  private carrito = inject(CarritoService);
  private location = inject(Location);

  ngOnInit(): void {
    this.carrito.items$.subscribe(items => this.items.set(items));
  }

  aumentar(item: ItemPedido) {
    this.carrito.actualizarCantidad(item.id, item.tipo, item.cantidad + 1);
  }

  disminuir(item: ItemPedido) {
    this.carrito.actualizarCantidad(item.id, item.tipo, item.cantidad - 1);
  }

  quitar(item: ItemPedido) {
    this.carrito.quitar(item.id, item.tipo);
  }

  continuarPedido() {
    this.location.back();
  }

  enviarPedido() {
    this.mostrarPago.set(true);
  }

  mostrarModal(titulo: string, mensaje: string) {
    this.modalTitulo.set(titulo);
    this.modalMensaje.set(mensaje);

    const modalElement = document.getElementById('modalPedido');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
      modalInstance.show();
    }
  }

  async confirmarPedido() {
    const listaErrores: string[] = [];

    if (this.items().length === 0) {
      listaErrores.push('Tu pedido está vacío.');
    }

    if (!this.nombreCliente() || this.nombreCliente().trim().length < 3) {
      listaErrores.push('El nombre completo debe tener al menos 3 caracteres.');
    }

    if (!this.celularCliente() || !/^\d{7,10}$/.test(this.celularCliente().trim())) {
      listaErrores.push('Ingresa un celular válido (7 a 10 dígitos, solo números).');
    }

    if (!this.direccionCliente() || this.direccionCliente().trim().length < 5) {
      listaErrores.push('La dirección debe tener al menos 5 caracteres.');
    }

    if (listaErrores.length > 0) {
      this.errores.set(listaErrores);
      this.mostrarModal('Corrige los siguientes errores:', listaErrores.join('\n'));
      return;
    }

    await this.generarPDF();

    this.mostrarModal('Pedido confirmado', 'Tu pedido fue generado. Revisa la descarga del PDF.');

    this.carrito.vaciar();
    this.mostrarPago.set(false);
    this.nombreCliente.set('');
    this.celularCliente.set('');
    this.direccionCliente.set('');
  }

  private async generarPDF() {
    // jsPDF (y sus dependencias html2canvas/canvg) se cargan solo cuando
    // se necesitan, para no engordar el bundle inicial de la app.
    const { default: JsPDF } = await import('jspdf');
    const doc = new JsPDF();
    const fecha = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    this.dibujarLogo(doc, 15, 12);

    doc.setFontSize(11);
    doc.text('Fecha: ' + fecha, 150, 15);

    doc.setDrawColor(204, 153, 0);
    doc.setLineWidth(0.4);
    doc.line(15, 38, 195, 38);

    doc.setTextColor(20, 23, 28);
    doc.setFontSize(14);
    doc.text('Datos del cliente', 15, 48);
    doc.setFontSize(11);
    doc.text('Nombre: ' + this.nombreCliente(), 15, 56);
    doc.text('Celular: ' + this.celularCliente(), 15, 63);
    doc.text('Dirección: ' + this.direccionCliente(), 15, 70);

    doc.setFontSize(14);
    doc.text('Pedido', 15, 83);

    let y = 91;
    doc.setFontSize(11);
    this.items().forEach(item => {
      const linea = `${item.cantidad} x ${item.nombre} (${item.tipo}) - $${(item.precio * item.cantidad).toLocaleString('es-CO')}`;
      doc.text(linea, 15, y);
      y += 7;
    });

    y += 5;
    doc.setDrawColor(204, 153, 0);
    doc.line(15, y - 5, 195, y - 5);
    doc.setTextColor(0, 150, 160);
    doc.setFontSize(13);
    doc.text('Total: $' + this.carrito.total().toLocaleString('es-CO'), 15, y);

    doc.save(`pedido-manila-${Date.now()}.pdf`);
  }

  /** Dibuja el emblema MANILA (anillo mango + hoja jade) directamente con
   *  las primitivas vectoriales de jsPDF, sin depender de una imagen externa. */
  private dibujarLogo(doc: jsPDF, x: number, y: number) {
    const cx = x + 10;
    const cy = y + 10;

    doc.setDrawColor(204, 153, 0);
    doc.setLineWidth(1.1);
    doc.circle(cx, cy, 9, 'S');

    doc.setFillColor(0, 150, 160);
    doc.ellipse(cx, cy, 4.2, 7, 'F');

    doc.setFillColor(204, 153, 0);
    doc.circle(cx, cy + 4, 1.1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(204, 153, 0);
    doc.text('MANILA', x + 24, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text('R E S T A U R A N T E', x + 24, y + 17);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  get total(): number {
    return this.carrito.total();
  }
}
