import { Routes } from '@angular/router';
import { Comidas } from './comidas/comidas';
import { Bebidas } from './bebidas/bebidas';
import { Juego } from './juego/juego';
import { Inicio } from './inicio/inicio';
import { Carrito } from './carrito/carrito';

export const routes: Routes = [

    {path: '', component: Inicio},
    { path: 'carrito', component: Carrito },
    {path: 'comidas', component: Comidas},
    {path: 'bebidas', component: Bebidas},
    {path: 'juego', component: Juego},
    {path: '**', redirectTo: ''}
];
