# T.B.YOU Accesorios — Tienda online

Proyecto Institucional · 7° año · Orientación en Programación
E.E.S.T. N° 3 "Norberto Piñero" — Tandil

**Alumna:** Tatiana Pebay Vulcano

T.B.YOU Accesorios es un emprendimiento de accesorios unisex de acero quirúrgico, blanco y dorado, que además vende mochilas, billeteras, bolsos y accesorios para el pelo. Este repositorio contiene el **backend de la tienda online**: una API REST y las páginas de la tienda, conectadas a una base de datos PostgreSQL.

## Tecnologías

- **Node.js + Express**: servidor y rutas.
- **PostgreSQL**: base de datos (librería `pg`).
- **EJS**: plantillas para las vistas de la tienda.
- **Arquitectura MVC**: modelos, vistas y controladores separados.
- **Postman**: pruebas de los endpoints.

## Estructura del proyecto (MVC)

```
tbyou-accesorios/
├── database/
│   ├── ddl.sql              # Crea la base, tablas, claves, relaciones y restricciones
│   └── dml.sql              # Inserta y modifica los datos iniciales
├── postman/
│   └── TBYOU_Accesorios.postman_collection.json
├── public/                  # Archivos estáticos (CSS, JS, imágenes)
├── src/
│   ├── config/db.js         # Conexión con PostgreSQL
│   ├── models/              # M: consultas SQL a cada tabla
│   ├── views/               # V: páginas EJS de la tienda
│   ├── controllers/         # C: reciben la petición, validan y responden
│   ├── routes/              # Asocian cada URL con su controlador
│   ├── middlewares/         # Manejo de errores
│   ├── utils/               # Validaciones y encriptado de contraseñas
│   ├── app.js               # Configuración de Express
│   └── server.js            # Arranque del servidor
├── .env.example
└── package.json
```

## Base de datos

| Tabla | Para qué sirve |
|---|---|
| `categorias` | Aros, anillos, collares, mochilas, etc. |
| `proveedores` | Mayoristas donde se compra la mercadería |
| `productos` | Catálogo con costo, precio de venta, stock y material |
| `usuarios` | Clientes y administradores (contraseña encriptada) |
| `pedidos` | Compras de los clientes, con estado y total |
| `pedido_detalle` | Productos de cada pedido (relación muchos a muchos) |

Relaciones:

- Cada producto pertenece a una categoría y, opcionalmente, a un proveedor.
- Cada pedido pertenece a un usuario.
- Cada pedido tiene uno o más productos, que se guardan en `pedido_detalle`.

Restricciones principales:

- El precio de venta no puede ser menor al costo.
- El stock no puede quedar negativo.
- El email de cada usuario es único.
- El estado de un pedido solo puede ser `pendiente`, `pagado`, `enviado`, `entregado` o `cancelado`.

## Cómo ejecutarlo

**Requisitos:** Node.js 18 o superior y PostgreSQL 14 o superior.

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Crear la base de datos y cargar los datos**
   ```bash
   psql -U postgres -f database/ddl.sql
   psql -U postgres -d tbyou_accesorios -f database/dml.sql
   ```
   El DDL borra y vuelve a crear la base `tbyou_accesorios`, así que sirve también para empezar de cero.
   También se pueden ejecutar los dos archivos desde pgAdmin, en ese orden.

3. **Configurar la conexión**
   Copiar `.env.example` como `.env` y completar el usuario y la contraseña de PostgreSQL.

4. **Iniciar el servidor**
   ```bash
   npm start          # o npm run dev para que se reinicie solo al guardar cambios
   ```
   La consola tiene que mostrar `Conectado a PostgreSQL`.

5. **Abrir la tienda:** http://localhost:3000

## Endpoints de la API

Base: `http://localhost:3000/api`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categorias` | Lista las categorías con la cantidad de productos |
| GET | `/categorias/:id` | Ver una categoría |
| POST | `/categorias` | Crear categoría |
| PUT | `/categorias/:id` | Modificar categoría |
| DELETE | `/categorias/:id` | Eliminar (solo si no tiene productos) |
| GET | `/proveedores` | Lista los proveedores |
| GET | `/proveedores/:id` | Ver un proveedor |
| POST | `/proveedores` | Crear proveedor |
| PUT | `/proveedores/:id` | Modificar proveedor |
| DELETE | `/proveedores/:id` | Eliminar proveedor |
| GET | `/productos` | Lista productos. Filtros: `?categoria=1`, `?material=acero dorado`, `?buscar=aro` |
| GET | `/productos/:id` | Ver un producto |
| POST | `/productos` | Crear producto |
| PUT | `/productos/:id` | Modificar producto (también `{ "activo": false }` para ocultarlo) |
| PATCH | `/productos/:id/stock` | Sumar o restar stock: `{ "cantidad": 5 }` o `{ "cantidad": -2 }` |
| DELETE | `/productos/:id` | Eliminar (si está en pedidos, hay que desactivarlo) |
| POST | `/usuarios` | Registrar usuario |
| POST | `/usuarios/login` | Iniciar sesión |
| GET | `/usuarios` | Lista usuarios (sin contraseñas) |
| GET | `/usuarios/:id` | Ver un usuario |
| PUT | `/usuarios/:id` | Modificar usuario |
| DELETE | `/usuarios/:id` | Eliminar (solo si no tiene pedidos) |
| GET | `/pedidos` | Lista pedidos. Filtros: `?usuario=2`, `?estado=pendiente` |
| GET | `/pedidos/:id` | Ver pedido con sus productos |
| POST | `/pedidos` | Crear pedido: controla y descuenta stock, calcula el total |
| PATCH | `/pedidos/:id/estado` | Cambiar estado (al cancelar, devuelve el stock) |
| DELETE | `/pedidos/:id` | Eliminar (solo pedidos cancelados) |

Ejemplo para crear un pedido:

```json
POST /api/pedidos
{
  "usuario_id": 2,
  "direccion_envio": "Pinto 450, Tandil",
  "items": [
    { "producto_id": 1, "cantidad": 2 },
    { "producto_id": 23, "cantidad": 1 }
  ]
}
```

Crear y cancelar pedidos se hace dentro de una **transacción**: si falla algo, por ejemplo falta stock de un producto, no se guarda nada a medias.

## Pruebas con Postman

1. En Postman: **Import** → elegir `postman/TBYOU_Accesorios.postman_collection.json`.
2. Con el servidor encendido, abrir la colección y tocar **Run** (Runner) para ejecutar todas las pruebas en orden.

Cada petición tiene un test que comprueba el código de respuesta. Hay casos que funcionan y casos de error a propósito (precio menor al costo, stock insuficiente, email repetido, etc.). Para comprobar que los datos se guardan en PostgreSQL se pueden consultar las tablas en pgAdmin antes y después de cada prueba.

**Usuarios de prueba** (cargados por el DML):

| Email | Contraseña | Rol |
|---|---|---|
| tbyouaccesorios@gmail.com | admin123 | admin |
| mariana.gomez@mail.com | cliente123 | cliente |
| sofia.martinez@mail.com | cliente456 | cliente |

## Imágenes

Las imágenes de los productos van en `public/images/productos/` con el nombre indicado en la columna `imagen_url`, por ejemplo `aros-tres-gotas.jpg`. El logo va en `public/images/logo.png` y los banners del inicio en `public/images/banner1.jpg`, `banner2.jpg` y `banner3.jpg`. Si una imagen no está, la página muestra una imagen genérica.
