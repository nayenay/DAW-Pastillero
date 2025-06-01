// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el path de la URL actual para saber en qué página estamos
  const path = window.location.pathname;
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
    // onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     // Si usuario está logueado, podríamos deshabilitar los campos o mostrar un mensaje,
    //     // pero NO redirigir automáticamente si el objetivo es SIEMPRE mostrar el login.
    //     // Por ejemplo:
    //     // emailInput.disabled = true;
    //     // passwordInput.disabled = true;
    //     // loginBtn.disabled = true;
    //     // registerBtn.disabled = true;
    //     // if (scriptStatusIndex) scriptStatusIndex.textContent = "Ya estás logueado como " + user.email;
    //   }
    // });

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
            // ¡AHORA REDIRIGIMOS AQUÍ, DESPUÉS DEL LOGIN EXITOSO!
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
          const nombre = document.getElementById("nombre").value;
          const horas = parseInt(document.getElementById("horas").value);
          const noCom = parseInt(document.getElementById("noCom").value);
          const dosis = parseInt(document.getElementById("dosis").value);
          const primera = document.getElementById("primera").value;

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
            document.getElementById("nombre").value = "";
            document.getElementById("horas").value = "";
            document.getElementById("noCom").value = "";
            document.getElementById("dosis").value = "";
            document.getElementById("primera").value = "";

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

      const correoId = user.email.replace(".", "_");
      const medRef = ref(db, "Usuarios/" + correoId + "/medicamentos");

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
          scriptStatusLista.style.color = 'red';
        }
      });
    });
  }
});
