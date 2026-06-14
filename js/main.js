// ===== DATOS =====
let tareas = JSON.parse(localStorage.getItem('tareas')) || [];
let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();

// ===== GUARDAR EN LOCALSTORAGE =====
function guardarTareas() {
    localStorage.setItem('tareas', JSON.stringify(tareas));
}

// ===== SALUDO SEGÚN HORA =====
function obtenerSaludo() {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) return 'Buenos días';
    if (hora >= 12 && hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

// ===== FECHA Y HORA EN TIEMPO REAL =====
function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = ahora.toLocaleDateString('es-AR', opciones);
    const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('saludo-hora').textContent = obtenerSaludo();
    document.getElementById('fecha-hoy').innerHTML = `
    <span>${fecha}</span>
    <span class="badge-hora"><i class="bi bi-clock"></i> ${hora}</span>
  `;

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('input-fecha').min = hoy;
}

// ===== FORMATO DE FECHA =====
function formatearFecha(fechaStr) {
    if (!fechaStr) return null;
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio}`;
}

function estaVencida(fechaStr) {
    if (!fechaStr) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha < hoy;
}

function esHoy(fechaStr) {
    if (!fechaStr) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return fechaStr === hoy;
}

// ===== CREAR TARJETA DE TAREA =====
function crearTarjetaTarea(tarea) {
    const article = document.createElement('article');
    article.classList.add('tarea-card');
    if (tarea.completada) article.classList.add('completada');

    const vencida = !tarea.completada && estaVencida(tarea.fecha);

    article.innerHTML = `
    <input
      type="checkbox"
      class="tarea-check"
      ${tarea.completada ? 'checked' : ''}
      aria-label="Marcar como completada"
    />
    <div class="tarea-info">
      <p class="tarea-nombre">${tarea.nombre}</p>
      ${tarea.fecha ? `
        <span class="tarea-fecha ${vencida ? 'vencida' : ''}">
          <i class="bi bi-calendar3"></i>
          ${vencida ? 'Vencida — ' : ''}${formatearFecha(tarea.fecha)}
          ${tarea.hora ? `<i class="bi bi-clock ms-2"></i> ${tarea.hora}` : ''}
        </span>
      ` : ''}
    </div>
    <button class="btn-eliminar" aria-label="Eliminar tarea">
      <i class="bi bi-trash3"></i>
    </button>
  `;

    article.querySelector('.tarea-check').addEventListener('change', (e) => {
        tarea.completada = e.target.checked;
        guardarTareas();
        renderizar();
    });

    article.querySelector('.btn-eliminar').addEventListener('click', () => {
        tareas = tareas.filter(t => t.id !== tarea.id);
        guardarTareas();
        renderizar();
    });

    return article;
}

// ===== RENDERIZAR VISTAS =====
function renderizar() {
    renderizarInicio();
    renderizarTodas();
    renderizarPendientes();
    renderizarCompletadas();
    renderizarCalendario();
}

function renderizarInicio() {
    const contenedor = document.getElementById('tareas-hoy');
    const sinTareas = document.getElementById('sin-tareas-hoy');
    const tareasHoy = tareas.filter(t => esHoy(t.fecha));

    contenedor.innerHTML = '';

    if (tareasHoy.length === 0) {
        sinTareas.classList.remove('d-none');
    } else {
        sinTareas.classList.add('d-none');
        tareasHoy.forEach(t => contenedor.appendChild(crearTarjetaTarea(t)));
    }
}

function renderizarLista(contenedorId, sinTareasId, contadorId, filtro) {
    const contenedor = document.getElementById(contenedorId);
    const sinTareas = document.getElementById(sinTareasId);
    const contador = document.getElementById(contadorId);

    const lista = filtro ? tareas.filter(filtro) : tareas;
    contenedor.innerHTML = '';

    contador.textContent = `${lista.length} tarea${lista.length !== 1 ? 's' : ''}`;

    if (lista.length === 0) {
        sinTareas.classList.remove('d-none');
    } else {
        sinTareas.classList.add('d-none');
        lista.forEach(t => contenedor.appendChild(crearTarjetaTarea(t)));
    }
}

function renderizarTodas() {
    renderizarLista('lista-todas', 'sin-tareas-todas', 'contador-todas', null);
}

function renderizarPendientes() {
    renderizarLista('lista-pendientes', 'sin-tareas-pendientes', 'contador-pendientes', t => !t.completada);
}

function renderizarCompletadas() {
    renderizarLista('lista-completadas', 'sin-tareas-completadas', 'contador-completadas', t => t.completada);
}

// ===== MODAL DE TAREAS POR DÍA =====
function mostrarModalDia(fechaStr, tareasDia) {
    const [anio, mes, dia] = fechaStr.split('-');
    const fechaFormateada = `${dia}/${mes}/${anio}`;

    const modalAnterior = document.getElementById('modal-dia');
    if (modalAnterior) modalAnterior.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-dia';
    modal.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <article class="modal-card">
        <header class="modal-header">
          <h3>Tareas del ${fechaFormateada}</h3>
          <button class="btn-cerrar-modal" id="btn-cerrar-modal" aria-label="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>
        <div class="modal-body">
          ${tareasDia.map(t => `
            <div class="tarea-card ${t.completada ? 'completada' : ''}">
              <input
                type="checkbox"
                class="tarea-check"
                ${t.completada ? 'checked' : ''}
                data-id="${t.id}"
                aria-label="Marcar como completada"
              />
              <div class="tarea-info">
                <p class="tarea-nombre">${t.nombre}</p>
                ${t.hora ? `
                  <span class="tarea-fecha">
                    <i class="bi bi-clock"></i> ${t.hora}
                  </span>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </article>
    </div>
  `;

    document.body.appendChild(modal);

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => modal.remove());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') modal.remove();
    });

    modal.querySelectorAll('.tarea-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = Number(e.target.dataset.id);
            const tarea = tareas.find(t => t.id === id);
            if (tarea) {
                tarea.completada = e.target.checked;
                guardarTareas();
                renderizar();
                modal.remove();
            }
        });
    });
}

