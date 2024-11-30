// Importación de los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Configuración de Firebase
const firebaseConfigEstado = {
  apiKey: "AIzaSyDspx4vYlUcd6wJpn4vB1wjqR3_MgDloH4",
  authDomain: "prueba2-pas.firebaseapp.com",
  databaseURL: "https://prueba2-pas-default-rtdb.firebaseio.com",
  projectId: "prueba2-pas",
  storageBucket: "prueba2-pas.firebasestorage.app",
  messagingSenderId: "810328879396",
  appId: "1:810328879396:web:636f55ff7f1f6cbf3cc3b1",
  measurementId: "G-NX3YR6GYV4"
};

// Inicializar la aplicación Firebase
const app = initializeApp(firebaseConfigEstado);
const database = getDatabase(app);

// Referencias a las ubicaciones en la base de datos
const ledRef = ref(database, 'luces');
const ventiladorRef = ref(database, 'ventilador');

// Sincronizar el estado del LED con la base de datos en tiempo real
onValue(ledRef, (snapshot) => {
  const estadoActual = snapshot.val(); // Obtener el estado actual
  const switchInput = document.getElementById('lucesSwitch');
  const switchLabel = document.getElementById('switchLabel');

  // Actualizar el estado visual del switch y su etiqueta
  switchInput.checked = estadoActual === 1;
});

// Cambiar el estado del LED en Firebase cuando se interactúa con el switch
document.getElementById('lucesSwitch').addEventListener('change', (event) => {
  const nuevoEstado = event.target.checked ? 1 : 0;
  set(ledRef, nuevoEstado).then(() => {
  }).catch((error) => {
    console.error('Error al actualizar el estado del LED en Firebase:', error);
  });
});

// Sincronizar el estado del ventilador con la base de datos en tiempo real
onValue(ventiladorRef, (snapshot) => {
  const estadoActual = snapshot.val(); // Obtener el estado actual
  const ventiladorSwitchInput = document.getElementById('ventiladorSwitch');
  const ventiladorSwitchLabel = document.getElementById('ventiladorSwitchLabel');

  // Actualizar el estado visual del switch y su etiqueta
  ventiladorSwitchInput.checked = estadoActual === 1;
});

// Cambiar el estado del ventilador en Firebase cuando se interactúa con el switch
document.getElementById('ventiladorSwitch').addEventListener('change', (event) => {
  const nuevoEstado = event.target.checked ? 1 : 0;
  set(ventiladorRef, nuevoEstado).then(() => {
  }).catch((error) => {
    console.error('Error al actualizar el estado del ventilador en Firebase:', error);
  });
});
