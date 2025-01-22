// Configurar Stripe
const stripe = Stripe(
  "pk_test_51QDTfLCmoXV3KlChnL2Z1xeizbfoTMhiDkHhiwxxcAdpBAvVCO9d1n7Xa5e6fzGIaeEWVlH48IBgqmWhag0E52I400eS1fv70g"
);

// Ocultar el código postal en el elemento de tarjeta
const elements = stripe.elements();
const cardElement = elements.create("card", {
  style: {
    base: {
      fontSize: "16px",
      color: "#32325d",
    },
  },
  hidePostalCode: true, // Oculta el campo del código postal
});
cardElement.mount("#stripe-container");

// Botón de pago
document.getElementById("pay-button").addEventListener("click", async (e) => {
  e.preventDefault();
  const modal = new bootstrap.Modal(document.getElementById("payProcess"), {
    backdrop: "static",
    keyboard: false,
  });
  modal.show();

  var name = document.getElementById("parent_firstname").value;
  var primerApellido = document.getElementById("parent_lastname_father").value;
  var segundoApellido = document.getElementById("parent_lastname_mother").value;
  var mail = document.getElementById("parent_email").value;

  try {
    const res = await fetch(
      "https://foamy-absorbed-huckleberry.glitch.me/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${name} ${primerApellido} ${segundoApellido}`,
          email: mail,
          items: [{ concepto: "Inscripción a ciclo 2025-2026" }],
          currency: "mxn",
          amount: 2000 * 100,
          request_three_d_secure: "automatic",
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error en el servidor");
    }

    const data = await res.json();
    console.log("Pago realizado con éxito. Guardando datos...");

    // Crear el HTML del recibo

    // 1. Obtener la imagen y convertirla a base64
    const imageResponse = await fetch(
      "https://firebasestorage.googleapis.com/v0/b/escuelas-235df.appspot.com/o/IJFR%2Fjfr_logo.webp?alt=media&token=69dd35e3-4d3f-4515-84ae-44e994ae2bed"
    );
    const blob = await imageResponse.blob();
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

    const receiptContent = `
    <div class="container py-4">
      <div class="card shadow-sm mx-auto" style="max-width: 768px;">
        <div class="card-body p-4">
          <!-- Logo -->
          <div class="text-center mb-4">
            <img src="data:image/webp;base64,${base64Image}" alt="Logo" class="img-fluid" style="max-height: 80px;">
          </div>
      
          <!-- Encabezado -->
          <h2 class="text-center mb-4 fw-bold">Recibo de Pago</h2>
          <hr class="my-4">
      
          <!-- Información del pago -->
          <div class="table-responsive">
            <table class="table table-borderless">
              <tbody>
                <tr>
                  <td class="text-muted fw-medium" style="width: 40%;">
                    <strong>ID de Pago:</strong>
                  </td>
                  <td class="text-end text-break">
                    ${data.id}
                  </td>
                </tr>
                <tr>
                  <td class="text-muted fw-medium">
                    <strong>Monto:</strong>
                  </td>
                  <td class="text-end">
                    $2000.00 MXN
                  </td>
                </tr>
                <tr>
                  <td class="text-muted fw-medium">
                    <strong>Método de Pago:</strong>
                  </td>
                  <td class="text-end">
                    Tarjeta
                  </td>
                </tr>
                <tr>
                  <td class="text-muted fw-medium">
                    <strong>Concepto:</strong>
                  </td>
                  <td class="text-end text-break">
                    Inscripción al Ciclo Escolar 2025-2026
                  </td>
                </tr>
                <tr>
                  <td class="text-muted fw-medium">
                    <strong>Fecha y Hora:</strong>
                  </td>
                  <td class="text-end">
                    ${moment().format("DD/MM/YYYY, HH:mm:ss")}
                  </td>
                </tr>
                <tr>
                  <td class="text-muted fw-medium">
                    <strong>Nombre del Pagador:</strong>
                  </td>
                  <td class="text-end text-break">
                    ${name} ${primerApellido} ${segundoApellido}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      
          <!-- Nota -->
          <p class="text-center text-muted small mt-4 mb-0">
            Gracias por tu pago. Si tienes preguntas, no dudes en contactarnos.
          </p>
        </div>
      </div>
    </div>
  `;

    // Insertar el contenido en el modal
    document.getElementById("receiptContent").innerHTML = receiptContent;

    // Manejar la descarga del PDF
    document
      .getElementById("downloadReceipt")
      .addEventListener("click", async () => {
        const element = document.getElementById("receiptContent");

        // Forzar carga de imágenes antes de generar el PDF
        const images = element.querySelectorAll("img");
        await Promise.all(
          Array.from(images).map((img) => {
            return new Promise((resolve, reject) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = reject;
              }
            });
          })
        );

        // Generar el PDF con html2pdf.js
        html2pdf()
          .from(element)
          .set({
            margin: 1,
            filename: "recibo.pdf",
            html2canvas: { scale: 2 }, // Aumenta la calidad del renderizado
            jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          })
          .save();
      });

    // Enviar los datos del formulario a Firebase
    try {
      const calle = document.getElementById("address_street").value;
      const numero = document.getElementById("address_number").value;
      const colonia = document.getElementById("address_colony").value;
      const cp = document.getElementById("address_zipcode").value;
      const estado = document.getElementById("address_state").value;
      const ciudad = document.getElementById("address_city").value;
      const inePadre = document.getElementById("parent_ine_file").files[0];

      const dataPadre = {
        name: document.getElementById("parent_firstname").value,
        primerApellido: document.getElementById("parent_lastname_father").value,
        segundoApellido: document.getElementById("parent_lastname_mother")
          .value,
        rol: "Padre de familia",
        parentesco: document.getElementById("parent_relationship").value,
        email: document.getElementById("parent_email").value,
        telCasa: document.getElementById("parent_phone_home").value,
        phone: document.getElementById("parent_phone_mobile").value,
        direccion: `${calle} ${numero}, ${colonia}. ${cp}. ${estado}, ${ciudad}`,
        ocupacion: document.getElementById("parent_occupation").value,
        estadoCivil: document.getElementById("parent_marital_status").value,
        estudiantes: [],
        contacto: {
          name: document.getElementById("emergency_firstname").value,
          primerApellido: document.getElementById("emergency_lastname_father")
            .value,
          segundoApellido: document.getElementById("emergency_lastname_mother")
            .value,
          parentesco: document.getElementById("emergency_relationship").value,
          phone: document.getElementById("emergency_phone").value,
        },
        createAt: firebase.firestore.Timestamp.now(),
      };

      // Enviar los datos a Firebase
      db.collection("inscripciones")
        .add(dataPadre)
        .then((docRef) => {
          const idDoc = docRef.id;
          var name = document.getElementById("parent_firstname").value;
          var primerApellido = document.getElementById(
            "parent_lastname_father"
          ).value;
          var segundoApellido = document.getElementById(
            "parent_lastname_mother"
          ).value;
          const nameCompleto =
            name + " " + primerApellido + " " + segundoApellido;

          const fileUploads = [
            { file: inePadre, type: "ine", field: "ine" },
          ].map((upload) =>
            upload.file
              ? uploadCurpFile(
                  upload.file,
                  nameCompleto + "_" + idDoc,
                  upload.type
                ).then((downloadURL) => {
                  return db
                    .collection("inscripciones")
                    .doc(idDoc)
                    .update({ [upload.field]: downloadURL });
                })
              : Promise.resolve()
          );

          return uploadAlumno(idDoc, data.id)
            .then((idEstudiante) => {
              var name = document.getElementById("student_firstname").value;
              var primerApellido = document.getElementById(
                "student_lastname_father"
              ).value;
              var segundoApellido = document.getElementById(
                "student_lastname_mother"
              ).value;
              const nameFolder = `${name} ${primerApellido} ${segundoApellido}_${idEstudiante}`;
              const curpFileEstudiante =
                document.getElementById("academic_curp_file").files[0];
              const actaNacimientoEstudiante = document.getElementById(
                "academic_birth_certificate"
              ).files[0];
              const boletaEstudiante = document.getElementById(
                "academic_report_card"
              ).files[0];

              const studentFileUploads = [
                {
                  file: curpFileEstudiante,
                  type: "curp",
                  field: "curpFile",
                },
                {
                  file: actaNacimientoEstudiante,
                  type: "acta_nacimiento",
                  field: "actaNacimiento",
                },
                {
                  file: boletaEstudiante,
                  type: "boleta",
                  field: "boleta",
                },
              ].map((upload) =>
                upload.file
                  ? uploadCurpFile(upload.file, nameFolder, upload.type).then(
                      (downloadURL) => {
                        return db
                          .collection("inscripciones")
                          .doc(idEstudiante)
                          .update({ [upload.field]: downloadURL });
                      }
                    )
                  : Promise.resolve()
              );

              return Promise.all([
                ...fileUploads,
                ...studentFileUploads,
                db
                  .collection("inscripciones")
                  .doc(idDoc)
                  .update({
                    estudiantes: [{ idEstudiante, perfil: false }],
                  }),
              ]);
            })
            .then(() => {
              // Todo en una línea:
              const id = new URLSearchParams(window.location.search).get("id");
              if (id) {
                var docRef = db.collection("usuarios").doc(id);

                docRef
                  .get()
                  .then((doc) => {
                    if (doc.exists) {
                      var recompensa = doc.data().recompensa
                        ? doc.data().recompensa
                        : 0;
                      var totalRecompensa = recompensa + 2000;
                      docRef
                        .update({
                          recompensa: totalRecompensa,
                        })
                        .then(() => {
                          console.log("Document successfully updated!");
                          const arrToken = doc.data().tokenDevice
                            ? doc.data().tokenDevice
                            : [];
                          arrToken.forEach((token) => {
                            fetch("https://exp.host/--/api/v2/push/send", {
                              method: "POST",
                              headers: {
                                Accept: "application/json",
                                "Accept-encoding": "gzip, deflate",
                                "Content-Type": "application/json",
                              },
                              mode: "no-cors",
                              body: JSON.stringify({
                                to: token,
                                title: "¡En hora buena! 🍀",
                                body: `¡Felicidades! Un usuario al que has referido a ${
                                  doc.data().escuela
                                } se ha inscrito y has ganado $2,000 de recompensa.`,
                                data: {
                                  mensaje: `¡Felicidades! Un usuario al que has referido a ${
                                    doc.data().escuela
                                  } se ha inscrito y has ganado $2,000 de recompensa.`,
                                  url: `https://refereence.page/notification?mensaje=!¡Felicidades! Un usuario al que has referido a ${
                                    doc.data().escuela
                                  } se ha inscrito y has ganado $2,000 de recompensa.`,
                                  idUser: doc.data().userId,
                                  notificacion: "Wallet",
                                },
                                _displayInForeground: true,
                                option: "Wallet",
                              }),
                            });
                          });
                        })
                        .catch((error) => {
                          // The document probably doesn't exist.
                          console.error("Error updating document: ", error);
                        });
                    } else {
                      // doc.data() will be undefined in this case
                      console.log("No such document!");
                    }
                  })
                  .catch((error) => {
                    console.log("Error getting document:", error);
                  });
              }
              modal.hide();
              const modalSuccess = new bootstrap.Modal(
                document.getElementById("successModal"),
                {
                  backdrop: "static",
                  keyboard: false,
                }
              );
              modalSuccess.show();
            })
            .catch((error) => {
              console.error("Error in upload process: ", error);
            });
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });
      console.log("Registro y pago guardados correctamente.");
    } catch (firebaseError) {
      console.error("Error al guardar en Firebase:", firebaseError);
      alert("Ocurrió un error al guardar los datos.");
    }
  } catch (error) {
    console.error("Error:", error);
    // Aquí puedes mostrar el error al usuario
    throw error;
  }
});