// ===== CALENDARIO =====
function renderizarCalendario() {
    const contenedor = document.getElementById('grilla-calendario');
    const titulo = document.getElementById('titulo-calendario');

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    titulo.textContent = `${meses[mesActual]} ${anioActual}`;

    const primerDia = new Date(anioActual, mesActual, 1).getDay();
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const diasMesAnterior = new Date(anioActual, mesActual, 0).getDate();
    const hoy = new Date().toISOString().split('T')[0];

    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    let html = `<div class="calendario-dias-semana">
    ${diasSemana.map(d => `<div>${d}</div>`).join('')}
  </div><div class="calendario-grilla">`;

    for (let i = primerDia - 1; i >= 0; i--) {
        html += `<div class="calendario-dia otro-mes">${diasMesAnterior - i}</div>`;
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
        const mes = String(mesActual + 1).padStart(2, '0');
        const diaStr = String(dia).padStart(2, '0');
        const fechaStr = `${anioActual}-${mes}-${diaStr}`;
        const tareasDia = tareas.filter(t => t.fecha === fechaStr);
        const esHoyDia = fechaStr === hoy;

        html += `
      <div
        class="calendario-dia ${esHoyDia ? 'hoy' : ''} ${tareasDia.length > 0 ? 'tiene-tareas' : ''}"
        data-fecha="${fechaStr}"
      >
        <span class="dia-numero">${dia}</span>
        ${tareasDia.length > 0 ? `<span class="dia-badge">${tareasDia.length}</span>` : ''}
      </div>
    `;
    }

    html += '</div>';
    contenedor.innerHTML = html;

    contenedor.querySelectorAll('.calendario-dia:not(.otro-mes)').forEach(diaEl => {
        diaEl.addEventListener('click', () => {
            const fecha = diaEl.dataset.fecha;
            const tareasDia = tareas.filter(t => t.fecha === fecha);
            if (tareasDia.length === 0) return;
            mostrarModalDia(fecha, tareasDia);
        });
    });
}

// ===== NAVEGACIÓN ENTRE VISTAS =====
const navBtns = document.querySelectorAll('.nav-btn');
const vistas = document.querySelectorAll('.vista');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'btn-tema') return;
        const vistaDestino = btn.dataset.vista;

        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        vistas.forEach(v => v.classList.add('d-none'));
        document.getElementById(`vista-${vistaDestino}`).classList.remove('d-none');

        const menu = document.getElementById('menuNavbar');
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    });
});

// ===== AGREGAR TAREA =====
document.getElementById('btn-agregar').addEventListener('click', () => {
    const input = document.getElementById('input-tarea');
    const fecha = document.getElementById('input-fecha');
    const hora = document.getElementById('input-hora');
    const errorFecha = document.getElementById('error-fecha');

    const nombre = input.value.trim();

    if (!nombre) {
        input.focus();
        return;
    }

    if (!fecha.value) {
        fecha.classList.add('is-invalid');
        errorFecha.style.display = 'block';
        fecha.focus();
        return;
    }

    fecha.classList.remove('is-invalid');
    errorFecha.style.display = 'none';

    const nuevaTarea = {
        id: Date.now(),
        nombre,
        fecha: fecha.value,
        hora: hora.value || null,
        completada: false
    };

    tareas.push(nuevaTarea);
    guardarTareas();
    renderizar();

    input.value = '';
    fecha.value = '';
    hora.value = '';
    input.focus();
});

document.getElementById('input-tarea').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btn-agregar').click();
    }
});

// ===== NAVEGACIÓN DEL CALENDARIO =====
document.getElementById('btn-mes-anterior').addEventListener('click', () => {
    mesActual--;
    if (mesActual < 0) { mesActual = 11; anioActual--; }
    renderizarCalendario();
});

document.getElementById('btn-mes-siguiente').addEventListener('click', () => {
    mesActual++;
    if (mesActual > 11) { mesActual = 0; anioActual++; }
    renderizarCalendario();
});

// ===== MODO OSCURO/CLARO =====
const btnTema = document.getElementById('btn-tema');
const temaGuardado = localStorage.getItem('tema') || 'claro';

function aplicarTema(tema) {
    document.body.classList.toggle('dark', tema === 'oscuro');
    btnTema.innerHTML = tema === 'oscuro'
        ? '<i class="bi bi-sun"></i>'
        : '<i class="bi bi-moon"></i>';
    localStorage.setItem('tema', tema);
}

btnTema.addEventListener('click', () => {
    const temaActual = document.body.classList.contains('dark') ? 'oscuro' : 'claro';
    aplicarTema(temaActual === 'oscuro' ? 'claro' : 'oscuro');
});

aplicarTema(temaGuardado);

// ===== INICIALIZAR =====
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);
renderizar();