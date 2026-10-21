// CARRITO DE COMPRAS
// Se guarda en el navegador (localStorage) mientras el cliente arma su compra.
// Al confirmar, se envía al servidor (POST /api/checkout), que crea el pedido en la base,
// manda el mail a la tienda y devuelve el link de WhatsApp.

const CLAVE = 'tbyou_carrito';

function leerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE)) || [];
    } catch (e) {
        return [];
    }
}

function guardarCarrito(items) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch (e) { /* el navegador no deja guardar: el carrito dura hasta recargar */ }
    actualizarContador();
}

const pesos = (n) => '$' + Number(n).toLocaleString('es-AR');

function actualizarContador() {
    const total = leerCarrito().reduce((s, i) => s + i.cantidad, 0);
    document.querySelectorAll('.carrito-contador').forEach((el) => {
        el.textContent = total;
        el.hidden = total === 0;
    });
}

function avisar(texto) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = texto;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 2200);
}

// ---------- Botones "Agregar al carrito" (tarjetas y detalle) ----------
document.querySelectorAll('.agregar-carrito').forEach((boton) => {
    boton.addEventListener('click', () => {
        const d = boton.dataset;
        const campo = d.cantidadDesde ? document.querySelector(d.cantidadDesde) : null;
        const cantidad = Math.max(1, parseInt(campo ? campo.value : 1, 10) || 1);
        const stock = Number(d.stock);

        const items = leerCarrito();
        const existente = items.find((i) => i.id === Number(d.id));
        const yaHay = existente ? existente.cantidad : 0;

        if (yaHay + cantidad > stock) {
            avisar(`Solo quedan ${stock} unidades de ${d.nombre}`);
            return;
        }
        if (existente) {
            existente.cantidad += cantidad;
        } else {
            items.push({ id: Number(d.id), nombre: d.nombre, precio: Number(d.precio), stock, imagen: d.imagen, cantidad });
        }
        guardarCarrito(items);
        avisar(`Agregaste ${cantidad} x ${d.nombre}`);
    });
});

// ---------- Página /carrito ----------
const tbody = document.getElementById('carrito-items');

async function refrescarPrecios() {
    // Trae precio y stock actuales de la base por si cambiaron desde que se agregó
    const items = leerCarrito();
    const actualizados = await Promise.all(items.map(async (item) => {
        try {
            const r = await fetch(`/api/productos/${item.id}`);
            if (!r.ok) return null; // el producto ya no existe
            const p = await r.json();
            if (!p.activo || p.stock === 0) return null;
            return { ...item, nombre: p.nombre, precio: p.precio_venta, stock: p.stock,
                     imagen: p.imagen_url, cantidad: Math.min(item.cantidad, p.stock) };
        } catch (e) {
            return item;
        }
    }));
    const quedan = actualizados.filter(Boolean);
    if (quedan.length !== items.length) {
        mostrarAviso('Algunos productos ya no tienen stock y se sacaron del carrito.');
    }
    guardarCarrito(quedan);
}

function mostrarAviso(texto) {
    const el = document.getElementById('carrito-aviso');
    el.textContent = texto;
    el.hidden = false;
}

function dibujarCarrito() {
    const items = leerCarrito();
    document.getElementById('carrito-vacio').hidden = items.length > 0;
    document.getElementById('carrito-contenido').hidden = items.length === 0;

    tbody.innerHTML = '';
    items.forEach((item) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><img alt=""></td>
            <td class="nombre"><a></a></td>
            <td>${pesos(item.precio)}</td>
            <td><input type="number" min="1" max="${item.stock}" value="${item.cantidad}" aria-label="Cantidad"></td>
            <td>${pesos(item.precio * item.cantidad)}</td>
            <td><button type="button" class="quitar" aria-label="Quitar">&times;</button></td>`;
        const img = fila.querySelector('img');
        img.src = item.imagen || '/images/sin-imagen.svg';
        img.onerror = () => { img.onerror = null; img.src = '/images/sin-imagen.svg'; };
        const link = fila.querySelector('.nombre a');
        link.href = `/productos/${item.id}`;
        link.textContent = item.nombre;

        fila.querySelector('input').addEventListener('change', (e) => {
            const nueva = Math.min(item.stock, Math.max(1, parseInt(e.target.value, 10) || 1));
            guardarCarrito(leerCarrito().map((i) => (i.id === item.id ? { ...i, cantidad: nueva } : i)));
            dibujarCarrito();
        });
        fila.querySelector('.quitar').addEventListener('click', () => {
            guardarCarrito(leerCarrito().filter((i) => i.id !== item.id));
            dibujarCarrito();
        });
        tbody.appendChild(fila);
    });

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    document.getElementById('carrito-total').textContent = pesos(total);
}

async function confirmarCompra(e) {
    e.preventDefault();
    const form = e.target;
    const datos = Object.fromEntries(new FormData(form));
    const error = document.getElementById('form-error');
    const boton = form.querySelector('button[type=submit]');
    error.hidden = true;
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    try {
        const r = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente: { nombre: datos.nombre, apellido: datos.apellido, email: datos.email, telefono: datos.telefono },
                direccion_envio: datos.direccion_envio,
                medio_pago: datos.medio_pago,
                notas: datos.notas,
                items: leerCarrito().map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
            }),
        });
        const res = await r.json();
        if (!r.ok) throw new Error(res.error || 'No se pudo registrar el pedido');

        guardarCarrito([]);
        document.getElementById('carrito-contenido').hidden = true;
        document.getElementById('ok-titulo').textContent = res.mensaje;
        let pago = `Total: ${pesos(res.pedido.total)} · Pago: ${res.pago.medio}.`;
        if (res.pago.alias) pago += ` Alias para transferir: ${res.pago.alias}.`;
        document.getElementById('ok-pago').textContent = pago;
        if (res.pago.link) {
            const mp = document.createElement('p');
            mp.innerHTML = '<a class="boton boton-grande" target="_blank" rel="noopener">Pagar con Mercado Pago</a>';
            mp.querySelector('a').href = res.pago.link;
            document.getElementById('ok-pago').after(mp);
        }
        document.getElementById('ok-whatsapp').href = res.whatsapp_url;
        document.getElementById('compra-ok').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
        await refrescarPrecios();
        dibujarCarrito();
    } finally {
        boton.disabled = false;
        boton.textContent = 'Confirmar pedido';
    }
}

if (tbody) {
    dibujarCarrito();
    refrescarPrecios().then(dibujarCarrito);
    document.getElementById('form-compra').addEventListener('submit', confirmarCompra);
}

actualizarContador();