function uploadCurpFile(file, usuario, carpeta) {
  // Validate inputs
  if (!file || !usuario || !carpeta) {
    console.error("Faltan parámetros para la subida del archivo");
    return Promise.reject("Parámetros inválidos");
  }

  const storage = firebase.storage();
  const storageRef = storage.ref();
  const uploadPath = `inscripciones/${usuario}/${carpeta}/${file.name}`;
  const uploadTask = storageRef.child(uploadPath).put(file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      null,
      (error) => {
        console.error("Error al subir archivo", error);
        reject(error);
      },
      () => {
        uploadTask.snapshot.ref
          .getDownloadURL()
          .then((downloadURL) => resolve(downloadURL))
          .catch((error) => {
            console.error("Error obteniendo URL de descarga", error);
            reject(error);
          });
      }
    );
  });
}

async function uploadAlumno(idPadre, idPago) {
  try {
    const dia = document.getElementById("birth_day").value;
    const mes = document.getElementById("birth_month").value;
    const año = document.getElementById("birth_year").value;
    const fechaNacimiento = `${año}-${mes}-${dia}`;
    const timestamp = moment(fechaNacimiento, "YYYY-MM-DD").valueOf();

    const docRef = await db.collection("inscripciones").add({
      idPadre,
      name: document.getElementById("student_firstname").value,
      primerApellido: document.getElementById("student_lastname_father").value,
      segundoApellido: document.getElementById("student_lastname_mother").value,
      genero: document.getElementById("student_lastname_mother").value,
      tipoSangre: document.getElementById("student_blood_type").value,
      fechaNacimiento: firebase.firestore.Timestamp.fromMillis(timestamp),
      enfermedad: document.getElementById("student_illness_details").value,
      religion: document.getElementById("student_religion").value,
      observaciones: document.getElementById("student_observations").value,
      nivelEscolar: document.getElementById("academic_level").value,
      grado: document.getElementById("academic_grade").value,
      cicloEscolar: document.getElementById("ciclo").value,
      escuelaProveniente: document.getElementById("academic_previous_school")
        .value,
      curp: document.getElementById("academic_curp").value,
      createAt: new Date(),
      referenciaPago: idPago,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error añadiendo documento: ", error);
    throw error;
  }
}

let currentPage = 0;
const pages = document.querySelectorAll(".form-page");
const steps = document.querySelectorAll(".step");
const lines = document.querySelectorAll(".line"); // Seleccionar las líneas entre pasos
const nextButtons = document.querySelectorAll(".next");
const prevButtons = document.querySelectorAll(".prev");

function showPage(index) {
  pages.forEach((page, i) => page.classList.toggle("active", i === index));
  steps.forEach((step, i) => {
    step.classList.toggle("active", i <= index);
  });
  updateLines(index);
}

function updateLines(index) {
  lines.forEach((line, i) => {
    if (i < index) {
      line.classList.add("active"); // Activar línea si está antes de la página actual
    } else {
      line.classList.remove("active"); // Desactivar línea si está después
    }
  });
}

function validatePage(index) {
  const inputs = pages[index].querySelectorAll("input, select, textarea");
  let isValid = true;

  inputs.forEach((input) => {
    if (input.required && !input.value.trim()) {
      isValid = false;
      input.style.borderColor = "#A60311";
      input.classList.add("error");
    } else if (input.type === "email" && input.value.trim()) {
      // Validar correo electrónico
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value.trim())) {
        isValid = false;
        input.style.borderColor = "red";
        input.classList.add("error");
      } else {
        input.style.borderColor = "#ccc";
        input.classList.remove("error");
      }
    } else {
      input.style.borderColor = "#ccc";
      input.classList.remove("error");
    }
  });

  if (!isValid) {
    alert("Por favor, completa todos los campos correctamente.");
  }

  return isValid;
}

document.getElementById("reloadPage").addEventListener("click", async (e) => {
  e.preventDefault();
  location.reload(); // Recarga la página actual
});

nextButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // Evitar que la acción del botón sea interrumpida
    if (validatePage(currentPage)) {
      currentPage++;
      if (currentPage < pages.length) {
        showPage(currentPage);
        // Desplazar al inicio de la página
        const container = document.querySelector(".form-container");
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  });
});

prevButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault(); // Evitar que la acción del botón sea interrumpida
    if (currentPage > 0) {
      currentPage--;
      showPage(currentPage);
      // Desplazar al inicio de la página
      const container = document.querySelector(".form-container");
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});

// Inicializar la primera página y el progreso
showPage(currentPage);

