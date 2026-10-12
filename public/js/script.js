// Carrusel de banners de la página de inicio.
// Solo se ejecuta si la página tiene carrusel.
const slides = document.querySelectorAll('.slide');
const botonSiguiente = document.querySelector('.next');
const botonAnterior = document.querySelector('.prev');

if (slides.length > 0 && botonSiguiente && botonAnterior) {
    let actual = 0;

    function mostrar(indice) {
        slides.forEach((slide) => slide.classList.remove('active'));
        slides[indice].classList.add('active');
    }

    botonSiguiente.addEventListener('click', () => {
        actual = (actual + 1) % slides.length;
        mostrar(actual);
    });

    botonAnterior.addEventListener('click', () => {
        actual = (actual - 1 + slides.length) % slides.length;
        mostrar(actual);
    });

    // Cambio automático cada 5 segundos
    setInterval(() => {
        actual = (actual + 1) % slides.length;
        mostrar(actual);
    }, 5000);
}
