# MANILA — Restaurante (identidad v3 · Cyberpunk / HUD)

Misma arquitectura del proyecto original (mismos componentes, entidades,
servicios, rutas y consumo de las APIs reales de TheMealDB / TheCocktailDB).
Esta es la tercera identidad visual — no comparte nada visualmente con las
dos anteriores (ni el jade/mango/crema v1, ni el magenta/teal oscuro v2).

## Requisitos

- Angular CLI 22.1.x · Node.js 26.x · npm 12.x

## Cómo correrlo

```bash
cd manila-web
npm install
ng serve
```

## Bugs corregidos en esta entrega

- **Braindance (antes "Memo MANILA")** — el juego se quedaba sin cargar
  ("Fallo de conexión con la base de datos"). La causa real: TheCocktailDB
  tiene problemas de CORS documentados con peticiones hechas desde
  `localhost` en desarrollo (no siempre responde el header necesario para
  que el navegador acepte la respuesta). Como no se puede controlar eso
  desde el frontend, el juego ahora:
  - Pide cada API (comidas/bebidas) por separado, así si UNA falla la otra
    sigue funcionando.
  - Si de todos modos faltan parejas, completa el tablero con un respaldo
    local (8 parejas con emoji, sin red) — el juego **siempre carga**,
    tenga o no tenga conexión con las APIs externas ese momento.
  - Las parejas obtenidas se guardan en caché por sesión, así reingresar a
    la página no vuelve a golpear la red innecesariamente.
- **Filtro de categorías de bebidas** — TheCocktailDB solo reconoce
  categorías multi-palabra con guion bajo (`Ordinary_Drink`, no
  `"Ordinary Drink"`). Se normaliza el valor antes de llamar a la API.

## Qué se mantuvo igual (misma arquitectura)

- Rutas: `/`, `/carrito`, `/comidas`, `/bebidas`, `/juego`.
- Entidades (`src/app/entidades/`): `Comida`, `Bebida`, `ItemPedido`.
- Servicios (`src/app/servicios/`): `MealApiService`, `CocktailApiService`, `CarritoService`.
- Componentes y su lógica interna: `banner`, `informacion`, `inicio`,
  `comidas`, `bebidas`, `carrito` (tabla, formulario de cliente, PDF con
  jsPDF), `navegacion`, `footer`, `juego`.

## Identidad visual v3 — Cyberpunk / HUD

- **Nombre del juego**: "Memo MANILA" → **"Braindance // MANILA"**.
- **Paleta**: negro absoluto `#08090b`, amarillo `#fcee0a`, cian `#00f0ff`,
  rojo `#ff003c` — variables de Bootstrap (`--bs-primary`, `--bs-danger`,
  `--bs-dark`...) apuntan a estos valores.
- **Tipografía**: Chakra Petch (encabezados y cuerpo) + Share Tech Mono
  (datos, precios, etiquetas).
- **Motivos**: cortes diagonales (`clip-path`) en botones/tarjetas/precios,
  esquinas de visor HUD en imágenes, líneas de escaneo sutiles de fondo,
  título del hero con efecto glitch (sombra cian/roja).
- **Layout, totalmente reordenado** respecto a las dos versiones previas:
  - Nav: enlaces centrados, logo a la derecha, carrito a la izquierda
    (antes: logo-izquierda / enlaces-derecha).
  - Hero: imagen a pantalla completa con texto superpuesto asimétrico
    (antes: carrusel v1, split en dos columnas v2).
  - Comidas/Bebidas: barra lateral fija con filtros y categorías +
    grilla de fichas (antes: barra de filtros arriba + categorías en fila).
  - Favoritos: filas tipo "dossier" horizontal (antes: tarjetas verticales).
  - Carrito: resumen de pago a la izquierda, lista de ítems a la derecha
    (antes: al revés).
- **Logo**: reemplazado por un marco hexagonal amarillo con "M" y acento
  rojo (antes: anillo teal con chispa magenta v2 / hoja jade v1).
- **Datos de contacto reales**: La Dorada, Caldas, Colombia · +57 304 260 0433.
- **PDF del pedido**: mismos datos (logo, fecha, cliente, lista, total),
  recoloreado en ámbar/cian legibles sobre papel.
