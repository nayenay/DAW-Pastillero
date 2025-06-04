// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el path de la URL actual para saber en qué página estamos
  const path = window.location.pathname;
  // Ajusta "/DAW-Pastillero/" a la raíz de tu GH Pages si es diferente
  const isIndexPage = path.endsWith("index.html") || path === "/DAW-Pastillero/" || path === "/DAW-Pastillero/index.html";
  const isRegistroPage = path.endsWith("registro.html") || path === "/DAW-Pastillero/registro.html";
  const isListaPage = path.endsWith("lista.html") || path === "/DAW-Pastillero/lista.html";

  // Lógica de Depuración Global
  const scriptStatusIndex = document.getElementById("scriptStatus");
  const scriptStatusRegistro = document.getElementById("scriptStatusRegistro");
  const scriptStatusLista = document.getElementById("scriptStatusLista");

  if (scriptStatusIndex) scriptStatusIndex.textContent = "Script principal ejecutándose en Index...";
  if (scriptStatusRegistro) scriptStatusRegistro.textContent = "Script principal ejecutándose en Registro...";
  if (scriptStatusLista) scriptStatusLista.textContent = "Script principal ejecutándose en Lista...";

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA INDEX.HTML (Login/Registro)
  // -------------------------------------------------------------
  if (isIndexPage) {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Por favor, ingresa correo y contraseña.");
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("Usuario ha iniciado sesión:", userCredential.user.email);
            window.location.href = "registro.html";
          })
          .catch(err => {
            alert("Error al iniciar sesión: " + err.message);
            console.error("Error de inicio de sesión:", err);
            if (scriptStatusIndex) {
              scriptStatusIndex.textContent = "Error de Login: " + err.message;
              scriptStatusIndex.style.color = 'red';
            }
          });
      });
    }

    if (registerBtn) {
      registerBtn.addEventListener("click", () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Por favor, ingresa correo y contraseña.");
            return;
        }
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            alert("Registrado con éxito. ¡Ya puedes iniciar sesión!");
            console.log("Nuevo usuario registrado:", userCredential.user.email);
            if (scriptStatusIndex) {
              scriptStatusIndex.textContent = "Registro exitoso!";
              scriptStatusIndex.style.color = 'green';
            }
          })
          .catch(err => {
            alert("Error al registrarse: " + err.message);
            console.error("Error de registro:", err);
            if (scriptStatusIndex) {
              scriptStatusIndex.textContent = "Error de Registro: " + err.message;
              scriptStatusIndex.style.color = 'red';
            }
          });
      });
    }
  } // Cierre del if (isIndexPage)

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA REGISTRO.HTML
  // -------------------------------------------------------------

  // Esta función auxiliar se usa para mostrar errores de validación en los inputs
  function mostrarError(inputElement, msgDivElement, mensaje) {
    inputElement.classList.add("incorrecto");
    msgDivElement.textContent = mensaje;
    msgDivElement.style.display = "block";
  }

  if (isRegistroPage) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      const guardarBtn = document.getElementById("guardarBtn");

      if (guardarBtn) {
        guardarBtn.addEventListener("click", async () => {
          const userId = user.uid;

          // Obtener referencias a los elementos input
          const nombreInput = document.getElementById("nombre");
          const horasInput = document.getElementById("horas");
          const noComInput = document.getElementById("noCom");
          const dosisTotalInput = document.getElementById("dosis");
          const fechaPrimeraInput = document.getElementById("fechaPrimera");
          const horaPrimeraInput = document.getElementById("horaPrimera");

          // Obtener referencias a los divs de mensaje de error
          const errNombre = document.getElementById("msj-nombre");
          const errHoras = document.getElementById("msj-horas");
          const errNoCom = document.getElementById("msj-noCom");
          const errDosis = document.getElementById("msj-dosis");
          const errFecha = document.getElementById("msj-fecha");
          const errHoraPrimera = document.getElementById("msj-horaP");
          
          // Limpiar errores previos
          [nombreInput, horasInput, noComInput, dosisTotalInput, fechaPrimeraInput, horaPrimeraInput].forEach(e => e.classList.remove("incorrecto"));
          [errNombre, errHoras, errNoCom, errDosis, errFecha, errHoraPrimera].forEach(e => {
            e.textContent = "";
            e.style.display = "none";
          });

          // Obtener los VALORES de los inputs
          const nombre = nombreInput.value.trim();
          const horas = parseInt(horasInput.value.trim()); // Intervalo en horas
          const noCom = parseInt(noComInput.value.trim());
          const dosisTotal = parseInt(dosisTotalInput.value.trim()); // Cantidad total de dosis
          const fechaPrimeraStr = fechaPrimeraInput.value; // 'YYYY-MM-DD'
          const horaPrimeraStr = horaPrimeraInput.value;   // 'HH:MM'
 
          // VALIDACIONES
          if (nombre === ""){            
            mostrarError(nombreInput,errNombre,"Este campo es obligatorio");
            return;
          }

          if (horasInput.value.trim()===""){            
            mostrarError(horasInput,errHoras,"Este campo es obligatorio"); 
            return;        
          } else if (isNaN(horas) || horas <= 0){ // Usar la variable `horas` (parseada)
            mostrarError(horasInput,errHoras,"Debe ingresar un número válido de horas (> 0)");
            return;
          }
          
          if (noComInput.value.trim()===""){            
            mostrarError(noComInput,errNoCom,"Este campo es obligatorio"); 
            return;       
          } else if (isNaN(noCom) || noCom <= 0){ // Usar la variable `noCom` (parseada)
            mostrarError(noComInput,errNoCom,"Debe ingresar un número de compartimiento válido (> 0)");
            return;
          }

          if (dosisTotalInput.value.trim()===""){            
            mostrarError(dosisTotalInput,errDosis,"Este campo es obligatorio");         
            return;
          } else if (isNaN(dosisTotal) || dosisTotal <= 0){ // Usar la variable `dosisTotal` (parseada)
            mostrarError(dosisTotalInput,errDosis,"Debe ingresar una dosis total válida (> 0)");
            return;
          }

          if (fechaPrimeraInput.value === ""){            
            mostrarError(fechaPrimeraInput,errFecha,"Seleccione una fecha");
            return;
          }

          if (horaPrimeraInput.value === ""){            
            mostrarError(horaPrimeraInput,errHoraPrimera,"Seleccione una hora");
            return;
          }
 
          // Construir el objeto Date para la primera toma
          const [year, month, day] = fechaPrimeraStr.split('-').map(Number); // CORRECCIÓN: usar '-' para split
          const [hour, minute] = horaPrimeraStr.split(':').map(Number);

          let currentDoseTime = new Date(Date.UTC(year, month - 1, day, hour, minute, 0)); // Segundos en 00

          const dosisProgramadas = {}; // Objeto para almacenar las dosis calculadas

          for (let i = 1; i <= dosisTotal; i++) { // CORRECCIÓN: usar la variable `dosisTotal` (parseada)
              const formattedDate = currentDoseTime.toISOString();
              const finalFormattedDose = formattedDate.substring(0, 19) + 'Z';

              dosisProgramadas[i.toString()] = finalFormattedDose;

              // Calcular la siguiente toma: añadir el intervalo de horas
              currentDoseTime.setUTCHours(currentDoseTime.getUTCHours() + horas); // CORRECCIÓN: usar la variable `horas` (parseada)
          }

          const data = {
            NombreMed: nombre, // Ya es un string `trim()`
            Horas: horas.toString(), // Convertir a string para la DB si es necesario, o dejar como number
            NoCom: noCom.toString(), // Convertir a string
            DosisTotal: dosisTotal.toString(), // Convertir a string
            Nota: "",
            Dosis: dosisProgramadas // El nuevo nodo con las dosis programadas
          };

          try {
            // REVISAR ESTA RUTA: "DataBase/" + userId + "/Medicamentos/" + nombre
            // ¿Es "DataBase" o "Usuarios"? Según la discusión anterior era "Usuarios".
            // Tu imagen de DB dice "DataBase" pero también dice "G1T...w2" que va bajo "Usuarios" en Firebase auth UID.
            // Asumo que "DataBase" es el nodo raíz de tus datos y G1T...w2 es el UID.
            await set(ref(db, "DataBase/" + userId + "/Medicamentos/" + nombre), data); // Usar `nombre` directamente (ya es string)
            alert("Medicamento guardado con éxito!");
            if (scriptStatusRegistro) {
              scriptStatusRegistro.textContent = "Medicamento guardado!";
              scriptStatusRegistro.style.color = 'greenyellow';
              scriptStatusRegistro.style.backgroundColor = "rgba(203, 255, 203, 0.60)";
            }
            // Limpiar el formulario
            nombreInput.value = "";
            horasInput.value = "";
            noComInput.value = "";
            dosisTotalInput.value = "";
            fechaPrimeraInput.value = "";
            horaPrimeraInput.value = "";

            window.location.href = "lista.html";

          } catch (err) {
            alert("Error al guardar medicamento: " + err.message);
            console.error("Error al guardar:", err);
            if (scriptStatusRegistro) {
              scriptStatusRegistro.textContent = "Error al guardar: " + err.message;
              scriptStatusRegistro.style.color = 'red';
              scriptStatusRegistro.style.backgroundColor = "rgba(255, 135, 135, 0.60)";
            }
          }
        });
      }
    });
  }

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA LISTA.HTML
  // -------------------------------------------------------------
  if (isListaPage) {
    const lista = document.getElementById("lista");

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      const userId = user.uid;

      // REVISAR ESTA RUTA: "DataBase/" + userId + "/Medicamentos"
      // Asegúrate de que esta ruta coincida exactamente con la ruta de guardado
      const medRef = ref(db, "DataBase/" + userId + "/Medicamentos");

      get(medRef).then(snapshot => {
        if (snapshot.exists()) {
          const datos = snapshot.val();
          lista.innerHTML = "";
          for (let medKey in datos) {
            const med = datos[medKey];

            const li = document.createElement("li");
            const titleMed = document.createElement("h3");
            titleMed.textContent = med.NombreMed;

            const medInfo = document.createElement("p");
            // Agregando las dosis programadas para mostrar
            let dosisInfo = "Dosis programadas: ";
            if (med.Dosis) {
                for (let doseNum in med.Dosis) {
                    const doseTime = new Date(med.Dosis[doseNum]); // Convertir la cadena ISO a objeto Date
                    // Formatear para mostrar de forma legible (ej. "HH:MM DD/MM/YYYY")
                    const formattedDoseTime = `${String(doseTime.getUTCHours()).padStart(2, '0')}:${String(doseTime.getUTCMinutes()).padStart(2, '0')} ${String(doseTime.getUTCDate()).padStart(2, '0')}/${String(doseTime.getUTCMonth() + 1).padStart(2, '0')}/${doseTime.getUTCFullYear()}`;
                    dosisInfo += `${doseNum}: ${formattedDoseTime}; `;
                }
            } else {
                dosisInfo += "No programadas.";
            }

            medInfo.textContent = `Cada ${med.Horas} hrs - Compartimiento No. ${med.NoCom}. ${dosisInfo}`;
            //li.textContent = `${med.NombreMed} - cada ${med.Horas} hrs - compartimiento ${med.NoCom}`;
            li.appendChild(titleMed);
            li.appendChild(medInfo)
            lista.appendChild(li);
          }
        } else {
          lista.innerHTML = "<li>No hay medicamentos registrados.</li>";
        }
        if (scriptStatusLista) {
          scriptStatusLista.textContent = "Medicamentos cargados!";
          scriptStatusLista.style.color = 'yellowgreen';
        }
      }).catch(err => {
        console.error("Error al cargar medicamentos:", err);
        if (scriptStatusLista) {
          scriptStatusLista.textContent = "Error al cargar meds: " + err.message;
          scriptStatusLista.style.color = 'red';
        }
      });
    }); // Cierre del onAuthStateChanged para isListaPage
  } // Cierre del if (isListaPage)

}); // Cierre del document.addEventListener('DOMContentLoaded')
