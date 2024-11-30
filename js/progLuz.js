import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getFirestore, doc, updateDoc, arrayUnion, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigHistorial } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const ledRef = ref(database, 'luces');

const historialApp = initializeApp(firebaseConfigHistorial, "historialApp");
const dbHistorial = getFirestore(historialApp);
const historialRef = ref(getDatabase(historialApp), 'DataPas/Historial/CambioEstadoLed');

// Escuchar cambios en tiempo real en la base de datos principal
onValue(ledRef, (snapshot) => {
  const estadoActual = snapshot.val();
  const horaCambio = new Date();
  const fechaFormateada = obtenerFechaFormateada(horaCambio);

  // Actualizar el estado del switch en la interfaz
  const switchInput = document.getElementById('lucesSwitch');
  switchInput.checked = estadoActual === 1;
  document.getElementById("switchLabel").textContent = estadoActual === 1 ? "" : "";

  // Guardar en el historial cuando cambie el estado
  guardarEstadoEnHistorial(estadoActual, fechaFormateada);

  // Registrar en Firebase Database para historial
  push(historialRef, {
    estado: estadoActual,
    hora: fechaFormateada
  });
});

// Función para guardar el historial en Firestore
function guardarEstadoEnHistorial(estadoLED, fechaFormateada) {
  const historialDocRef = doc(dbHistorial, "DataPas", "Historial");

  // Determinar el campo a actualizar (ledon o ledoff)
  const campo = estadoLED === 1 ? "ledon" : "ledoff";

  updateDoc(historialDocRef, {
    [campo]: arrayUnion(fechaFormateada)
  }).then(() => {
    console.log(`Cambio registrado en ${campo}: ${fechaFormateada}`);
  }).catch(console.error);
}

// Función para formatear la fecha y hora
function obtenerFechaFormateada(fecha) {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  const segundo = String(fecha.getSeconds()).padStart(2, '0');
  return `${año}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

// Eventos para controlar manualmente el switch desde la interfaz
document.getElementById('lucesSwitch').addEventListener('change', (event) => {
  const nuevoEstado = event.target.checked ? 1 : 0;

  set(ledRef, nuevoEstado)
    .then(() => console.log(`Estado de luces actualizado a: ${nuevoEstado === 1 ? 'Encendido' : 'Apagado'}`))
    .catch(console.error);
});

// Función para abrir el modal y programar encendido o apagado
document.getElementById('programarEncendidoBtn').addEventListener('click', () => {
  document.getElementById('modal-config').style.display = 'block';
  document.getElementById('guardarConfigBtn').onclick = programarEncendido;
});

document.getElementById('programarApagadoBtn').addEventListener('click', () => {
  document.getElementById('modal-config').style.display = 'block';
  document.getElementById('guardarConfigBtn').onclick = programarApagado;
});

// Función para cerrar el modal
document.getElementById('closeModalBtn').addEventListener('click', () => {
  document.getElementById('modal-config').style.display = 'none';
});

// Función para programar el encendido de las luces en días específicos
function programarEncendido() {
  const hora = document.getElementById('hora').value;
  const diasSeleccionados = flatpickr("#calendar").selectedDates;

  if (!hora || diasSeleccionados.length === 0) {
    alert('Por favor selecciona una hora y al menos un día.');
    return;
  }

  const [horaSeleccionada, minutoSeleccionado] = hora.split(':');
  const ahora = new Date();
  let tiempoRestante;

  diasSeleccionados.forEach(dia => {
    // Configurar la hora para cada día seleccionado
    const horaProgramada = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horaSeleccionada, minutoSeleccionado);

    if (horaProgramada <= ahora) {
      // Si la hora ya pasó para ese día, programar para el siguiente año
      horaProgramada.setFullYear(ahora.getFullYear() + 1);
    }

    tiempoRestante = horaProgramada.getTime() - ahora.getTime();

    // Programar el encendido para ese día
    setTimeout(() => {
      set(ledRef, 1)
        .then(() => {
          console.log(`LED encendido automáticamente el ${horaProgramada}`);
          // Registrar en el historial
          const horaCambio = new Date();
          const fechaFormateada = obtenerFechaFormateada(horaCambio);
          push(historialRef, {
            estado: 1,
            hora: fechaFormateada
          });
        })
        .catch(console.error);
    }, tiempoRestante);
  });

  document.getElementById('modal-config').style.display = 'none';
}

// Función para programar el apagado de las luces en días específicos
function programarApagado() {
  const hora = document.getElementById('hora').value;
  const diasSeleccionados = flatpickr("#calendar").selectedDates;

  if (!hora || diasSeleccionados.length === 0) {
    alert('Por favor selecciona una hora y al menos un día.');
    return;
  }

  const [horaSeleccionada, minutoSeleccionado] = hora.split(':');
  const ahora = new Date();
  let tiempoRestante;

  diasSeleccionados.forEach(dia => {
    // Configurar la hora para cada día seleccionado
    const horaProgramada = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horaSeleccionada, minutoSeleccionado);

    if (horaProgramada <= ahora) {
      // Si la hora ya pasó para ese día, programar para el siguiente año
      horaProgramada.setFullYear(ahora.getFullYear() + 1);
    }

    tiempoRestante = horaProgramada.getTime() - ahora.getTime();

    // Programar el apagado para ese día
    setTimeout(() => {
      set(ledRef, 0)
        .then(() => {
          console.log(`LED apagado automáticamente el ${horaProgramada}`);
          // Registrar en el historial
          const horaCambio = new Date();
          const fechaFormateada = obtenerFechaFormateada(horaCambio);
          push(historialRef, {
            estado: 0,
            hora: fechaFormateada
          });
        })
        .catch(console.error);
    }, tiempoRestante);
  });

  document.getElementById('modal-config').style.display = 'none';
}





