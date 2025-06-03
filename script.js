// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el path de la URL actual para saber en qué página estamos
  const path = window.location.pathname;
  // Ajusta "/DAW-Pastillero/" a la raíz de tu GH Pages si es diferente
  // Considera que si estás en el root de GitHub Pages, la ruta podría ser solo "/"
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

    // NOTA IMPORTANTE: Para la página de INDEX, ya NO hacemos una redirección automática
    // si el usuario ya está logueado. Permite que el usuario siempre vea la pantalla de login.
    // La redirección a registro.html solo ocurrirá DESPUÉS de un login exitoso.
    // El onAuthStateChanged se elimina o comenta aquí para este propósito.

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
            // Redireccionamos AQUI, DESPUÉS del login exitoso.
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
            // Después del registro, no redirigimos automáticamente.
            // El usuario debe hacer clic en "Iniciar Sesión" con sus nuevas credenciales.
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

          const nombre = document.getElementById("nombre").value;
          const horas = parseInt(document.getElementById("horas").value); // Intervalo en horas
          const noCom = parseInt(document.getElementById("noCom").value);
          const dosisTotal = parseInt(document.getElementById("dosis").value); // Cantidad total de dosis
          const fechaPrimeraStr = document.getElementById("fechaPrimera").value; // 'YYYY-MM-DD'
          const horaPrimeraStr = document.getElementById("horaPrimera").value;   // 'HH:MM'

          // Validaciones
          if (!nombre || isNaN(horas) || isNaN(noCom) || isNaN(dosisTotal) || !fechaPrimeraStr || !horaPrimeraStr) {
              alert("Por favor, rellena todos los campos correctamente.");
              return;
          }
          if (dosisTotal <= 0 || horas <= 0) {
              alert("Las dosis total y el intervalo de horas deben ser mayores a cero.");
              return;
          }

          // Construir el objeto Date para la primera toma
          // La zona horaria 'Z' al final del formato ISO 8601 indica UTC.
          // Para evitar problemas con zonas horarias, es mejor trabajar con UTC si es posible
          // o al menos ser consistente. Aquí usaremos el método setUTCFullYear, etc.
          // para construirlo en UTC y luego formatearlo.

          const [year, month, day] = fechaPrimeraStr.split('-').map(Number);
          const [hour, minute] = horaPrimeraStr.split(':').map(Number);

          // Crear una fecha para la primera toma.
          // Ojo: month - 1 porque los meses en JavaScript son 0-indexados (0=Enero, 11=Diciembre)
          let currentDoseTime = new Date(Date.UTC(year, month - 1, day, hour, minute, 0)); // Segundos en 00

          const dosisProgramadas = {}; // Objeto para almacenar las dosis calculadas

          for (let i = 1; i <= dosisTotal; i++) {
              // Formatear a ISO 8601: YYYY-MM-DDTHH:MM:SSZ
              // Para obtener la parte 'YYYY-MM-DDTHH:MM:SSZ' directamente de un objeto Date
              // usamos toISOString().slice(0, 19) + 'Z';
              // Sin embargo, toISOString() ya devuelve UTC, así que solo necesitamos la Z.
              // Asegurémonos de que los segundos siempre sean '00'
              const formattedDate = currentDoseTime.toISOString(); // Ej: "2025-06-03T17:30:00.000Z"
              // Cortar milisegundos y asegurar 'Z'
              const finalFormattedDose = formattedDate.substring(0, 19) + 'Z';

              dosisProgramadas[i.toString()] = finalFormattedDose;

              // Calcular la siguiente toma: añadir el intervalo de horas
              currentDoseTime.setUTCHours(currentDoseTime.getUTCHours() + horas);
          }

          const data = {
            NombreMed: nombre,
            Horas: horas.toString(), // Intervalo en horas (string)
            NoCom: noCom.toString(),
            DosisTotal: dosisTotal.toString(), // Cantidad total de dosis (string)
            Nota: "",
            Dosis: dosisProgramadas // El nuevo nodo con las dosis programadas
          };

          try {
            await set(ref(db, "Usuarios/" + userId + "/medicamentos/" + nombre), data);
            alert("Medicamento guardado con éxito!");
            if (scriptStatusRegistro) {
              scriptStatusRegistro.textContent = "Medicamento guardado!";
              scriptStatusRegistro.style.color = 'green';
            }
            // Limpiar el formulario
            document.getElementById("nombre").value = "";
            document.getElementById("horas").value = "";
            document.getElementById("noCom").value = "";
            document.getElementById("dosis").value = "";
            document.getElementById("fechaPrimera").value = "";
            document.getElementById("horaPrimera").value = "";

            window.location.href = "lista.html";

          } catch (err) {
            alert("Error al guardar medicamento: " + err.message);
            console.error("Error al guardar:", err);
            if (scriptStatusRegistro) {
              scriptStatusRegistro.textContent = "Error al guardar: " + err.message;
              scriptStatusRegistro.style.color = 'red';
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

      const medRef = ref(db, "DataBase/" + userId + "/Medicamentos");

      get(medRef).then(snapshot => {
        if (snapshot.exists()) {
          const datos = snapshot.val();
          lista.innerHTML = "";
          for (let medKey in datos) {
            const med = datos[medKey];
            const li = document.createElement("li");
            li.textContent = `${med.NombreMed} - cada ${med.Horas} hrs - compartimiento ${med.NoCom}`;
            lista.appendChild(li);
          }
        } else {
          lista.innerHTML = "<li>No hay medicamentos registrados.</li>";
        }
        if (scriptStatusLista) {
          scriptStatusLista.textContent = "Medicamentos cargados!";
          scriptStatusLista.style.color = 'green';
        }
      }).catch(err => {
        console.error("Error al cargar medicamentos:", err);
        if (scriptStatusLista) {
          scriptStatusLista.textContent = "Error al cargar meds: " + err.message;
        }
      });
    }); // Cierre del onAuthStateChanged para isListaPage
  } // Cierre del if (isListaPage)

}); // Cierre del document.addEventListener('DOMContentLoaded')
