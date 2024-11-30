flatpickr("#dateRange", {
  mode: "range",
  dateFormat: "Y-m-d",
  locale: "es"
});

const modal = document.getElementById('modal-config');
const modalTitle = document.getElementById('modal-title');
const timeLabel = document.getElementById('time-label');
const configTime = document.getElementById('config-time');
const configButtons = document.querySelectorAll('.config-btn');
const closeModalBtn = document.getElementById('close-modal');
const saveTimeBtn = document.getElementById('save-time');
const notificationsContainers = {
  "luces": document.getElementById('luces-notifications'),
  "vent": document.getElementById('vent-notifications')
};

let currentConfig = "";

function openModal(event) {
  // Restablecer el valor del calendario (flatpickr)
  document.getElementById('dateRange')._flatpickr.clear();

  // Obtener la hora actual
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;

  // Establecer la hora actual como valor predeterminado en el campo de hora
  configTime.value = formattedTime; // Ajusta el valor del campo de hora

  currentConfig = event.target.dataset.config;
  if (currentConfig.includes("encender")) {
    modalTitle.textContent = "Configurar Hora de Encendido";
    timeLabel.textContent = "Hora de Encendido";
  } else {
    modalTitle.textContent = "Configurar Hora de Apagado";
    timeLabel.textContent = "Hora de Apagado";
  }

  // Deshabilitar las fechas pasadas en el flatpickr
  flatpickr("#dateRange", {
    mode: "range",
    dateFormat: "Y-m-d",
    locale: "es",
    minDate: "today" // No se puede seleccionar una fecha anterior al día de hoy
  });

  // Deshabilitar horas pasadas en el selector de hora
  configTime.setAttribute("min", formattedTime);  // No se puede seleccionar una hora anterior a la actual

  modal.style.display = 'flex';
}

// Función que maneja el clic en el botón principal
document.getElementById('mostrarhisto').addEventListener('click', function () {
  var menu = document.getElementById('registros-container');
  // Alterna la visibilidad del menú (mostrar/ocultar)
  if (menu.style.display === "none" || menu.style.display === "") {
    menu.style.display = "block";
  } else {
    menu.style.display = "none";
  }
});


function closeModal() {
  modal.style.display = 'none';
}

function saveConfiguration() {
  const selectedTime = configTime.value;
  const dateRange = document.getElementById('dateRange').value;
  const action = currentConfig.includes("encender") ? "encender" : "apagar";
  const device = currentConfig.includes("luces") ? "las luces" : "el ventilador";

  const notificationContainer = notificationsContainers[currentConfig.includes("luces") ? "luces" : "vent"];

  const newNotification = document.createElement('div');
  newNotification.classList.add('notification');
  newNotification.innerHTML = `
        <span>Has configurado ${device} para ${action} a las ${selectedTime} en los días ${dateRange}.</span>
        <button class="btn-delete" data-delete="${currentConfig}">Eliminar Configuración</button>
      `;

  notificationContainer.appendChild(newNotification);
  closeModal();
}

function deleteConfiguration(event) {
  const target = event.target.dataset.delete;
  const notificationContainer = notificationsContainers[target.includes("luces") ? "luces" : "vent"];

  const notificationToDelete = event.target.closest('.notification');
  notificationContainer.removeChild(notificationToDelete);
}

configButtons.forEach(button => button.addEventListener('click', openModal));
closeModalBtn.addEventListener('click', closeModal);
saveTimeBtn.addEventListener('click', saveConfiguration);
notificationsContainers.luces.addEventListener('click', deleteConfiguration);
notificationsContainers.vent.addEventListener('click', deleteConfiguration);
