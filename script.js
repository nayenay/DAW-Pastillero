// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js'; // Asegúrate de que db también se importa
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js'; // Importar ref, set, get

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el path de la URL actual para saber en qué página estamos
  const path = window.location.pathname;

  // Lógica de Depuración Global
  const scriptStatusIndex = document.getElementById("scriptStatus");
  const scriptStatusRegistro = document.getElementById("scriptStatusRegistro");
  const scriptStatusLista = document.getElementById("scriptStatusLista");

  if (scriptStatusIndex) scriptStatusIndex.textContent = "Script principal ejecutándose en Index...";
  if (scriptStatusRegistro) scriptStatusRegistro.textContent = "Script principal ejecutándose en Registro...";
  if (scriptStatusLista) scriptStatusLista.textContent = "Script principal ejecutándose en Lista...";

  // -------------------------------------------------------------
  // LÓGICA DE AUTENTICACIÓN GLOBAL (para todas las páginas)
  // -------------------------------------------------------------
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario logueado
      console.log("Usuario actual:", user.email);
      // Puedes mostrar un mensaje de bienvenida o un botón de logout si quieres
      if (path.endsWith("index.html") || path === "/") {
        // Si estamos en la página de login y el usuario ya está logueado, redirigir
        window.location.href = "registro.html";
      }
    } else {
      // No hay usuario logueado
      console.log("No hay usuario logueado.");
      // Redirigir a la página de login si no estamos ya en ella
      if (!path.endsWith("index.html") && path !== "/") {
        window.location.href = "index.html";
      }
    }
  });

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA INDEX.HTML (Login/Registro)
  // -------------------------------------------------------------
  if (path.endsWith("index.html") || path === "/") {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("Usuario ha iniciado sesión:", userCredential.user.email);
            // La redirección a registro.html se maneja por onAuthStateChanged
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
  }

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA REGISTRO.HTML
  // -------------------------------------------------------------
  if (path.endsWith("registro.html")) {
    const guardarBtn = document.getElementById("guardarBtn");

    if (guardarBtn) {
      guardarBtn.addEventListener("click", async () => { // Usamos async para await
        const user = auth.currentUser; // Obtener el usuario actual directamente
        if (!user) {
          alert("Debe iniciar sesión para registrar medicamentos.");
          window.location.href = "index.html"; // Redirigir si no hay usuario
          return;
        }

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
          NombreMed: nombre, // Coincidir con la estructura de tu DB (NombreMed)
          Horas: horas.toString(), // Guardar como string si en DB es string
          NoCom: noCom.toString(), // Guardar como string si en DB es string
          DosisTotal: dosis.toString(), // Guardar como string si en DB es string
          PrimeraTomaH: primera.split(':')[0], // Extraer la hora
          PrimeraTomaM: primera.split(':')[1], // Extraer los minutos
          // Agrega campos que falten si son necesarios en tu DB (Dias, Nota, etc.)
          Dias: "4", // Ejemplo, si siempre es 4 o necesitas un input para esto
          Nota: "",
          // Si tienes ultimaToma en la DB, asegúrate de añadirla aquí
          // ultimaToma: primera // Esto no lo veo en tus imágenes, pero si existe en tu app móvil, añádelo
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
  }

  // -------------------------------------------------------------
  // LÓGICA ESPECÍFICA PARA LISTA.HTML
  // -------------------------------------------------------------
  if (path.endsWith("lista.html")) {
    const lista = document.getElementById("lista");

    // onAuthStateChanged ya se encarga de la redirección si no hay usuario
    // Esta parte se ejecutará solo si hay un usuario logueado
    onAuthStateChanged(auth, (user) => {
      if (user) { // Asegurarse de que el usuario aún exista para obtener datos
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
      }
    });
  }
});
