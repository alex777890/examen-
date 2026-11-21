import './style.css';

// ==========================================
// REGISTRO DEL SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registro) => {
        console.log('✅ Service Worker registrado con éxito en el scope:', registro.scope);
      })
      .catch((error) => {
        console.error('❌ Error al registrar el Service Worker:', error);
      });
  });
}

// ==========================================
// 1. ESTADO DE LA APLICACIÓN
// ==========================================
// Intentamos cargar los datos desde localStorage al iniciar. Si no hay, usamos arrays vacíos.
let estudiantes = JSON.parse(localStorage.getItem('sportschool_estudiantes')) || [];
let actividades = JSON.parse(localStorage.getItem('sportschool_actividades')) || [];
let ubicacionTemporal = null;

// ==========================================
// 2. REFERENCIAS AL DOM
// ==========================================
const splash = document.getElementById('splash');
const home = document.getElementById('home');
const formEstudiante = document.getElementById('form-estudiante');
const formActividad = document.getElementById('form-actividad');
const selectEstudiante = document.getElementById('select-estudiante');
const tablaHistorialBody = document.querySelector('#tabla-historial tbody');
const contenedorIndicadores = document.getElementById('indicadores');
const mensajeVacio = document.getElementById('mensaje-vacio');
const btnUbicacion = document.getElementById('btn-ubicacion');
const estadoUbicacion = document.getElementById('estado-ubicacion');
const btnFetch = document.getElementById('btn-fetch');
const salidaFetch = document.getElementById('salida-fetch');
const btnNotificaciones = document.getElementById('btn-notificaciones');
const estadoNotificaciones = document.getElementById('estado-notificaciones');

// ==========================================
// 3. SPLASH SCREEN
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    splash.classList.add('hidden');
    home.classList.remove('hidden');
  }, 1500);
});

// ==========================================
// 4. ALMACENAMIENTO LOCAL (localStorage)
// ==========================================
function guardarEnLocalStorage() {
  localStorage.setItem('sportschool_estudiantes', JSON.stringify(estudiantes));
  localStorage.setItem('sportschool_actividades', JSON.stringify(actividades));
}

// ==========================================
// 5. RENDERIZADO DINÁMICO (CSR)
// ==========================================
function renderizarSelectEstudiantes() {
  selectEstudiante.innerHTML = '<option value="">Selecciona un estudiante...</option>';
  estudiantes.forEach(est => {
    const option = document.createElement('option');
    option.value = est.id;
    option.textContent = `${est.nombre} (${est.grupo})`;
    selectEstudiante.appendChild(option);
  });
}

function renderizarIndicadores() {
  const totalActividades = actividades.length;
  const tiempoTotal = actividades.reduce((sum, act) => sum + Number(act.duracion), 0);
  const distanciaTotal = actividades.reduce((sum, act) => sum + Number(act.distancia), 0);

  contenedorIndicadores.innerHTML = `
    <div class="indicador">Actividades registradas<strong>${totalActividades}</strong></div>
    <div class="indicador">Tiempo acumulado<strong>${tiempoTotal} min</strong></div>
    <div class="indicador">Distancia recorrida<strong>${distanciaTotal.toFixed(2)} km</strong></div>
  `;
}

