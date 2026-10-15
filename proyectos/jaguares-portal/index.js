// ============================================================================
//  Lógica de la página de inicio (inscripción y modalidades).
//  Extraído del <script> en línea de index.html para que el editor aplique
//  el chequeo estricto (jsconfig.json + globals.d.ts) y valide tipos/nulos.
// ============================================================================
// @ts-check

/**
 * @typedef {Object} Clase
 * @property {number} [id]
 * @property {number} [Id]
 * @property {string} [horario]
 * @property {string} [Horario]
 * @property {number} [costo]
 * @property {number} [Costo]
 * @property {string} [descripcion]
 * @property {string} [Descripcion]
 * @property {string} [nivel]
 * @property {string} [Nivel]
 */

const apiClasesUrl = '/api/Clases';
const apiAlumnosUrl = '/api/Alumnos';

/** @type {Clase[]} */
const backupClases = [
    { Id: 1, Horario: '🔹 Modalidad #1 – 2 clases por semana', Costo: 800, Descripcion: '📆 Días: A elegir\n💰 Costo: $800 (8 clases en 4 semanas)' },
    { Id: 2, Horario: '🔹 Modalidad #2 – 3 clases por semana', Costo: 900, Descripcion: '📆 Días: A elegir\n💰 Costo: $900 (12 clases en 4 semanas)' },
    { Id: 3, Horario: '🔹 Modalidad #3 – Clases de lunes a viernes', Costo: 1160, Descripcion: '📆 Días: Lunes a viernes\n💰 Costo: $1,160 (20 clases en 4 semanas)' }
];

async function cargarClases() {
    try {
        const respuesta = await apiFetch(`${apiClasesUrl}?cb=${Date.now()}`);
        const clases = await respuesta.json();
        renderClases(clases);
    } catch (error) {
        console.warn('API no disponible, usando datos locales.', error);
        renderClases(backupClases);
    }
}

/** @param {Clase[]} clases */
function renderClases(clases) {
    const contenedor = byId('contenedorTarjetas');
    const contenedorNinos = byId('contenedorTarjetasNinos');
    const selector = /** @type {HTMLSelectElement} */ (byId('formClaseId'));
    contenedor.innerHTML = '';
    contenedorNinos.innerHTML = '';
    selector.innerHTML = '';

    const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const esClaseNinos = clase => normalizar(clase.nivel || clase.Nivel) === 'ninos'
        || normalizar(clase.horario || clase.Horario).includes('ninos')
        || normalizar(clase.descripcion || clase.Descripcion).includes('tipo: ninos');
    const clasesGenerales = clases.filter(clase => !esClaseNinos(clase));
    const clasesNinos = clases.filter(esClaseNinos);

    const crearTarjeta = (clase, destino) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'price-card';
        const horario = clase.horario || clase.Horario || 'Sin horario';
        const costo = clase.costo ?? clase.Costo ?? 0;
        const descripcion = (clase.descripcion || clase.Descripcion || '').replace(/\s\|\s/g, '<br>').replace(/\n/g, '<br>');
        tarjeta.innerHTML = `
            <h3>${horario}</h3>
            <div class="price">$${costo} MXN <span style="font-size:14px; font-weight:normal; color:#6e6e73;">/ mes</span></div>
            <p style="font-size:13px; color:#666; margin-top:8px;">${descripcion}</p>
        `;
        destino.appendChild(tarjeta);
    };

    clasesGenerales.forEach(clase => crearTarjeta(clase, contenedor));
    clasesNinos.forEach(clase => crearTarjeta(clase, contenedorNinos));

    if (!clasesGenerales.length) contenedor.innerHTML = '<p class="section-note">Próximamente publicaremos nuevas modalidades.</p>';
    if (!clasesNinos.length) contenedorNinos.innerHTML = '<p class="section-note">Próximamente publicaremos las modalidades exclusivas para niños.</p>';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona una modalidad';
    placeholder.selected = true;
    placeholder.disabled = true;
    selector.appendChild(placeholder);

    const agregarGrupoOpciones = (titulo, grupoClases) => {
        if (!grupoClases.length) return;
        const grupo = document.createElement('optgroup');
        grupo.label = titulo;
        grupoClases.forEach(clase => {
            const horario = clase.horario || clase.Horario || 'Sin horario';
            const costo = clase.costo ?? clase.Costo ?? 0;
            const opcion = document.createElement('option');
            opcion.value = String(clase.id ?? clase.Id ?? '');
            opcion.textContent = `${horario} — $${Number(costo).toLocaleString('es-MX')} MXN`;
            opcion.title = opcion.textContent;
            grupo.appendChild(opcion);
        });
        selector.appendChild(grupo);
    };

    agregarGrupoOpciones('Modalidades generales', clasesGenerales);
    agregarGrupoOpciones('Clases para niños · Echeverría Fitness Center', clasesNinos);

    const modalBtn = byId('btnModalidades');
    modalBtn.onclick = () => showModal(clases);
    ensureSelectorHasPlaceholder(selector);
}

