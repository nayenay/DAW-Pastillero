// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js'; // Asegúrate de que db también se importa
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el path de la URL actual para saber en qué página estamos
  // Usamos .includes() para ser más flexibles con las rutas de GitHub Pages
  const path = window.location.pathname;
  const isIndexPage = path.endsWith("index.html") || path === "/DAW-Pastillero/" || path === "/DAW-Pastillero/index.html"; // Ajusta "/DAW-Pastillero/" a la raíz de tu GH Pages si es diferente
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

    // Check auth state for the login page specifically
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is logged in and on the index page, redirect to registro.html
        window.location.href = "registro.html";
      }
      // If user is not logged in, remain on this page to allow login/registration
    });

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
            // Redirección manejada por el onAuthStateChanged de arriba
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
            // No redirigimos aquí. Dejamos que el usuario inicie sesión manualmente.
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
  }

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA REGISTRO.HTML
  // -------------------------------------------------------------
  if (isRegistroPage) {
    // Asegurarse de que el usuario esté logueado para acceder a esta página
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Si no hay usuario, redirigir al login
        window.location.href = "index.html";
        return; // Detener la ejecución del script para esta página
      }

      // Si hay usuario, habilitar la funcionalidad de guardar medicamento
      const guardarBtn = document.getElementById("guardarBtn");

      if (guardarBtn) {
        guardarBtn.addEventListener("click", async () => {
          // El 'user' ya está disponible desde el onAuthStateChanged
          const nombre = document.getElementById("nombre").value;
          const horas = parseInt(document.getElementById("horas").value);
          const noCom = parseInt(document.getElementById("noCom").value);
          const dosis = parseInt(document.getElementById("dosis").value);
          const primera = document.getElementById("primera").value; // Formato HH:MM

          // Validación básica
          if (!nombre || isNaN(horas) || isNaN(noCom) || isNaN(dosis) || !primera) {
              alert("Por favor, rellena todos los campos correctamente.");
              return;
          }

          const data = {
            NombreMed: nombre,
            Horas: horas.toString(),
            NoCom: noCom.toString(),
            DosisTotal: dosis.toString(),
            PrimeraTomaH: primera.split(':')[0],
            PrimeraTomaM: primera.split(':')[1],
            Dias: "4", // Ejemplo, si siempre es 4 o necesitas un input para esto
            Nota: "",
          };

          const correoId = user.email.replace(".", "_");
          try {
            await set(ref(db, "Usuarios/" + correoId + "/medicamentos/" + nombre), data);
            alert("Medicamento guardado con éxito!");
            if (scriptStatusRegistro) {
              scriptStatusRegistro.textContent = "Medicamento guardado!";
              scriptStatusRegistro.style.color = 'green';
            }
            // Opcional: Limpiar el formulario después de guardar
            document.getElementById("nombre").value = "";
            document.getElementById("horas").value = "";
            document.getElementById("noCom").value = "";
            document.getElementById("dosis").value = "";
            document.getElementById("primera").value = "";

            // Redirigir a la lista después de guardar (buena UX)
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

    // Asegurarse de que el usuario esté logueado para acceder a esta página
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Si no hay usuario, redirigir al login
        window.location.href = "index.html";
        return; // Detener la ejecución del script para esta página
      }

      // Si hay usuario, cargar la lista de medicamentos
      const correoId = user.email.replace(".", "_");
      const medRef = ref(db, "Usuarios/" + correoId + "/medicamentos");

      get(medRef).then(snapshot => {
        if (snapshot.exists()) {
          const datos = snapshot.val();
          lista.innerHTML = ""; // Limpiar la lista antes de añadir
          for (let medKey in datos) {
            const med = datos[medKey]; // Obtener el objeto medicamento
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
          scriptStatusLista.style.color = 'red';
        }
      });
    });
  }
});
