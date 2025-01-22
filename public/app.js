fetch("config.json")
  .then((response) => response.json())
  .then((config) => {
    console.log("Hay respuesta");
    // Usa la API_KEY para hacer solicitudes u otras tareas
  });