function renderizarHistorial() {
  tablaHistorialBody.innerHTML = '';
  if (actividades.length === 0) {
    mensajeVacio.classList.remove('hidden');
    return;
  }
  mensajeVacio.classList.add('hidden');

  actividades.forEach(act => {
    const estudiante = estudiantes.find(e => e.id === act.estudianteId);
    const nombreEstudiante = estudiante ? estudiante.nombre : 'Desconocido';
    const textoUbicacion = act.ubicacion ? `${act.ubicacion.lat.toFixed(4)}, ${act.ubicacion.lng.toFixed(4)}` : '-';

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${nombreEstudiante}</td>
      <td>${act.fecha}</td>
      <td>${act.actividad}</td>
      <td>${act.duracion}</td>
      <td>${act.distancia}</td>
      <td>${act.observaciones || '-'}</td>
      <td>${textoUbicacion}</td>
    `;
    tablaHistorialBody.appendChild(fila);
  });
}

function actualizarInterfaz() {
  renderizarSelectEstudiantes();
  renderizarIndicadores();
  renderizarHistorial();
}

// ==========================================
// 6. NOTIFICACIONES LOCALES (Notification API)
// ==========================================
function mostrarNotificacion() {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification('SportSchool', { 
      body: '¡Actividad deportiva registrada con éxito!',
      icon: '/pwa-192x192.png'
    });
  }
}

  if (Notification.permission === 'granted') {
    new Notification('SportSchool', { 
      body: '¡Actividad deportiva registrada con éxito!',
      icon: '/pwa-192x192.png'
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('SportSchool', { 
          body: '¡Actividad deportiva registrada con éxito!',
          icon: '/pwa-192x192.png'
        });
      }
    });
  }


// ==========================================
// 7. FETCH API (Envío demostrativo)
// ==========================================
async function enviarActividadRemota(actividad) {
  // Usamos JSONPlaceholder como endpoint de prueba (no guarda datos reales, solo simula respuesta)
  const url = 'https://jsonplaceholder.typicode.com/posts';
  
  try {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actividad)
    });

    if (!respuesta.ok) throw new Error('Error en la petición');

    const datos = await respuesta.json();
    console.log('✅ Fetch exitoso. Respuesta simulada:', datos);
    return { exito: true, datos };
  } catch (error) {
    // Si falla (ej. porque estamos offline), atrapamos el error sin romper la app
    console.warn('⚠️ Fetch falló (posiblemente offline):', error.message);
    return { exito: false, error: error.message };
  }
}

// ==========================================
// 8. MANEJO DE EVENTOS
// ==========================================
formEstudiante.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(formEstudiante);
  const nuevoEstudiante = {
    id: Date.now().toString(),
    nombre: formData.get('nombre'),
    grupo: formData.get('grupo'),
    disciplina: formData.get('disciplina')
  };

  estudiantes.push(nuevoEstudiante);
  guardarEnLocalStorage(); 
  formEstudiante.reset();
  actualizarInterfaz();
});

formActividad.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(formActividad);
  
  if (!formData.get('estudianteId')) {
    alert('Por favor, selecciona un estudiante');
    return;
  }

  const nuevaActividad = {
    id: Date.now().toString(),
    estudianteId: formData.get('estudianteId'),
    fecha: formData.get('fecha'),
    actividad: formData.get('actividad'),
    duracion: Number(formData.get('duracion')),
    distancia: Number(formData.get('distancia')),
    observaciones: formData.get('observaciones'),
    ubicacion: ubicacionTemporal
  };

  actividades.push(nuevaActividad);
  guardarEnLocalStorage(); 
  
  // Llamar a la API Fetch en segundo plano
  enviarActividadRemota(nuevaActividad).then(resultado => {
    if (resultado.exito) {
      console.log('Sincronización demostrativa completada.');
    }
  });

  // ¡AQUÍ ESTÁ LA MAGIA DE LA PARTE 4! Llamamos a la notificación
  mostrarNotificacion();

  formActividad.reset(); 
  ubicacionTemporal = null;
  estadoUbicacion.textContent = '';
  actualizarInterfaz();
});

btnUbicacion.addEventListener('click', () => {
  if (!navigator.geolocation) {
    estadoUbicacion.textContent = 'Geolocalización no soportada';
    return;
  }
  estadoUbicacion.textContent = 'Obteniendo ubicación...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      ubicacionTemporal = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      estadoUbicacion.textContent = `Ubicación capturada: ${ubicacionTemporal.lat.toFixed(4)}, ${ubicacionTemporal.lng.toFixed(4)}`;
    },
    (error) => {
      estadoUbicacion.textContent = 'Error al obtener ubicación';
      console.error(error);
    }
  );
});

btnFetch.addEventListener('click', async () => {
  salidaFetch.textContent = 'Realizando petición Fetch...';
  
  const actividadPrueba = {
    title: 'Prueba SportSchool',
    body: 'Envío demostrativo mediante Fetch API',
    userId: 1
  };

  const resultado = await enviarActividadRemota(actividadPrueba);
  
  if (resultado.exito) {
    salidaFetch.textContent = `✅ Éxito. Datos enviados:\n${JSON.stringify(actividadPrueba, null, 2)}\n\nRespuesta del servidor:\n${JSON.stringify(resultado.datos, null, 2)}`;
  } else {
    salidaFetch.textContent = `❌ Error: ${resultado.error}\n\n(Nota: Si estás offline, este error es esperado. La app sigue funcionando).`;
  }
});


// Evento para pedir permiso de notificaciones de forma manual
btnNotificaciones.addEventListener('click', () => {
  if (!('Notification' in window)) {
    estadoNotificaciones.textContent = 'Tu navegador no soporta notificaciones.';
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      estadoNotificaciones.textContent = '✅ Notificaciones activadas';
      new Notification('SportSchool', { 
        body: '¡Notificaciones activadas correctamente!',
        icon: '/pwa-192x192.png'
      });
    } else {
      estadoNotificaciones.textContent = '❌ Permiso denegado';
    }
  });
});

// Inicializar la interfaz con los datos recuperados de localStorage
actualizarInterfaz();