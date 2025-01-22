fetch("config.json")
  .then((response) => response.json())
  .then((config) => {
    console.log("API_KEY:", config);
    // Usa la API_KEY para hacer solicitudes u otras tareas
  });
