export class ItemPedido {
  id: string = "";
  nombre: string = "";
  imagen: string = "";
  precio: number = 0;
  tipo: 'comida' | 'bebida' = 'comida';
  cantidad: number = 1;
}