document.addEventListener("DOMContentLoaded", () => {
  const estadosYCiudades = {
    Aguascalientes: [
      "Aguascalientes",
      "Asientos",
      "Calvillo",
      "Cosío",
      "Jesús María",
      "Pabellón de Arteaga",
      "Rincón de Romos",
      "San José de Gracia",
      "Tepezalá",
      "El Llano",
      "San Francisco de los Romo",
    ],
    " Baja California": [
      "Ensenada",
      "Mexicali",
      "Tecate",
      "Tijuana",
      "Playas de Rosarito",
      "San Quintín",
      "San Felipe",
    ],
    "Baja California Sur": [
      "Comondú",
      "La Paz",
      "Loreto",
      "Los Cabos",
      "Mulegé",
    ],
    Campeche: [
      "Calkiní",
      "Campeche",
      "Carmen",
      "Champotón",
      "Hecelchakán",
      "Hopelchén",
      "Palizada",
      "Tenabo",
      "Escárcega",
      "Calakmul",
      "Candelaria",
      "Seybaplaya",
    ],
    Chiapas: [
      "Acacoyagua",
      "Acala",
      "Acapetahua",
      "Altamirano",
      "Amatán",
      "Amatenango de la Frontera",
      "Amatenango del Valle",
      "Ángel Albino Corzo",
      "Arriaga",
      "Bejucal de Ocampo",
      "Bella Vista",
      "Berriozábal",
      "Bochil",
      "El Bosque",
      "Cacahoatán",
      "Catazajá",
      "Cintalapa",
      "Coapilla",
      "Comitán de Domínguez",
      "La Concordia",
      "Copainalá",
      "Chalchihuitán",
      "Chamula",
      "Chanal",
      "Chapultenango",
      "Chenalhó",
      "Chiapa de Corzo",
      "Chiapilla",
      "Chicoasén",
      "Chicomuselo",
      "Chilón",
      "Escuintla",
      "Francisco León",
      "Frontera Comalapa",
      "Frontera Hidalgo",
      "La Grandeza",
      "Huehuetán",
      "Huixtán",
      "Huitiupán",
      "Huixtla",
      "La Independencia",
      "Ixhuatán",
      "Ixtacomitán",
      "Ixtapa",
      "Ixtapangajoya",
      "Jiquipilas",
      "Jitotol",
      "Juárez",
      "Larráinzar",
      "La Libertad",
      "Mapastepec",
      "Las Margaritas",
      "Mazapa de Madero",
      "Mazatán",
      "Metapa",
      "Mitontic",
      "Motozintla",
      "Nicolás Ruíz",
      "Ocosingo",
      "Ocotepec",
      "Ocozocoautla de Espinosa",
      "Ostuacán",
      "Osumacinta",
      "Oxchuc",
      "Palenque",
      "Pantelhó",
      "Pantepec",
      "Pichucalco",
      "Pijijiapan",
      "El Porvenir",
      "Villa Comaltitlán",
      "Pueblo Nuevo Solistahuacán",
      "Rayón",
      "Reforma",
      "Las Rosas",
      "Sabanilla",
      "Salto de Agua",
      "San Cristóbal de las Casas",
      "San Fernando",
      "Siltepec",
      "Simojovel",
      "Sitalá",
      "Socoltenango",
      "Solosuchiapa",
      "Soyaló",
      "Suchiapa",
      "Suchiate",
      "Sunuapa",
      "Tapachula",
      "Tapalapa",
      "Tapilula",
      "Tecpatán",
      "Tenejapa",
      "Teopisca",
      "Tila",
      "Tonalá",
      "Totolapa",
      "La Trinitaria",
      "Tumbalá",
      "Tuxtla Gutiérrez",
      "Tuxtla Chico",
      "Tuzantán",
      "Tzimol",
      "Unión Juárez",
      "Venustiano Carranza",
      "Villa Corzo",
      "Villaflores",
      "Yajalón",
      "San Lucas",
      "Zinacantán",
      "San Juan Cancuc",
      "Aldama",
      "Benemérito de las Américas",
      "Maravilla Tenejapa",
      "Marqués de Comillas",
      "Montecristo de Guerrero",
      "San Andrés Duraznal",
      "Santiago el Pinar",
      "Capitán Luis Ángel Vidal",
      "Rincón Chamula San Pedro",
      "El Parral",
      "Emiliano Zapata",
      "Mezcalapa",
      "Honduras de la Sierra",
    ],
    Chihuahua: [
      "Ahumada",
      "Aldama",
      "Allende",
      "Aquiles Serdán",
      "Ascensión",
      "Bachíniva",
      "Balleza",
      "Batopilas de Manuel Gómez Morín",
      "Bocoyna",
      "Buenaventura",
      "Camargo",
      "Carichí",
      "Casas Grandes",
      "Coronado",
      "Coyame del Sotol",
      "La Cruz",
      "Cuauhtémoc",
      "Cusihuiriachi",
      "Chihuahua",
      "Chínipas",
      "Delicias",
      "Dr. Belisario Domínguez",
      "Galeana",
      "Santa Isabel",
      "Gómez Farías",
      "Gran Morelos",
      "Guachochi",
      "Guadalupe",
      "Guadalupe y Calvo",
      "Guazapares",
      "Guerrero",
      "Hidalgo del Parral",
      "Huejotitán",
      "Ignacio Zaragoza",
      "Janos",
      "Jiménez",
      "Juárez",
      "Julimes",
      "López",
      "Madera",
      "Maguarichi",
      "Manuel Benavides",
      "Matachí",
      "Matamoros",
      "Meoqui",
      "Morelos",
      "Moris",
      "Namiquipa",
      "Nonoava",
      "Nuevo Casas Grandes",
      "Ocampo",
      "Ojinaga",
      "Praxedis G. Guerrero",
      "Riva Palacio",
      "Rosales",
      "Rosario",
      "San Francisco de Borja",
      "San Francisco de Conchos",
      "San Francisco del Oro",
      "Santa Bárbara",
      "Satevó",
      "Saucillo",
      "Temósachic",
      "El Tule",
      "Urique",
      "Uruachi",
      "Valle de Zaragoza",
    ],
    Coahuila: [
      "Abasolo",
      "Acuña",
      "Allende",
      "Arteaga",
      "Candela",
      "Castaños",
      "Cuatro Ciénegas",
      "Escobedo",
      "Francisco I. Madero",
      "Frontera",
      "General Cepeda",
      "Guerrero",
      "Hidalgo",
      "Jiménez",
      "Juárez",
      "Lamadrid",
      "Matamoros",
      "Monclova",
      "Morelos",
      "Múzquiz",
      "Nadadores",
      "Nava",
      "Ocampo",
      "Parras",
      "Piedras Negras",
      "Progreso",
      "Ramos Arizpe",
      "Sabinas",
      "Sacramento",
      "Saltillo",
      "San Buenaventura",
      "San Juan de Sabinas",
      "San Pedro",
      "Sierra Mojada",
      "Torreón",
      "Viesca",
      "Villa Unión",
      "Zaragoza",
    ],
    Colima: [
      "Armería",
      "Colima",
      "Comala",
      "Coquimatlán",
      "Cuauhtémoc",
      "Ixtlahuacán",
      "Manzanillo",
      "Minatitlán",
      "Tecomán",
      "Villa de Álvarez",
    ],
    Durango: [
      "Canatlán",
      "Canelas",
      "Coneto de Comonfort",
      "Cuencamé",
      "Durango",
      "General Simón Bolívar",
      "Gómez Palacio",
      "Guadalupe Victoria",
      "Guanaceví",
      "Hidalgo",
      "Indé",
      "Lerdo",
      "Mapimí",
      "Mezquital",
      "Nazas",
      "Nombre de Dios",
      "Ocampo",
      "El Oro",
      "Otáez",
      "Pánuco de Coronado",
      "Peñón Blanco",
      "Poanas",
      "Pueblo Nuevo",
      "Rodeo",
      "San Bernardo",
      "San Dimas",
      "San Juan de Guadalupe",
      "San Juan del Río",
      "San Luis del Cordero",
      "San Pedro del Gallo",
      "Santa Clara",
      "Santiago Papasquiaro",
      "Súchil",
      "Tamazula",
      "Tepehuanes",
      "Tlahualilo",
      "Topia",
      "Vicente Guerrero",
      "Nuevo Ideal",
    ],
    "Estado de México": [
      "Acambay de Ruíz Castañeda",
      "Acolman",
      "Aculco",
      "Almoloya de Alquisiras",
      "Almoloya de Juárez",
      "Almoloya del Río",
      "Amanalco",
      "Amatepec",
      "Amecameca",
      "Apaxco",
      "Atenco",
      "Atizapán",
      "Atizapán de Zaragoza",
      "Atlacomulco",
      "Atlautla",
      "Axapusco",
      "Ayapango",
      "Calimaya",
      "Capulhuac",
      "Coacalco de Berriozábal",
      "Coatepec Harinas",
      "Cocotitlán",
      "Coyotepec",
      "Cuautitlán",
      "Chalco",
      "Chapa de Mota",
      "Chapultepec",
      "Chiautla",
      "Chicoloapan",
      "Chiconcuac",
      "Chimalhuacán",
      "Donato Guerra",
      "Ecatepec de Morelos",
      "Ecatzingo",
      "Huehuetoca",
      "Hueypoxtla",
      "Huixquilucan",
      "Isidro Fabela",
      "Ixtapaluca",
      "Ixtapan de la Sal",
      "Ixtapan del Oro",
      "Ixtlahuaca",
      "Xalatlaco",
      "Jaltenco",
      "Jilotepec",
      "Jilotzingo",
      "Jiquipilco",
      "Jocotitlán",
      "Joquicingo",
      "Juchitepec",
      "Lerma",
      "Malinalco",
      "Melchor Ocampo",
      "Metepec",
      "Mexicaltzingo",
      "Morelos",
      "Naucalpan de Juárez",
      "Nezahualcóyotl",
      "Nextlalpan",
      "Nicolás Romero",
      "Nopaltepec",
      "Ocoyoacac",
      "Ocuilan",
      "El Oro",
      "Otumba",
      "Otzoloapan",
      "Otzolotepec",
      "Ozumba",
      "Papalotla",
      "La Paz",
      "Polotitlán",
      "Rayón",
      "San Antonio la Isla",
      "San Felipe del Progreso",
      "San Martín de las Pirámides",
      "San Mateo Atenco",
      "San Simón de Guerrero",
      "Santo Tomás",
      "Soyaniquilpan de Juárez",
      "Sultepec",
      "Tecámac",
      "Tejupilco",
      "Temamatla",
      "Temascalapa",
      "Temascalcingo",
      "Temascaltepec",
      "Temoaya",
      "Tenancingo",
      "Tenango del Aire",
      "Tenango del Valle",
      "Teoloyucan",
      "Teotihuacán",
      "Tepetlaoxtoc",
      "Tepetlixpa",
      "Tepotzotlán",
      "Tequixquiac",
      "Texcaltitlán",
      "Texcalyacac",
      "Texcoco",
      "Tezoyuca",
      "Tianguistenco",
      "Timilpan",
      "Tlalmanalco",
      "Tlalnepantla de Baz",
      "Tlatlaya",
      "Toluca",
      "Tonatico",
      "Tultepec",
      "Tultitlán",
      "Valle de Bravo",
      "Villa de Allende",
      "Villa del Carbón",
      "Villa Guerrero",
      "Villa Victoria",
      "Xonacatlán",
      "Zacazonapan",
      "Zacualpan",
      "Zinacantepec",
      "Zumpahuacán",
      "Zumpango",
      "Cuautitlán Izcalli",
      "Valle de Chalco Solidaridad",
      "Luvianos",
      "San José del Rincón",
      "Tonanitla",
    ],
    Guanajuato: [
      "Abasolo",
      "Acámbaro",
      "San Miguel de Allende",
      "Apaseo el Alto",
      "Apaseo el Grande",
      "Atarjea",
      "Celaya",
      "Manuel Doblado",
      "Comonfort",
      "Coroneo",
      "Cortazar",
      "Cuerámaro",
      "Doctor Mora",
      "Dolores Hidalgo Cuna de la Independencia Nacional",
      "Guanajuato",
      "Huanímaro",
      "Irapuato",
      "Jaral del Progreso",
      "Jerécuaro",
      "León",
      "Moroleón",
      "Ocampo",
      "Pénjamo",
      "Pueblo Nuevo",
      "Purísima del Rincón",
      "Romita",
      "Salamanca",
      "Salvatierra",
      "San Diego de la Unión",
      "San Felipe",
      "San Francisco del Rincón",
      "San José Iturbide",
      "San Luis de la Paz",
      "Santa Catarina",
      "Santa Cruz de Juventino Rosas",
      "Santiago Maravatío",
      "Silao de la Victoria",
      "Tarandacuao",
      "Tarimoro",
      "Tierra Blanca",
      "Uriangato",
      "Valle de Santiago",
      "Victoria",
      "Villagrán",
      "Xichú",
      "Yuriria",
    ],
    Guerrero: [
      "Acapulco de Juárez",
      "Ahuacuotzingo",
      "Ajuchitlán del Progreso",
      "Alcozauca de Guerrero",
      "Alpoyeca",
      "Apaxtla",
      "Arcelia",
      "Atenango del Río",
      "Atlamajalcingo del Monte",
      "Atlixtac",
      "Atoyac de Álvarez",
      "Ayutla de los Libres",
      "Azoyú",
      "Benito Juárez",
      "Buenavista de Cuéllar",
      "Coahuayutla de José María Izazaga",
      "Cocula",
      "Copala",
      "Copalillo",
      "Copanatoyac",
      "Coyuca de Benítez",
      "Coyuca de Catalán",
      "Cuajinicuilapa",
      "Cualác",
      "Cuautepec",
      "Cuetzala del Progreso",
      "Cutzamala de Pinzón",
      "Chilapa de Álvarez",
      "Chilpancingo de los Bravo",
      "Florencio Villarreal",
      "General Canuto A. Neri",
      "General Heliodoro Castillo",
      "Huamuxtitlán",
      "Huitzuco de los Figueroa",
      "Iguala de la Independencia",
      "Igualapa",
      "Ixcateopan de Cuauhtémoc",
      "Zihuatanejo de Azueta",
      "Juan R. Escudero",
      "Leonardo Bravo",
      "Malinaltepec",
      "Mártir de Cuilapan",
      "Metlatónoc",
      "Mochitlán",
      "Olinalá",
      "Ometepec",
      " Pedro Ascencio Alquisiras",
      "Petatlán",
      "Pilcaya",
      "Pungarabato",
      "Quechultenango",
      "San Luis Acatlán",
      "San Marcos",
      "San Miguel Totolapan",
      "Taxco de Alarcón",
      "Tecoanapa",
      "Técpan de Galeana",
      "Teloloapan",
      "Tepecoacuilco de Trujano",
      "Tetipac",
      "Tixtla de Guerrero",
      "Tlacoachistlahuaca",
      "Tlacoapa",
      "Tlalchapa",
      "Tlalixtaquilla de Maldonado",
      "Tlapa de Comonfort",
      "Tlapehuala",
      "La Unión de Isidoro Montes de Oca",
      "Xalpatláhuac",
      "Xochihuehuetlán",
      "Xochistlahuaca",
      "Zapotitlán Tablas",
      "Zirándaro",
      "Zitlala",
      "Eduardo Neri",
      "Acatepec",
      "Marquelia",
      "Cochoapa el Grande",
      "José Joaquín de Herrera",
      "Juchitán",
      "Iliatenco",
    ],
    Hidalgo: [
      "Acatlán",
      "Acaxochitlán",
      "Actopan",
      "Agua Blanca de Iturbide",
      "Ajacuba",
      "Alfajayucan",
      "Almoloya",
      "Apan",
      "El Arenal",
      "Atitalaquia",
      "Atlapexco",
      "Atotonilco el Grande",
      "Atotonilco de Tula",
      "Calnali",
      "Cardonal",
      "Cuautepec de Hinojosa",
      "Chapantongo",
      "Chapulhuacán",
      "Chilcuautla",
      "Eloxochitlán",
      "Emiliano Zapata",
      "Epazoyucan",
      "Francisco I. Madero",
      "Huasca de Ocampo",
      "Huautla",
      "Huazalingo",
      "Huehuetla",
      "Huejutla de Reyes",
      "Huichapan",
      "Ixmiquilpan",
      "Jacala de Ledezma",
      "Jaltocán",
      "Juárez Hidalgo",
      "Lolotla",
      "Metepec",
      "San Agustín Metzquititlán",
      "Metztitlán",
      "Mineral del Chico",
      "Mineral del Monte",
      "La Misión",
      "Mixquiahuala de Juárez",
      "Molango de Escamilla",
      "Nicolás Flores",
      "Nopala de Villagrán",
      "Omitlán de Juárez",
      "San Felipe Orizatlán",
      "Pacula",
      "Pachuca de Soto",
      "Pisaflores",
      "Progreso de Obregón",
      "Mineral de la Reforma ",
      "San Agustín Tlaxiaca",
      "San Bartolo Tutotepec",
      "San Salvador ",
      "Santiago de Anaya",
      "Santiago Tulantepec de Lugo Guerrero",
      "Singuilucan",
      "Tasquillo",
      "Tecozautla",
      "Tenango de Doria ",
      "Tepeapulco",
      "Tepehuacán de Guerrero",
      "Tepeji del Río de Ocampo",
      "Tepetitlán",
      "Tetepango",
      "Villa de Tezontepec",
      "Tezontepec de Aldama",
      "Tianguistengo",
      "Tizayuca",
      "Tlahuelilpan",
      "Tlahuiltepa",
      "Tlanalapa",
      "Tlanchinol",
      "Tlaxcoapan",
      "Tolcayuca",
      "Tula de Allende",
      "Tulancingo de Bravo",
      "Xochiatipan",
      "Xochicoatlán ",
      "Yahualica",
      "Zacualtipán de Ángeles",
      "Zapotlán de Juárez",
      "Zempoala",
      "Zimapán",
    ],
    Jalisco: [
      "Zimapán",
      "Acatlán de Juárez",
      "Ahualulco de Mercado",
      "Amacueca",
      "Amatitán",
      "Ameca",
      "San Juanito de Escobedo",
      "Arandas",
      "El Arenal",
      "Atemajac de Brizuela",
      "Atengo",
      "Atenguillo",
      "Atotonilco el Alto",
      "Atoyac",
      "Autlán de Navarro",
      "Ayotlán",
      "Ayutla",
      "La Barca",
      "Bolaños",
      "Cabo Corrientes",
      "Casimiro Castillo",
      "Cihuatlán",
      "Zapotlán el Grande",
      "Cocula",
      "Colotlán",
      "Concepción de Buenos Aires",
      "Cuautitlán de García Barragán",
      "Cuautla",
      "Cuquío",
      "Chapala",
      "Chimaltitán",
      "Chiquilistlán",
      "Degollado",
      "Ejutla",
      "Encarnación de Díaz",
      "Etzatlán",
      "El Grullo",
      "Guachinango",
      "Guadalajara",
      "Hostotipaquillo",
      "Huejúcar",
      "Huejuquilla el Alto",
      "La Huerta",
      "Ixtlahuacán de los Membrillos",
      "Ixtlahuacán del Río",
      "Jalostotitlán",
      "Jamay",
      "Jesús María",
      "Jilotlán de los Dolores",
      "Jocotepec",
      "Juanacatlán",
      "Juchitlán",
      "Lagos de Moreno",
      "El Limón",
      "Magdalena",
      "Santa María del Oro",
      "La Manzanilla de la Paz",
      "Mascota",
      "Mazamitla",
      "Mexticacán",
      "Mezquitic",
      "Mixtlán",
      "Ocotlán",
      "Ojuelos de Jalisco",
      "Pihuamo",
      "Poncitlán",
      "Puerto Vallarta",
      "Villa Purificación",
      "Quitupan",
      "El Salto",
      "San Cristóbal de la Barranca",
      "San Diego de Alejandría",
      "San Juan de los Lagos",
      "San Julián",
      "San Marcos",
      "San Martín de Bolaños",
      "San Martín Hidalgo",
      "San Miguel el Alto",
      "Gómez Farías",
      "San Sebastián del Oeste",
      "Santa María de los Ángeles",
      "Sayula",
      "Tala",
      "Talpa de Allende",
      "Tamazula de Gordiano",
      "Tapalpa",
      "Tecalitlán",
      "Techaluta de Montenegro",
      "Tecolotlán",
      "Tenamaxtlán",
      "Teocaltiche",
      "Teocuitatlán de Corona",
      "Tepatitlán de Morelos",
      "Tequila",
      "Teuchitlán",
      "Tizapán el Alto",
      "Tlajomulco de Zúñiga",
      "San Pedro Tlaquepaque",
      "Tolimán",
      "Tomatlán",
      "Tonalá",
      "Tonaya",
      "Tonila",
      "Totatiche",
      "Tototlán",
      "Tuxcacuesco",
      "Tuxcueca",
      "Tuxpan",
      "Unión de San Antonio",
      "Unión de Tula",
      "Valle de Guadalupe",
      "Valle de Juárez",
      "San Gabriel",
      "Villa Corona",
      "Villa Guerrero",
      "Villa Hidalgo",
      "Cañadas de Obregón",
      "Yahualica de González Gallo",
      "Zacoalco de Torres",
      "Zapopan",
      "Zapotiltic",
      "Zapotitlán de Vadillo",
      "Zapotlán del Rey",
      "Zapotlanejo",
      "San Ignacio Cerro Gordo",
    ],
    "Michoacán de Ocampo": [
      "Acuitzio",
      "Aguililla",
      "Álvaro Obregón",
      "Angamacutiro",
      "Angangueo",
      "Apatzingán",
      "Aporo",
      "Aquila",
      "Ario",
      "Arteaga",
      "Briseñas",
      "Buenavista",
      "Carácuaro",
      "Coahuayana",
      "Coalcomán de Vázquez Pallares",
      "Coeneo",
      "Contepec",
      "Copándaro",
      "Cotija ",
      "Cuitzeo",
      "Charapan",
      "Charo",
      "Chavinda",
      "Cherán",
      "Chilchota",
      "Chinicuila",
      "Chucándiro",
      "Churintzio",
      "Churumuco",
      "Ecuandureo",
      "Epitacio Huerta",
      "Erongarícuaro",
      "Gabriel Zamora",
      "Hidalgo",
      "La Huacana",
      "Huandacareo",
      "Huaniqueo",
      "Huetamo",
      "Huiramba",
      "Indaparapeo",
      "Irimbo",
      "Ixtlán",
      "Jacona",
      "Jiménez",
      "Jiquilpan",
      "Juárez",
      "Jungapeo",
      "Lagunillas",
      "Madero",
      "Maravatío",
      "Marcos Castellanos",
      "Lázaro Cárdenas",
      "Morelia",
      "Morelos",
      "Múgica",
      "Nahuatzen",
      "Nocupétaro",
      "Nuevo Parangaricutiro",
      "Nuevo Urecho",
      "Numarán",
      "Ocampo",
      "Pajacuarán",
      "Panindícuaro",
      "Parácuaro",
      "Paracho",
      "Pátzcuaro",
      "Penjamillo",
      "Peribán",
      "La Piedad",
      "Purépero",
      "Puruándiro",
      "Queréndaro",
      "Quiroga",
      "Cojumatlán de Régules",
      "Los Reyes",
      "Sahuayo",
      "San Lucas",
      "Santa Ana Maya",
      "Salvador Escalante",
      "Senguio",
      "Susupuato",
      "Tacámbaro",
      "Tancítaro",
      "Tangamandapio",
      "Tangancícuaro",
      "Tanhuato",
      "Taretan",
      "Tarímbaro",
      "Tepalcatepec",
      "Tingambato",
      "Tingüindín",
      "Tiquicheo de Nicolás Romero",
      "Tlalpujahua",
      "Tlazazalca",
      "Tocumbo",
      "Tumbiscatío",
      "Turicato",
      "Tuxpan",
      "Tuzantla",
      "Tzintzuntzan",
      "Tzitzio",
      "Uruapan",
      "Venustiano Carranza",
      "Villamar",
      "Vista Hermosa",
      "Yurécuaro",
      "Zacapu",
      "Zamora",
      "Zináparo",
      "Zinapécuaro",
      "Ziracuaretiro",
      "Zitácuaro",
      "José Sixto Verduzco",
    ],
    Morelos: [
      "Amacuzac",
      "Atlatlahucan",
      "Axochiapan",
      "Ayala",
      "Coatlán del Río ",
      "Cuautla",
      "Cuernavaca",
      "Emiliano Zapata",
      "Huitzilac",
      "Jantetelco",
      "Jiutepec",
      "Jojutla",
      "Jonacatepec de Leandro Valle",
      "Mazatepec",
      "Miacatlán",
      "Ocuituco",
      "Puente de Ixtla",
      "Temixco",
      "Tepalcingo",
      "Tepoztlán",
      "Tetecala",
      "Tetela del Volcán",
      "Tlalnepantla",
      "Tlaltizapán de Zapata",
      "Tlaquiltenango",
      "Tlayacapan",
      "Totolapan",
      "Xochitepec",
      "Yautepec",
      "Yecapixtla",
      "Zacatepec",
      "Zacualpan de Amilpas",
      "Temoac",
      "Coatetelco",
      "Xoxocotla",
      "Hueyapan",
    ],
    Nayarit: [
      "Acaponeta",
      "Ahuacatlán",
      "Amatlán de Cañas",
      "Compostela",
      "Huajicori",
      "Ixtlán del Río",
      "Jala",
      "Xalisco",
      "Del Nayar",
      "Rosamorada",
      "Ruíz",
      "San Blas",
      "San Pedro Lagunillas",
      "Santa María del Oro",
      "Santiago Ixcuintla",
      "Tecuala",
      "Tepic",
      "Tuxpan",
      "La Yesca",
      "Bahía de Banderas",
    ],
    "Nuevo León": [
      "Abasolo",
      "Agualeguas",
      "Los Aldamas",
      "Allende",
      "Anáhuac",
      "Apodaca",
      "Aramberri",
      "Bustamante",
      "Cadereyta Jiménez",
      "El Carmen",
      "Cerralvo",
      "Ciénega de Flores",
      "China",
      "Doctor Arroyo",
      "Doctor Coss",
      "Doctor González",
      "Galeana",
      "García",
      "San Pedro Garza García",
      "General Bravo",
      "General Escobedo",
      "General Terán",
      "General Treviño",
      "General Zaragoza",
      "General Zuazua",
      "Guadalupe",
      "Los Herreras",
      "Higueras",
      "Hualahuises",
      "Iturbide",
      "Juárez",
      "Lampazos de Naranjo",
      "Linares",
      "Marín",
      "Melchor Ocampo",
      "Mier y Noriega",
      "Mina",
      "Montemorelos",
      "Monterrey",
      "Parás",
      "Pesquería",
      "Los Ramones",
      "Rayones",
      "Sabinas Hidalgo",
      "Salinas Victoria",
      "San Nicolás de los Garza",
      "Hidalgo",
      "Santa Catarina",
      "Santiago",
      "Vallecillo ",
      "Villaldama",
    ],
    Oaxaca: [
      "Abejones",
      "Acatlán de Pérez Figueroa",
      "Asunción Cacalotepec",
      "Asunción Cuyotepeji",
      "Asunción Ixtaltepec",
      "Asunción Nochixtlán",
      "Asunción Ocotlán",
      "Asunción Tlacolulita",
      "Ayotzintepec",
      "El Barrio de la Soledad",
      "Calihualá",
      "Candelaria Loxicha",
      "Ciénega de Zimatlán",
      "Ciudad Ixtepec",
      "Coatecas Altas",
      "Coicoyán de las Flores",
      "La Compañía",
      "Concepción Buenavista",
      "Concepción Pápalo",
      "Constancia del Rosario",
      "Cosolapa",
      "Cosoltepec",
      "Cuilápam de Guerrero",
      "Cuyamecalco Villa de Zaragoza",
      "Chahuites",
      "Chalcatongo de Hidalgo",
      "Chiquihuitlán de Benito Juárez",
      "Heroica Ciudad de Ejutla de Crespo",
      "Eloxochitlán de Flores Magón",
      "El Espinal",
      "Tamazulápam del Espíritu Santo",
      "Fresnillo de Trujano",
      "Guadalupe Etla",
      "Guadalupe de Ramírez",
      "Guelatao de Juárez",
      "Guevea de Humboldt",
      "Mesones Hidalgo",
      "Villa Hidalgo",
      "Heroica Ciudad de Huajuapan de León",
      "Huautepec",
      "Huautla de Jiménez",
      "Ixtlán de Juárez",
      "Juchitán de Zaragoza",
      "Loma Bonita",
      "Magdalena Apasco",
      "Magdalena Jaltepec",
      "Santa Magdalena Jicotlán",
      "Magdalena Mixtepec",
      "Magdalena Ocotlán",
      "Magdalena Peñasco",
      "Magdalena Teitipac",
      "Magdalena Tequisistlán",
      "Magdalena Tlacotepec",
      "Magdalena Zahuatlán",
      "Mariscala de Juárez",
      "Mártires de Tacubaya",
      "Matías Romero Avendaño",
      "Mazatlán Villa de Flores",
      "Miahuatlán de Porfirio Díaz",
      "Mixistlán de la Reforma",
      "Monjas",
      "Natividad",
      "Nazareno Etla",
      "Nejapa de Madero",
      "Ixpantepec Nieves",
      "Santiago Niltepec",
      "Oaxaca de Juárez",
      "Ocotlán de Morelos",
      "La Pe",
      "Pinotepa de Don Luis",
      "Pluma Hidalgo",
      "San José del Progreso",
      "Putla Villa de Guerrero",
      "Santa Catarina Quioquitani",
      "Reforma de Pineda",
      "La Reforma",
      "Reyes Etla",
      "Rojas de Cuauhtémoc",
      "Salina Cruz",
      "San Agustín Amatengo",
      "San Agustín Atenango",
      "San Agustín Chayuco",
      "San Agustín de las Juntas",
      "San Agustín Etla",
      "San Agustín Loxicha",
      "San Agustín Tlacotepec",
      "San Agustín Yatareni",
      "San Andrés Cabecera Nueva",
      "San Andrés Dinicuiti",
      "San Andrés Huaxpaltepec",
      "San Andrés Huayápam",
      "San Andrés Ixtlahuaca",
      "San Andrés Lagunas",
      "San Andrés Nuxiño",
      "San Andrés Paxtlán",
      "San Andrés Sinaxtla",
      "San Andrés Solaga",
      "San Andrés Teotilálpam",
      "San Andrés Tepetlapa",
      "San Andrés Yaá",
      "San Andrés Zabache",
      "San Andrés Zautla",
      "San Antonino Castillo Velasco",
      "San Antonino el Alto",
      "San Antonino Monte Verde",
      "San Antonio Acutla",
      "San Antonio de la Cal",
      "San Antonio Huitepec",
      "San Antonio Nanahuatípam",
      "San Antonio Sinicahua",
      "San Antonio Tepetlapa",
      "San Baltazar Chichicápam",
      "San Baltazar Loxicha",
      "San Baltazar Yatzachi el Bajo",
      "San Bartolo Coyotepec",
      "San Bartolomé Ayautla",
      "San Bartolomé Loxicha",
      "San Bartolomé Quialana",
      "San Bartolomé Yucuañe",
      "San Bartolomé Zoogocho",
      "San Bartolo Soyaltepec",
      "San Bartolo Yautepec",
      "San Bernardo Mixtepec",
      "San Blas Atempa",
      "San Carlos Yautepec",
      "San Cristóbal Amatlán",
      "San Cristóbal Amoltepec",
      "San Cristóbal Lachirioag",
      "San Cristóbal Suchixtlahuaca",
      "San Dionisio del Mar",
      "San Dionisio Ocotepec",
      "San Dionisio Ocotlán",
      "San Esteban Atatlahuca",
      "San Felipe Jalapa de Díaz",
      "San Felipe Tejalápam",
      "San Felipe Usila",
      "San Francisco Cahuacuá",
      "San Francisco Cajonos",
      "San Francisco Chapulapa",
      "San Francisco Chindúa",
      "San Francisco del Mar",
      "San Francisco Huehuetlán",
      "San Francisco Ixhuatán",
      "San Francisco Jaltepetongo",
      "San Francisco Lachigoló",
      "San Francisco Logueche",
      "San Francisco Nuxaño",
      "San Francisco Ozolotepec",
      "San Francisco Sola",
      "San Francisco Telixtlahuaca",
      "San Francisco Teopan",
      "San Francisco Tlapancingo",
      "San Gabriel Mixtepec",
      "San Ildefonso Amatlán",
      "San Ildefonso Sola",
      "San Ildefonso Villa Alta",
      "San Jacinto Amilpas",
      "San Jacinto Tlacotepec",
      "San Jerónimo Coatlán",
      "San Jerónimo Silacayoapilla",
      "San Jerónimo Sosola",
      "San Jerónimo Taviche",
      "San Jerónimo Tecóatl",
      "San Jorge Nuchita",
      "San José Ayuquila",
      "San José Chiltepec",
      "San José del Peñasco",
      "San José Estancia Grande",
      "San José Independencia",
      "San José Lachiguiri",
      "San José Tenango",
      "San Juan Achiutla",
      "San Juan Atepec",
      "Ánimas Trujano",
      "San Juan Bautista Atatlahuca",
      "San Juan Bautista Coixtlahuaca",
      "San Juan Bautista Cuicatlán",
      "San Juan Bautista Guelache",
      "San Juan Bautista Jayacatlán",
      "San Juan Bautista Lo de Soto",
      "San Juan Bautista Suchitepec",
      "San Juan Bautista Tlacoatzintepec",
      "San Juan Bautista Tlachichilco",
      "San Juan Bautista Tuxtepec",
      "San Juan Cacahuatepec",
      "San Juan Cieneguilla",
      "San Juan Coatzóspam",
      "San Juan Colorado",
      "San Juan Comaltepec",
      "San Juan Cotzocón",
      "San Juan Chicomezúchil",
      "San Juan Chilateca",
      "San Juan del Estado",
      "San Juan del Río",
      "San Juan Diuxi",
      "San Juan Evangelista Analco",
      "San Juan Guelavía",
      "San Juan Guichicovi",
      "San Juan Ihualtepec",
      "San Juan Juquila Mixes",
      "San Juan Juquila Vijanos",
      "San Juan Lachao",
      "San Juan Lachigalla",
      "San Juan Lajarcia",
      "San Juan Lalana",
      "San Juan de los Cués",
      "San Juan Mazatlán",
      "San Juan Mixtepec",
      "San Juan Mixtepec",
      "San Juan Ñumí",
      "San Juan Ozolotepec",
      "San Juan Petlapa",
      "San Juan Quiahije",
      "San Juan Quiotepec",
      "San Juan Sayultepec",
      "San Juan Tabaá",
      "San Juan Tamazola",
      "San Juan Teita",
      "San Juan Teitipac",
      "San Juan Tepeuxila",
      "San Juan Teposcolula ",
      "San Juan Yaeé",
      "San Juan Yatzona",
      "San Juan Yucuita",
      "San Lorenzo",
      "San Lorenzo Albarradas",
      "San Lorenzo Cacaotepec",
      "San Lorenzo Cuaunecuiltitla",
      "San Lorenzo Texmelúcan",
      "San Lorenzo Victoria",
      "San Lucas Camotlán",
      "San Lucas Ojitlán",
      "San Lucas Quiaviní",
      "San Lucas Zoquiápam",
      "San Luis Amatlán",
      "San Marcial Ozolotepec",
      "San Marcos Arteaga",
      "San Martín de los Cansecos",
      "San Martín Huamelúlpam",
      "San Martín Itunyoso",
      "San Martín Lachilá",
      "San Martín Peras",
      "San Martín Tilcajete",
      "San Martín Toxpalan",
      "San Martín Zacatepec",
      "San Mateo Cajonos",
      "Capulálpam de Méndez",
      "San Mateo del Mar",
      "San Mateo Yoloxochitlán",
      "San Mateo Etlatongo",
      "San Mateo Nejápam",
      "San Mateo Peñasco",
      "San Mateo Piñas",
      "San Mateo Río Hondo",
      "San Mateo Sindihui",
      "San Mateo Tlapiltepec",
      "San Melchor Betaza",
      "San Miguel Achiutla",
      "San Miguel Ahuehuetitlán",
      "San Miguel Aloápam",
      "San Miguel Amatitlán",
      "San Miguel Amatlán",
      "San Miguel Coatlán",
      "San Miguel Chicahua",
      "San Miguel Chimalapa",
      "San Miguel del Puerto",
      "San Miguel del Río",
      "San Miguel Ejutla",
      "San Miguel el Grande",
      "San Miguel Huautla",
      "San Miguel Mixtepec",
      "San Miguel Panixtlahuaca",
      "San Miguel Peras",
      "San Miguel Piedras",
      "San Miguel Quetzaltepec",
      "San Miguel Santa Flor",
      "Villa Sola de Vega",
      "San Miguel Soyaltepec",
      "San Miguel Suchixtepec",
      "Villa Talea de Castro",
      "San Miguel Tecomatlán",
      "San Miguel Tenango",
      "San Miguel Tequixtepec",
      "San Miguel Tilquiápam",
      "San Miguel Tlacamama",
      "San Miguel Tlacotepec",
      "San Miguel Tulancingo",
      "San Miguel Yotao",
      "San Nicolás",
      "San Nicolás Hidalgo",
      "San Pablo Coatlán",
      "San Pablo Cuatro Venados",
      "San Pablo Etla",
      "San Pablo Huitzo",
      "San Pablo Huixtepec",
      "San Pablo Macuiltianguis",
      "San Pablo Tijaltepec",
      "San Pablo Villa de Mitla",
      "San Pablo Yaganiza",
      "San Pedro Amuzgos",
      "San Pedro Apóstol",
      "San Pedro Atoyac",
      "San Pedro Cajonos",
      "San Pedro Coxcaltepec Cántaros",
      "San Pedro Comitancillo",
      "San Pedro el Alto",
      "San Pedro Huamelula",
      "San Pedro Huilotepec",
      "San Pedro Ixcatlán",
      "San Pedro Ixtlahuaca",
      "San Pedro Jaltepetongo",
      "San Pedro Jicayán",
      "San Pedro Jocotipac",
      "San Pedro Juchatengo",
      "San Pedro Mártir",
      "San Pedro Mártir Quiechapa",
      "San Pedro Mártir Yucuxaco",
      "San Pedro Mixtepec",
      "San Pedro Mixtepec",
      "San Pedro Molinos",
      "San Pedro Nopala",
      "San Pedro Ocopetatillo",
      "San Pedro Ocotepec",
      "San Pedro Pochutla",
      "San Pedro Quiatoni",
      "San Pedro Sochiápam",
      "San Pedro Tapanatepec",
      "San Pedro Taviche",
      "San Pedro Teozacoalco",
      "San Pedro Teutila",
      "San Pedro Tidaá",
      "San Pedro Topiltepec",
      "San Pedro Totolápam",
      "Villa de Tututepec",
      "San Pedro Yaneri",
      "San Pedro Yólox",
      "San Pedro y San Pablo Ayutla",
      "Villa de Etla",
      "San Pedro y San Pablo Teposcolula",
      "San Pedro y San Pablo Tequixtepec",
      "San Pedro Yucunama",
      "San Raymundo Jalpan",
      "San Sebastián Abasolo",
      "San Sebastián Coatlán",
      "San Sebastián Ixcapa",
      "San Sebastián Nicananduta",
      "San Sebastián Río Hondo",
      "San Sebastián Tecomaxtlahuaca",
      "San Sebastián Teitipac",
      "San Sebastián Tutla",
      "San Simón Almolongas",
      "San Simón Zahuatlán",
      "Santa Ana",
      "Santa Ana Ateixtlahuaca",
      "Santa Ana Cuauhtémoc",
      "Santa Ana del Valle",
      "Santa Ana Tavela",
      "Santa Ana Tlapacoyan",
      "Santa Ana Yareni",
      "Santa Ana Zegache",
      "Santa Catalina Quierí",
      "Santa Catarina Cuixtla",
      "Santa Catarina Ixtepeji",
      "Santa Catarina Juquila",
      "Santa Catarina Lachatao",
      "Santa Catarina Loxicha",
      "Santa Catarina Mechoacán",
      "Santa Catarina Minas",
      "Santa Catarina Quiané",
      "Santa Catarina Tayata",
      "Santa Catarina Ticuá",
      "Santa Catarina Yosonotú",
      "Santa Catarina Zapoquila",
      "Santa Cruz Acatepec",
      "Santa Cruz Amilpas",
      "Santa Cruz de Bravo",
      "Santa Cruz Itundujia",
      "Santa Cruz Mixtepec",
      "Santa Cruz Nundaco",
      "Santa Cruz Papalutla",
      "Santa Cruz Tacache de Mina",
      "Santa Cruz Tacahua",
      "Santa Cruz Tayata",
      "Santa Cruz Xitla",
      "Santa Cruz Xoxocotlán",
      "Santa Cruz Zenzontepec",
      "Santa Gertrudis",
      "Santa Inés del Monte",
      "Santa Inés Yatzeche",
      "Santa Lucía del Camino",
      "Santa Lucía Miahuatlán",
      "Santa Lucía Monteverde",
      "Santa Lucía Ocotlán",
      "Santa María Alotepec",
      "Santa María Apazco",
      "Santa María la Asunción",
      "Heroica Ciudad de Tlaxiaco",
      "Ayoquezco de Aldama",
      "Santa María Atzompa",
      "Santa María Camotlán",
      "Santa María Colotepec",
      "Santa María Cortijo",
      "Santa María Coyotepec",
      "Santa María Chachoápam",
      "Villa de Chilapa de Díaz",
      "Santa María Chilchotla",
      "Santa María Chimalapa",
      "Santa María del Rosario",
      "Santa María del Tule",
      "Santa María Ecatepec",
      "Santa María Guelacé",
      "Santa María Guienagati",
      "Santa María Huatulco",
      "Santa María Huazolotitlán",
      "Santa María Ipalapa",
      "Santa María Ixcatlán",
      "Santa María Jacatepec",
      "Santa María Jalapa del Marqués",
      "Santa María Jaltianguis",
      "Santa María Lachixío",
      "Santa María Mixtequilla",
      "Santa María Nativitas",
      "Santa María Nduayaco",
      "Santa María Ozolotepec",
      "Santa María Pápalo",
      "Santa María Peñoles",
      "Santa María Petapa",
      "Santa María Quiegolani",
      "Santa María Sola",
      "Santa María Tataltepec",
      "Santa María Tecomavaca",
      "Santa María Temaxcalapa",
      "Santa María Temaxcaltepec",
      "Santa María Teopoxco",
      "Santa María Tepantlali",
      "Santa María Texcatitlán",
      "Santa María Tlahuitoltepec",
      "Santa María Tlalixtac",
      "Santa María Tonameca",
      "Santa María Totolapilla",
      "Santa María Xadani",
      "Santa María Yalina",
      "Santa María Yavesía",
      "Santa María Yolotepec",
      "Santa María Yosoyúa",
      "Santa María Yucuhiti",
      "Santa María Zacatepec",
      "Santa María Zaniza",
      "Santa María Zoquitlán",
      "Santiago Amoltepec",
      "Santiago Apoala",
      "Santiago Apóstol",
      "Santiago Astata",
      "Santiago Atitlán",
      "Santiago Ayuquililla",
      "Santiago Cacaloxtepec",
      "Santiago Camotlán",
      "Santiago Comaltepec",
      "Villa de Santiago Chazumba",
      "Villa de Santiago Chazumba",
      "Santiago del Río",
      "Santiago Huajolotitlán",
      "Santiago Huauclilla",
      "Santiago Ihuitlán Plumas",
      "Santiago Ixcuintepec",
      "Santiago Ixtayutla",
      "Santiago Jamiltepec",
      "Santiago Jocotepec",
      "Santiago Juxtlahuaca",
      "Santiago Lachiguiri",
      "Santiago Lalopa",
      "Santiago Laollaga",
      "Santiago Laxopa",
      "Santiago Llano Grande",
      "Santiago Matatlán",
      "Santiago Miltepec",
      "Santiago Minas",
      "Santiago Nacaltepec",
      "Santiago Nejapilla",
      "Santiago Nundiche",
      "Santiago Nuyoó",
      "Santiago Pinotepa Nacional",
      "Santiago Suchilquitongo",
      "Santiago Tamazola",
      "Santiago Tapextla",
      "Villa Tejúpam de la Unión",
      "Santiago Tenango",
      "Santiago Tepetlapa",
      "Santiago Tetepec",
      "Santiago Texcalcingo",
      "Santiago Textitlán",
      "Santiago Tilantongo",
      "Santiago Tillo",
      "Santiago Tlazoyaltepec",
      "Santiago Xanica",
      "Santiago Xiacuí",
      "Santiago Yaitepec",
      "Santiago Yaveo",
      "Santiago Yolomécatl",
      "Santiago Yosondúa",
      "Santiago Yucuyachi",
      "Santiago Zacatepec",
      "Santiago Zoochila",
      "Nuevo Zoquiápam",
      "Santo Domingo Ingenio",
      "Santo Domingo Albarradas",
      "Santo Domingo Armenta",
      "Santo Domingo Chihuitán",
      "Santo Domingo de Morelos",
      "Santo Domingo Ixcatlán",
      "Santo Domingo Nuxaá",
      "Santo Domingo Ozolotepec",
      "Santo Domingo Petapa",
      "Santo Domingo Roayaga",
      "Santo Domingo Tehuantepec",
      "Santo Domingo Teojomulco",
      "Santo Domingo Tepuxtepec",
      "Santo Domingo Tlatayápam",
      "Santo Domingo Tomaltepec",
      "Santo Domingo Tonalá",
      "Santo Domingo Tonaltepec",
      "Santo Domingo Xagacía",
      "Santo Domingo Yanhuitlán",
      "Santo Domingo Yodohino",
      "Santo Domingo Zanatepec",
      "Santos Reyes Nopala",
      "Santos Reyes Pápalo",
      "Santos Reyes Tepejillo",
      "Santos Reyes Yucuná",
      "Santo Tomás Jalieza",
      "Santo Tomás Mazaltepec",
      "Santo Tomás Ocotepec",
      "Santo Tomás Tamazulapan",
      "San Vicente Coatlán",
      "San Vicente Lachixío",
      "San Vicente Nuñú",
      "Silacayoápam",
      "Sitio de Xitlapehua",
      "Soledad Etla",
      "Villa de Tamazulápam del Progreso",
      "Tanetze de Zaragoza",
      "Taniche",
      "Tataltepec de Valdés",
      "Teococuilco de Marcos Pérez",
      "Teotitlán de Flores Magón",
      "Teotitlán del Valle",
      "Teotongo",
      "Tepelmeme Villa de Morelos",
      "Heroica Villa Tezoatlán de Segura y Luna, Cuna de la Independencia de Oaxaca",
      "San Jerónimo Tlacochahuaya",
      "Tlacolula de Matamoros",
      "Tlacotepec Plumas",
      "Tlalixtac de Cabrera",
      "Totontepec Villa de Morelos",
      "Trinidad Zaachila",
      "La Trinidad Vista Hermosa",
      "Unión Hidalgo",
      "Valerio Trujano",
      "San Juan Bautista Valle Nacional",
      "Villa Díaz Ordaz",
      "Yaxe",
      "Magdalena Yodocono de Porfirio Díaz",
      "Yogana",
      "Yutanduchi de Guerrero",
      "Villa de Zaachila",
      "San Mateo Yucutindoo",
      "Zapotitlán Lagunas",
      "Zapotitlán Palmas",
      "Santa Inés de Zaragoza",
      "Zimatlán de Álvarez",
    ],
    Puebla: [
      "Acajete",
      "Acateno",
      "Acatlán",
      "Acatzingo",
      "Acteopan",
      "Ahuacatlán",
      "Ahuatlán",
      "Ahuazotepec",
      "Ahuehuetitla",
      "Ajalpan",
      "Albino Zertuche",
      "Aljojuca",
      "Altepexi",
      "Amixtlán",
      "Amozoc",
      "Aquixtla",
      "Atempan",
      "Atexcal",
      "Atlixco",
      "Atoyatempan",
      "Atzala",
      "Atzitzihuacán",
      "Atzitzintla",
      "Axutla",
      "Ayotoxco de Guerrero",
      "Calpan",
      "Caltepec",
      "Camocuautla",
      "Caxhuacan",
      "Coatepec",
      "Coatzingo",
      "Cohetzala",
      "Cohuecan",
      "Coronango",
      "Coxcatlán",
      "Coyomeapan",
      "Coyotepec",
      "Cuapiaxtla de Madero",
      "Cuautempan",
      "Cuautinchán",
      "Cuautlancingo",
      "Cuayuca de Andrade",
      "Cuetzalan del Progreso",
      "Cuyoaco",
      "Chalchicomula de Sesma",
      "Chapulco",
      "Chiautla",
      "Chiautzingo",
      "Chiconcuautla",
      "Chichiquila",
      "Chietla",
      "Chigmecatitlán",
      "Chignahuapan",
      "Chignautla",
      "Chila",
      "Chila de la Sal",
      "Honey",
      "Chilchotla",
      "Chinantla",
      "Domingo Arenas",
      "Eloxochitlán",
      "Epatlán",
      "Esperanza",
      "Francisco Z. Mena",
      "General Felipe Ángeles",
      "Guadalupe",
      "Guadalupe Victoria",
      "Hermenegildo Galeana",
      "Huaquechula",
      "Huatlatlauca",
      "Huauchinango",
      "Huehuetla",
      "Huehuetlán el Chico",
      "Huejotzingo",
      "Hueyapan",
      "Hueytamalco",
      "Hueytlalpan",
      "Huitzilan de Serdán",
      "Huitziltepec",
      "Atlequizayan",
      "Ixcamilpa de Guerrero",
      "Ixcaquixtla",
      "Ixtacamaxtitlán",
      "Ixtepec",
      "Izúcar de Matamoros",
      "Jalpan",
      "Jolalpan",
      "Jonotla",
      "Jopala",
      "Juan C. Bonilla",
      "Juan Galindo",
      "Juan N. Méndez",
      "Lafragua",
      "Libres",
      "La Magdalena Tlatlauquitepec",
      "Mazapiltepec de Juárez",
      "Mixtla",
      "Molcaxac",
      "Cañada Morelos",
      "Naupan",
      "Nauzontla",
      "Nealtican",
      "Nicolás Bravo",
      "Nopalucan",
      "Ocotepec",
      "Ocoyucan",
      "Olintla",
      "Oriental",
      "Pahuatlán",
      "Palmar de Bravo",
      "Pantepec",
      "Petlalcingo",
      "Piaxtla",
      "Puebla",
      "Quecholac",
      "Quimixtlán",
      "Rafael Lara Grajales",
      "Los Reyes de Juárez",
      "San Andrés Cholula",
      "San Antonio Cañada",
      "San Diego la Mesa Tochimiltzingo",
      "San Felipe Teotlalcingo",
      "San Felipe Tepatlán",
      "San Gabriel Chilac",
      "San Gregorio Atzompa",
      "San Jerónimo Tecuanipan",
      "San Jerónimo Xayacatlán",
      "San José Chiapa",
      "San José Miahuatlán",
      "San Juan Atenco",
      "San Juan Atzompa",
      "San Martín Texmelucan",
      "San Martín Totoltepec",
      "San Matías Tlalancaleca",
      "San Miguel Ixitlán",
      "San Miguel Xoxtla",
      "San Nicolás Buenos Aires",
      "San Nicolás de los Ranchos",
      "San Pablo Anicano",
      "San Pedro Cholula",
      "San Pedro Yeloixtlahuaca",
      "San Salvador el Seco",
      "San Salvador el Verde",
      "San Salvador Huixcolotla",
      "San Sebastián Tlacotepec",
      "Santa Catarina Tlaltempan",
      "Santa Inés Ahuatempan",
      "Santa Isabel Cholula",
      "Santiago Miahuatlán",
      "Huehuetlán el Grande",
      "Santo Tomás Hueyotlipan",
      "Soltepec",
      "Tecali de Herrera",
      "Tecamachalco",
      "Tecomatlán",
      "Tehuacán",
      "Tehuitzingo",
      "Tenampulco",
      "Teopantlán",
      "Teotlalco",
      "Tepanco de López",
      "Tepango de Rodríguez",
      "Tepatlaxco de Hidalgo",
      "Tepeaca",
      "Tepemaxalco",
      "Tepeojuma",
      "Tepetzintla",
      "Tepexco",
      "Tepexi de Rodríguez",
      "Tepeyahualco",
      "Tepeyahualco de Cuauhtémoc",
      "Tetela de Ocampo",
      "Teteles de Ávila Castillo",
      "Teziutlán",
      "Tianguismanalco",
      "Tilapa",
      "Tlacotepec de Benito Juárez",
      "Tlacuilotepec",
      "Tlachichuca",
      "Tlahuapan",
      "Tlaltenango",
      "Tlanepantla",
      "Tlaola",
      "Tlapacoya",
      "Tlapanalá",
      "Tlatlauquitepec",
      "Tlaxco",
      "Tochimilco",
      "Tochtepec",
      "Totoltepec de Guerrero",
      "Tulcingo",
      "Tuzamapan de Galeana",
      "Tzicatlacoyan",
      "Venustiano Carranza",
      "Vicente Guerrero",
      "Xayacatlán de Bravo",
      "Xicotepec",
      "Xicotlán",
      "Xiutetelco",
      "Xochiapulco",
      "Xochiltepec",
      "Xochitlán de Vicente Suárez",
      "Xochitlán Todos Santos",
      "Yaonáhuac",
      "Yehualtepec",
      "Zacapala",
      "Zacapoaxtla",
      "Zacatlán",
      "Zapotitlán",
      "Zapotitlán de Méndez",
      "Zaragoza",
      "Zautla",
      "Zihuateutla",
      "Zinacatepec",
      "Zongozotla",
      "Zoquiapan",
      "Zoquitlán",
    ],
    Querétaro: [
      "Amealco de Bonfil",
      "Pinal de Amoles",
      "Arroyo Seco",
      "Cadereyta de Montes",
      "Colón",
      "Corregidora",
      "Ezequiel Montes",
      "Huimilpan",
      "Jalpan de Serra",
      "Landa de Matamoros",
      "El Marqués",
      "Pedro Escobedo",
      "Peñamiller",
      "Querétaro",
      "San Joaquín",
      "San Juan del Río",
      "Tequisquiapan",
      "Tolimán",
    ],
    "Quintana Roo": [
      "Cozumel",
      "Felipe Carrillo Puerto",
      "Isla Mujeres",
      "Othón P. Blanco",
      "Benito Juárez",
      "José María Morelos",
      "Lázaro Cárdenas",
      "Solidaridad",
      "Tulum",
      "Bacalar",
      "Puerto Morelos",
    ],
    "San Luis Potosí": [
      "Ahualulco",
      "Alaquines",
      "Aquismón",
      "Armadillo de los Infante",
      "Cárdenas",
      "Catorce",
      "Cedral",
      "Cerritos",
      "Cerro de San Pedro",
      "Ciudad del Maíz",
      "Ciudad Fernández",
      "Tancanhuitz",
      "Ciudad Valles",
      "Coxcatlán",
      "Charcas",
      "Ebano",
      "Guadalcázar",
      "Huehuetlán",
      "Lagunillas",
      "Matehuala",
      "Mexquitic de Carmona",
      "Moctezuma",
      "Rayón",
      "Rioverde",
      "Salinas",
      "San Antonio",
      "San Ciro de Acosta",
      "San Luis Potosí",
      "San Martín Chalchicuautla",
      "San Nicolás Tolentino",
      "Santa Catarina",
      "Santa María del Río",
      "Santo Domingo",
      "San Vicente Tancuayalab",
      "Soledad de Graciano Sánchez",
      "Tamasopo",
      "Tamazunchale",
      "Tampacán",
      "Tampamolón Corona",
      "Tamuín",
      "Tanlajás",
      "Tanquián de Escobedo",
      "Tierra Nueva",
      "Vanegas",
      "Venado",
      "Villa de Arriaga",
      "Villa de Guadalupe",
      "Villa de la Paz",
      "Villa de Ramos",
      "Villa de Reyes",
      "Villa Hidalgo",
      "Villa Juárez",
      "Axtla de Terrazas",
      "Xilitla",
      "Zaragoza",
      "Villa de Arista",
      "Matlapa",
      "El Naranjo",
    ],
    Sinaloa: [
      "Ahome",
      "Angostura",
      "Badiraguato",
      "Concordia",
      "Cosalá",
      "Culiacán",
      "Choix",
      "Elota",
      "Escuinapa",
      "El Fuerte",
      "Guasave ",
      "Mazatlán",
      "Mocorito",
      "Rosario",
      "Salvador Alvarado",
      "San Ignacio",
      "Sinaloa",
      "Navolato",
    ],
    Sonora: [
      "Aconchi",
      "Agua Prieta",
      "Alamos",
      "Altar",
      "Arivechi",
      "Arizpe",
      "Atil",
      "Bacadéhuachi",
      "Bacanora",
      "Bacerac",
      "Bacoachi",
      "Bácum",
      "Banámichi",
      "Baviácora",
      "Bavispe",
      "Benjamín Hill",
      "Caborca",
      "Cajeme",
      "Cananea",
      "Carbó",
      "La Colorada",
      "Cucurpe",
      "Cumpas",
      "Divisaderos",
      "Empalme",
      "Etchojoa",
      "Fronteras",
      "Granados",
      "Guaymas",
      "Hermosillo",
      "Huachinera",
      "Huásabas",
      "Huatabampo",
      "Huépac",
      "Imuris",
      "Magdalena",
      "Mazatán",
      "Moctezuma",
      "Naco",
      "Nácori Chico",
      "Nacozari de García",
      "Navojoa",
      "Nogales",
      "Ónavas",
      "Opodepe",
      "Oquitoa",
      "Pitiquito",
      "Puerto Peñasco",
      "Quiriego",
      "Rayón",
      "Rosario",
      "Sahuaripa",
      "San Felipe de Jesús",
      "San Javier",
      "San Luis Río Colorado",
      "San Miguel de Horcasitas",
      "San Pedro de la Cueva",
      "Santa Ana",
      "Santa Cruz",
      "Sáric",
      "Soyopa",
      "Suaqui Grande",
      "Tepache",
      "Trincheras",
      "Tubutama",
      "Ures",
      "Villa Hidalgo",
      "Villa Pesqueira",
      "Yécora",
      "General Plutarco Elías Calles",
      "Benito Juárez",
      "San Ignacio Río Muerto",
    ],
    Tabasco: [
      "Balancán",
      "Cárdenas",
      "Centla",
      "Centro",
      "Comalcalco",
      "Cunduacán",
      "Emiliano Zapata",
      "Huimanguillo",
      "Jalapa",
      "Jalpa de Méndez",
      "Jonuta",
      "Macuspana",
      "Nacajuca",
      "Paraíso",
      "Tacotalpa",
      "Teapa",
      "Tenosique",
    ],
    Tamaulipas: [
      "Abasolo",
      "Aldama",
      "Altamira",
      "Antiguo Morelos",
      "Burgos",
      "Bustamante",
      "Camargo",
      "Casas",
      "Ciudad Madero",
      "Cruillas",
      "Gómez Farías",
      "González",
      "Güémez",
      "Guerrero",
      "Gustavo Díaz Ordaz",
      "Hidalgo",
      "Jaumave",
      "Jiménez",
      "Llera",
      "Mainero",
      "El Mante",
      "Matamoros",
      "Méndez",
      "Mier",
      "Miguel Alemán",
      "Miquihuana",
      "Nuevo Laredo",
      "Nuevo Morelos",
      "Ocampo",
      "Padilla",
      "Palmillas",
      "Reynosa",
      "Río Bravo",
      "San Carlos",
      "San Fernando",
      "San Nicolás",
      "Soto la Marina",
      "Tampico",
      "Tula",
      "Valle Hermoso",
      "Victoria",
      "Villagrán",
      "Xicoténcatl",
    ],
    Tlaxcala: [
      "Amaxac de Guerrero",
      "Apetatitlán de Antonio Carvajal",
      "Atlangatepec",
      "Atltzayanca",
      "Apizaco",
      "Calpulalpan",
      "El Carmen Tequexquitla",
      "Cuapiaxtla",
      "Cuaxomulco",
      "Chiautempan",
      "Muñoz de Domingo Arenas",
      "Españita",
      "Huamantla",
      "Hueyotlipan",
      "Ixtacuixtla de Mariano Matamoros",
      "Ixtenco",
      "Mazatecochco de José María Morelos",
      "Contla de Juan Cuamatzi",
      "Tepetitla de Lardizábal",
      "Sanctórum de Lázaro Cárdenas",
      "Nanacamilpa de Mariano Arista",
      "Acuamanala de Miguel Hidalgo",
      "Natívitas",
      "Panotla",
      "San Pablo del Monte",
      "Santa Cruz Tlaxcala",
      "Tenancingo",
      "Teolocholco",
      "Tepeyanco",
      "Terrenate",
      "Tetla de la Solidaridad",
      "Tetlatlahuca",
      "Tlaxcala",
      "Tlaxco",
      "Tocatlán",
      "Totolac",
      "Ziltlaltépec de Trinidad Sánchez Santos",
      "Tzompantepec",
      "Xaloztoc",
      "Xaltocan",
      "Papalotla de Xicohténcatl",
      "Xicohtzinco",
      "Yauhquemehcan",
      "Zacatelco",
      "Benito Juárez",
      "Emiliano Zapata",
      "Lázaro Cárdenas",
      "La Magdalena Tlaltelulco",
      "San Damián Texóloc",
      "San Francisco Tetlanohcan",
      "San Jerónimo Zacualpan",
      "San José Teacalco",
      "San Juan Huactzinco",
      "San Lorenzo Axocomanitla",
      "San Lucas Tecopilco",
      "Santa Ana Nopalucan",
      "Santa Apolonia Teacalco",
      "Santa Catarina Ayometla",
      "Santa Cruz Quilehtla",
      "Santa Isabel Xiloxoxtla",
    ],
    Veracruz: [
      "Acajete",
      "Acatlán",
      "Acayucan",
      "Actopan",
      "Acula",
      "Acultzingo",
      "Camarón de Tejeda",
      "Alpatláhuac",
      "Alto Lucero de Gutiérrez Barrios",
      "Altotonga",
      "Alvarado",
      "Amatitlán",
      "Naranjos Amatlán",
      "Amatlán de los Reyes",
      "Angel R. Cabada",
      "La Antigua",
      "Apazapan",
      "Aquila",
      "Astacinga",
      "Atlahuilco",
      "Atoyac",
      "Atzacan",
      "Atzalan",
      "Tlaltetela",
      "Ayahualulco",
      "Banderilla",
      "Benito Juárez",
      "Boca del Río",
      "Calcahualco",
      "Camerino Z. Mendoza",
      "Carrillo Puerto",
      "Catemaco",
      "Cazones de Herrera",
      "Cerro Azul",
      "Citlaltépetl",
      "Coacoatzintla",
      "Coahuitlán",
      "Coatepec",
      "Coatzacoalcos",
      "Coatzintla",
      "Coetzala",
      "Colipa",
      "Comapa",
      "Córdoba",
      "Cosamaloapan de Carpio",
      "Cosautlán de Carvajal",
      "Coscomatepec",
      "Cosoleacaque",
      "Cotaxtla",
      "Coxquihui",
      "Coyutla",
      "Cuichapa",
      "Cuitláhuac",
      "Chacaltianguis",
      "Chalma",
      "Chiconamel",
      "Chiconquiaco",
      "Chicontepec",
      "Chinameca",
      "Chinampa de Gorostiza",
      "Las Choapas",
      "Chocamán",
      "Chontla",
      "Chumatlán",
      "Emiliano Zapata",
      "Espinal",
      "Filomeno Mata",
      "Fortín",
      "Gutiérrez Zamora",
      "Hidalgotitlán",
      "Huatusco",
      "Huayacocotla",
      "Hueyapan de Ocampo",
      "Huiloapan de Cuauhtémoc",
      "Ignacio de la Llave",
      "Ilamatlán",
      "Isla",
      "Ixcatepec",
      "Ixhuacán de los Reyes",
      "Ixhuatlán del Café",
      "Ixhuatlancillo",
      "Ixhuatlán del Sureste",
      "Ixhuatlán de Madero",
      "Ixmatlahuacan",
      "Ixtaczoquitlán",
      "Jalacingo",
      "Xalapa",
      "Jalcomulco",
      "Jáltipan",
      "Jamapa",
      "Jesús Carranza",
      "Xico",
      "Jilotepec",
      "Juan Rodríguez Clara",
      "Juchique de Ferrer",
      "Landero y Coss",
      "Lerdo de Tejada",
      "Magdalena",
      "Maltrata",
      "Manlio Fabio Altamirano",
      "Mariano Escobedo",
      "Martínez de la Torre",
      "Mecatlán",
      "Mecayapan",
      "Medellín de Bravo",
      "Miahuatlán",
      "Las Minas",
      "Minatitlán",
      "Misantla",
      "Mixtla de Altamirano",
      "Moloacán",
      "Naolinco",
      "Naranjal",
      "Nautla",
      "Nogales",
      "Oluta",
      "Omealca",
      "Orizaba",
      "Otatitlán",
      "Oteapan",
      "Ozuluama de Mascareñas",
      "Pajapan",
      "Pánuco",
      "Papantla",
      "Paso del Macho",
      "Paso de Ovejas",
      "La Perla ",
      "Perote",
      "Platón Sánchez",
      "Playa Vicente",
      "Poza Rica de Hidalgo",
      "Las Vigas de Ramírez",
      "Pueblo Viejo",
      "Puente Nacional",
      "Rafael Delgado",
      "Rafael Lucio",
      "Los Reyes",
      "Río Blanco",
      "Saltabarranca",
      "San Andrés Tenejapan",
      "San Andrés Tuxtla",
      "San Juan Evangelista",
      "Santiago Tuxtla",
      "Sayula de Alemán",
      "Soconusco",
      "Sochiapa",
      "Soledad Atzompa",
      "Soledad de Doblado",
      "Soteapan",
      "Tamalín",
      "Tamiahua",
      "Tampico Alto",
      "Tancoco",
      "Tantima",
      "Tantoyuca",
      "Tatatila",
      "Castillo de Teayo",
      "Tecolutla",
      "Tehuipango",
      "Álamo Temapache",
      "Tempoal",
      "Tenampa",
      "Tenochtitlán",
      "Teocelo",
      "Tepatlaxco",
      "Tepetlán",
      "Tepetzintla",
      "Tequila",
      "José Azueta",
      "Texcatepec",
      "Texhuacán",
      "Texistepec",
      "Tezonapa",
      "Tierra Blanca",
      "Tihuatlán",
      "Tlacojalpan",
      "Tlacolulan",
      "Tlacotalpan",
      "Tlacotepec de Mejía",
      "Tlachichilco",
      "Tlalixcoyan",
      "Tlalnelhuayocan",
      "Tlapacoyan",
      "Tlaquilpa",
      "Tlilapan",
      "Tomatlán",
      "Tonayán",
      "Totutla",
      "Tuxpan",
      "Tuxtilla",
      "Ursulo Galván",
      "Vega de Alatorre",
      "Veracruz",
      "Villa Aldama",
      "Xoxocotla",
      "Yanga",
      "Yecuatla",
      "Zacualpan",
      "Zaragoza",
      "Zentla",
      "Zongolica",
      "Zontecomatlán de López y Fuentes",
      "Zozocolco de Hidalgo",
      "Agua Dulce",
      "El Higo",
      "Nanchital de Lázaro Cárdenas del Río",
      "Tres Valles",
      "Carlos A. Carrillo",
      "Tatahuicapan de Juárez",
      "Uxpanapa",
      "San Rafael",
      "Santiago Sochiapan",
    ],
    Yucatán: [
      "Abalá",
      "Acanceh",
      "Akil",
      "Baca",
      "Bokobá",
      "Buctzotz",
      "Cacalchén",
      "Calotmul",
      "Cansahcab",
      "Cantamayec",
      "Celestún",
      "Cenotillo",
      "Conkal",
      "Cuncunul",
      "Cuzamá",
      "Chacsinkín",
      "Chankom",
      "Chapab",
      "Chemax",
      "Chicxulub Pueblo",
      "Chichimilá",
      "Chikindzonot",
      "Chocholá",
      "Chumayel",
      "Dzán",
      "Dzemul",
      "Dzidzantún",
      "Dzilam de Bravo",
      "Dzilam González",
      "Dzitás",
      "Dzoncauich",
      "Espita",
      "Halachó",
      "Hocabá",
      "Hoctún",
      "Homún",
      "Huhí",
      "Hunucmá",
      "Ixil",
      "Izamal",
      "Kanasín",
      "Kantunil",
      "Kaua",
      "Kinchil",
      "Kopomá",
      "Mama",
      "Maní",
      "Maxcanú",
      "Mayapán",
      "Mérida",
      "Mocochá",
      "Motul",
      "Muna",
      "Muxupip",
      "Opichén",
      "Oxkutzcab",
      "Panabá",
      "Peto",
      "Progreso",
      "Quintana Roo",
      "Río Lagartos",
      "Sacalum",
      "Samahil",
      "Sanahcat",
      "San Felipe",
      "Santa Elena",
      "Seyé",
      "Sinanché",
      "Sotuta",
      "Sucilá",
      "Sudzal",
      "Suma",
      "Tahdziú",
      "Tahmek",
      "Teabo",
      "Tecoh",
      "Tekal de Venegas",
      "Tekantó",
      "Tekax",
      "Tekit",
      "Tekom",
      "Telchac Pueblo",
      "Telchac Puerto",
      "Temax",
      "Temozón",
      "Tepakán",
      "Tetiz",
      "Teya",
      "Ticul",
      "Timucuy",
      "Tinum",
      "Tixcacalcupul",
      "Tixkokob",
      "Tixmehuac",
      "Tixpéhual",
      "Tizimín",
      "Tunkás",
      "Tzucacab",
      "Uayma",
      "Ucú",
      "Umán",
      "Valladolid",
      "Xocchel",
      "Yaxcabá",
      "Yaxkukul",
      "Yobaín",
    ],
    Zacatecas: [
      "Apozol",
      "Apulco",
      "Atolinga",
      "Benito Juárez",
      "Calera",
      "Cañitas de Felipe Pescador",
      "Concepción del Oro",
      "Cuauhtémoc",
      "Chalchihuites",
      "Fresnillo",
      "Trinidad García de la Cadena",
      "Genaro Codina",
      "General Enrique Estrada",
      "General Francisco R. Murguía",
      "El Plateado de Joaquín Amaro",
      "General Pánfilo Natera",
      "Guadalupe",
      "Huanusco",
      "Jalpa",
      "Jerez",
      "Jiménez del Teul",
      "Juan Aldama",
      "Juchipila",
      "Loreto",
      "Luis Moya",
      "Mazapil",
      "Melchor Ocampo",
      "Mezquital del Oro",
      "Miguel Auza",
      "Momax",
      "Monte Escobedo",
      "Morelos",
      "Moyahua de Estrada",
      "Nochistlán de Mejía",
      "Noria de Ángeles",
      "Ojocaliente",
      "Pánuco",
      "Pinos",
      "Río Grande",
      "Sain Alto",
      "El Salvador",
      "Sombrerete",
      "Susticacán",
      "Tabasco",
      "Tepechitlán",
      "Tepetongo",
      "Teúl de González Ortega",
      "Tlaltenango de Sánchez Román",
      "Valparaíso",
      "Vetagrande",
      "Villa de Cos",
      "Villa García",
      "Villa González Ortega",
      "Villa Hidalgo",
      "Villanueva",
      "Zacatecas",
      "Trancoso",
      "Santa María de la Paz",
    ],
  };

  const estadoSelect = document.getElementById("address_state");
  const ciudadSelect = document.getElementById("address_city");

  // Llenar el campo de estados
  Object.keys(estadosYCiudades).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    estadoSelect.appendChild(option);
  });

  // Escuchar cambios en el campo de estado
  estadoSelect.addEventListener("change", () => {
    const selectedEstado = estadoSelect.value;
    ciudadSelect.innerHTML = '<option value="">Seleccione</option>'; // Reiniciar ciudades

    if (selectedEstado && estadosYCiudades[selectedEstado]) {
      estadosYCiudades[selectedEstado].forEach((ciudad) => {
        const option = document.createElement("option");
        option.value = ciudad;
        option.textContent = ciudad;
        ciudadSelect.appendChild(option);
      });
    }
  });

  // Generar días
  const daySelect = document.getElementById("birth_day");
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement("option");
    option.value = String(i).padStart(2, "0");
    option.textContent = String(i).padStart(2, "0");
    daySelect.appendChild(option);
  }

  // Generar años
  const yearSelect = document.getElementById("birth_year");
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 83; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }

  // Obtener elementos del DOM
  const genderSelect = document.getElementById("student_gender");
  const otherGenderContainer = document.getElementById("otherGenderContainer");
  const otherGenderInput = document.getElementById("other_gender");

  // Agregar evento change al select
  genderSelect.addEventListener("change", function () {
    if (this.value === "otro") {
      otherGenderContainer.style.display = "block";
      otherGenderInput.required = true;
    } else {
      otherGenderContainer.style.display = "none";
      otherGenderInput.required = false;
      otherGenderInput.value = ""; // Limpiar el input cuando se selecciona otra opción
    }
  });

  // Configuración de grados por nivel escolar
  const gradosPorNivel = {
    preescolar: [1, 2, 3],
    primaria: [1, 2, 3, 4, 5, 6],
    secundaria: [1, 2, 3],
    preparatoria: [1, 2, 3],
  };

  // Obtener referencias a los elementos
  const nivelSelect = document.getElementById("academic_level");
  const gradoSelect = document.getElementById("academic_grade");

  // Función para actualizar los grados
  function actualizarGrados() {
    // Obtener el nivel seleccionado
    const nivelSeleccionado = nivelSelect.value;

    // Limpiar el select de grados
    gradoSelect.innerHTML = '<option value="seleccione">Seleccione</option>';

    // Si se seleccionó un nivel válido
    if (
      nivelSeleccionado !== "seleccione" &&
      gradosPorNivel[nivelSeleccionado]
    ) {
      // Agregar las opciones correspondientes al nivel
      gradosPorNivel[nivelSeleccionado].forEach((grado) => {
        const option = document.createElement("option");
        option.value = grado;
        option.textContent = grado;
        gradoSelect.appendChild(option);
      });

      // Habilitar el select de grados
      gradoSelect.disabled = false;
    } else {
      // Deshabilitar el select de grados si no hay nivel seleccionado
      gradoSelect.disabled = true;
    }
  }

  // Agregar el evento change al select de nivel
  nivelSelect.addEventListener("change", actualizarGrados);

  // Inicializar el estado del select de grados
  gradoSelect.disabled = true;

  // Obtener el elemento del correo
  const emailInput = document.getElementById("parent_email");

  // Expresión regular para validar el formato del correo
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  // Función para validar el correo
  function validateEmail() {
    const email = emailInput.value.trim();

    // Validar si está vacío (ya que es requerido)
    if (!email) {
      markEmailError("El correo es requerido");
      return false;
    }

    // Validar el formato usando regex
    if (!emailRegex.test(email)) {
      markEmailError("Por favor, ingrese un correo válido");
      return false;
    }

    // Si pasa las validaciones, quitar errores
    clearEmailError();
    return true;
  }

  // Función para marcar error
  function markEmailError(message) {
    emailInput.style.borderColor = "red";
    emailInput.style.borderWidth = "2px";

    // Crear o actualizar mensaje de error
    let errorDiv = emailInput.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains("email-error")) {
      errorDiv = document.createElement("div");
      errorDiv.className = "email-error";
      emailInput.parentNode.insertBefore(errorDiv, emailInput.nextSibling);
    }
    errorDiv.textContent = message;
    errorDiv.style.color = "#A60311";
    errorDiv.style.fontSize = "12px";
    errorDiv.style.marginTop = "5px";
  }

  // Función para limpiar error
  function clearEmailError() {
    emailInput.style.borderColor = "";
    emailInput.style.borderWidth = "";

    // Remover mensaje de error si existe
    const errorDiv = emailInput.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains("email-error")) {
      errorDiv.remove();
    }
  }

  // Validar en tiempo real mientras el usuario escribe
  emailInput.addEventListener("input", validateEmail);

  // Validar cuando el campo pierde el foco
  emailInput.addEventListener("blur", validateEmail);
});
