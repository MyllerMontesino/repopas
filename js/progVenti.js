import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getFirestore, doc, updateDoc, arrayUnion, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigHistorial } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const ventiladorRef = ref(database, 'ventilador');

const historialApp = initializeApp(firebaseConfigHistorial, "historialApp");
const dbHistorial = getFirestore(historialApp);
const historialRef = ref(getDatabase(historialApp), 'DataPas/Historial/CambioEstadoVentilador');

// Escuchar cambios en tiempo real en la base de datos principal
onValue(ventiladorRef, (snapshot) => {
  const estadoActual = snapshot.val();
  const horaCambio = new Date();
  const fechaFormateada = obtenerFechaFormateada(horaCambio);

  // Actualizar el estado del switch en la interfaz
  const switchInput = document.getElementById('ventiladoresSwitch');
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
function guardarEstadoEnHistorial(estadoVentilador, fechaFormateada) {
  const historialDocRef = doc(dbHistorial, "DataPas", "Historial");

  // Determinar el campo a actualizar (ventiladoron o ventiladoroff)
  const campo = estadoVentilador === 1 ? "ventiladoron" : "ventiladoroff";

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
document.getElementById('ventiladoresSwitch').addEventListener('change', (event) => {
  const nuevoEstado = event.target.checked ? 1 : 0;

  set(ventiladorRef, nuevoEstado)
    .then(() => console.log(`Estado de ventiladores actualizado a: ${nuevoEstado === 1 ? 'Encendido' : 'Apagado'}`))
    .catch(console.error);
});

// Función para abrir el modal y programar encendido o apagado
document.getElementById('programarEncendidoVentiladorBtn').addEventListener('click', () => {
  document.getElementById('modal-config-ventiladores').style.display = 'block';
  document.getElementById('guardarConfigVentiladoresBtn').onclick = programarEncendidoVentilador;
});

document.getElementById('programarApagadoVentiladorBtn').addEventListener('click', () => {
  document.getElementById('modal-config-ventiladores').style.display = 'block';
  document.getElementById('guardarConfigVentiladoresBtn').onclick = programarApagadoVentilador;
});

// Función para cerrar el modal
document.getElementById('closeModalVentiladoresBtn').addEventListener('click', () => {
  document.getElementById('modal-config-ventiladores').style.display = 'none';
});

// Función para programar el encendido de los ventiladores
function programarEncendidoVentilador() {
  const hora = document.getElementById('hora-ventiladores').value;

  if (!hora) {
    alert('Por favor selecciona una hora de encendido.');
    return;
  }

  const [horaSeleccionada, minutoSeleccionado] = hora.split(':');
  const ahora = new Date();
  const horaProgramada = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), horaSeleccionada, minutoSeleccionado);

  if (horaProgramada <= ahora) {
    alert('La hora seleccionada ya pasó. Por favor selecciona una hora futura.');
    return;
  }

  const tiempoRestante = horaProgramada.getTime() - ahora.getTime();
  alert(`Encendido programado para las ${hora}.`);

  setTimeout(() => {
    set(ventiladorRef, 1)
      .then(() => {
        console.log('Ventilador encendido automáticamente.');
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

  document.getElementById('modal-config-ventiladores').style.display = 'none';
}


// Función para programar el apagado de los ventiladores
function programarApagadoVentilador() {
  const hora = document.getElementById('hora-ventiladores').value;

  if (!hora) {
    alert('Por favor selecciona una hora de apagado.');
    return;
  }

  const [horaSeleccionada, minutoSeleccionado] = hora.split(':');
  const ahora = new Date();
  const horaProgramada = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), horaSeleccionada, minutoSeleccionado);

  if (horaProgramada <= ahora) {
    alert('La hora seleccionada ya pasó. Por favor selecciona una hora futura.');
    return;
  }

  const tiempoRestante = horaProgramada.getTime() - ahora.getTime();
  alert(`Apagado programado para las ${hora}.`);

  setTimeout(() => {
    set(ventiladorRef, 0)
      .then(() => {
        console.log('Ventilador apagado automáticamente.');
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

  document.getElementById('modal-config-ventiladores').style.display = 'none';
}


// Función para mostrar el historial en la página (con filtros)
function mostrarHistorial() {
  const registrosList = document.getElementById("registros");

  // Obtener los valores de los filtros
  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;
  const tipoDispositivo = document.getElementById("tipoDispositivo").value;

  // Escuchar cambios en tiempo real en el documento de historial
  const historialDocRef = doc(dbHistorial, "DataPas", "Historial");

  onSnapshot(historialDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();

      // Obtener los registros de ventilador y luces
      const ventiladorEncendido = data.ventiladoron || [];
      const ventiladorApagado = data.ventiladoroff || [];
      const lucesEncendido = data.ledon || [];
      const lucesApagado = data.ledoff || [];

      const registros = [];

      // Crear los registros de ventilador
      ventiladorEncendido.forEach((fecha) => {
        registros.push({ tipo: 'El Ventilador Se Encendió', fecha: fecha, dispositivo: 'ventilador' });
      });
      ventiladorApagado.forEach((fecha) => {
        registros.push({ tipo: 'El Ventilador Se Apagó', fecha: fecha, dispositivo: 'ventilador' });
      });

      // Crear los registros de luces
      lucesEncendido.forEach((fecha) => {
        registros.push({ tipo: 'La Luz Se Encendió', fecha: fecha, dispositivo: 'luces' });
      });
      lucesApagado.forEach((fecha) => {
        registros.push({ tipo: 'La Luz Se Apagó', fecha: fecha, dispositivo: 'luces' });
      });

      // Filtrar los registros según los filtros aplicados
      const registrosFiltrados = registros.filter(registro => {
        let fechaValida = true;

        // Filtrar por fecha
        if (fechaInicio) {
          fechaValida = new Date(registro.fecha) >= new Date(fechaInicio);
        }
        if (fechaFin) {
          fechaValida = fechaValida && new Date(registro.fecha) <= new Date(fechaFin);
        }

        // Filtrar por tipo de dispositivo
        const dispositivoValido = tipoDispositivo ? registro.dispositivo === tipoDispositivo : true;

        return fechaValida && dispositivoValido;
      });

      // Ordenar los registros por fecha (más recientes primero)
      registrosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      // Limpiar la tabla solo una vez al inicio
      registrosList.innerHTML = ''; // Limpiar la tabla

      // Agregar los registros filtrados a la tabla
      registrosFiltrados.forEach((registro) => {
        const tr = document.createElement("tr");
        const tdTipo = document.createElement("td");
        tdTipo.textContent = registro.tipo;
        const tdFecha = document.createElement("td");
        tdFecha.textContent = registro.fecha;
        tr.appendChild(tdTipo);
        tr.appendChild(tdFecha);
        registrosList.appendChild(tr);
      });
    } else {
      console.log("No se encontró el documento de historial.");
    }
  });
}

// Llamar a la función para mostrar el historial cuando el usuario haga clic en "Buscar"
document.getElementById("buscarBtn").addEventListener("click", mostrarHistorial);

// Llamar a la función para mostrar el historial al cargar la página (opcional)
window.onload = mostrarHistorial;