function playScratchAnimation() {
    const scratch = byId('jaguarScratch');

    // Lanzar confeti dorado y blanco
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#ffffff', '#f3cf5c']
    });

    // Intentar reproducir sonido (byId valida que el elemento exista)
    const roar = /** @type {HTMLAudioElement} */ (byId('roarSound'));
    roar.currentTime = 0;
    roar.play().catch(err => console.warn("No se pudo reproducir el rugido:", err));

    scratch.classList.add('slash-active');

    return new Promise(resolve => setTimeout(() => {
        scratch.classList.remove('slash-active');
        resolve(undefined);
    }, 2500));
}

const registroForm = /** @type {HTMLFormElement} */ (byId('registroAlumnoForm'));
registroForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameInput = /** @type {HTMLInputElement} */ (byId('formNombre'));
    const phoneInput = /** @type {HTMLInputElement} */ (byId('formTelefono'));
    const classSelect = /** @type {HTMLSelectElement} */ (byId('formClaseId'));
    const messageEl = byId('registroMessage');
    messageEl.textContent = '';
    messageEl.classList.remove('error');

    const nombre = nameInput.value.trim();
    const telefono = phoneInput.value.trim();
    const claseId = parseInt(classSelect.value, 10);
    const telefonoValido = /^[0-9]{10}$/.test(telefono);

    if (!nombre) {
        messageEl.textContent = 'Ingresa tu nombre completo.';
        messageEl.classList.add('error');
        return;
    }

    if (!telefonoValido) {
        messageEl.textContent = 'Ingresa un número de WhatsApp válido de 10 dígitos.';
        messageEl.classList.add('error');
        return;
    }

    if (!claseId) {
        messageEl.textContent = 'Selecciona una modalidad antes de enviar.';
        messageEl.classList.add('error');
        return;
    }

    const passwordInput = /** @type {HTMLInputElement} */ (byId('formPassword'));
    const nuevoAlumno = {
        nombreCompleto: nombre,
        telefono,
        password: passwordInput.value.trim(),
        nivelNado: 'General Nocturno',
        claseId
    };

    const submitBtn = /** @type {HTMLButtonElement | null} */ (registroForm.querySelector('button[type="submit"]'));
    if (!submitBtn) return;
    const originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = 'PROCESANDO...';

    try {
        const respuesta = await apiFetch(apiAlumnosUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoAlumno)
        });
        if (respuesta.ok) {
            await playScratchAnimation();
            Swal.fire('¡Éxito!', 'Inscripción registrada. ¡Nos vemos en la alberca! 🐆', 'success');
            registroForm.reset();
        } else {
            const mensaje = await respuesta.text();
            Swal.fire('Error', mensaje, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});

/** @param {HTMLSelectElement} selector */
function ensureSelectorHasPlaceholder(selector) {
    if (selector && selector.options.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No hay modalidades disponibles';
        selector.appendChild(opt);
    }
}

/** @param {Clase[]} clases */
function showModal(clases) {
    let backdrop = document.getElementById('modalBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'modalBackdrop';
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
                <span class="close">✕</span>
                <h3>Modalidades y Precios</h3>
                <div id="modalContent"></div>
            </div>
        `;
        document.body.appendChild(backdrop);
        const fondo = backdrop;
        const closeBtn = backdrop.querySelector('.close');
        if (closeBtn) closeBtn.addEventListener('click', () => fondo.classList.remove('show'));
        backdrop.addEventListener('click', (e) => { if (e.target === fondo) fondo.classList.remove('show'); });
    }
    const content = /** @type {HTMLElement | null} */ (backdrop.querySelector('#modalContent'));
    if (!content) return;
    content.innerHTML = '';
    clases.forEach(clase => {
        const horario = clase.horario || clase.Horario || 'Sin horario';
        const costo = clase.costo ?? clase.Costo ?? 0;
        const descripcion = (clase.descripcion || clase.Descripcion || '').replace(/\s\|\s/g, '<br>').replace(/\n/g, '<br>');
        const row = document.createElement('div');
        row.className = 'clase-row';
        row.innerHTML = `<strong>${horario}</strong> — <span style="color:var(--water-blue)">$${costo}</span> / mes<div style="margin-top:10px; color:#cfd7dd; font-size:13px;">${descripcion}</div>`;
        content.appendChild(row);
    });
    backdrop.classList.add('show');
}

cargarClases();
cargarGaleriaPersonalizada();

function cargarGaleriaPersonalizada() {
    try {
        const guardadas = JSON.parse(localStorage.getItem('jaguares_galeria_v1') || '[]');
        if (!Array.isArray(guardadas) || !guardadas.length) return;
        const galeria = byId('galeriaPublica');
        galeria.innerHTML = '';
        guardadas.forEach(foto => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.backgroundImage = `url(${foto.imagen})`;
            const titulo = document.createElement('span');
            titulo.textContent = foto.titulo || 'Jaguares Swim';
            item.appendChild(titulo);
            galeria.appendChild(item);
        });
    } catch (error) {
        console.warn('No se pudo cargar la galería personalizada.', error);
    }
}
