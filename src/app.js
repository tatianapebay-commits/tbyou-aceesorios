const path = require('path');
const express = require('express');

const vistasRoutes = require('./routes/vistas.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const productosRoutes = require('./routes/productos.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');

const app = express();

// Vistas (la "V" de MVC) con el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Lectura de JSON y formularios, y archivos estáticos (CSS, JS, imágenes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Páginas de la tienda
app.use('/', vistasRoutes);

// API REST (es lo que se prueba con Postman)
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Manejo de rutas inexistentes y de errores
app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
