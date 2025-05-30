// Importa las funciones de autenticación y la configuración de Firebase
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
  // Obtén referencias a los elementos HTML por su ID
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  // Agrega el evento de clic al botón de Iniciar Sesión
  if (loginBtn) { // Verifica que el botón existe (es bueno para scripts compartidos)
    loginBtn.addEventListener("click", () => {
      const email = emailInput.value;
      const password = passwordInput.value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Inicio de sesión exitoso
          console.log("Usuario ha iniciado sesión:", userCredential.user.email);
          // Redirige a la página de registro de medicamentos
          window.location.href = "registro.html";
        })
        .catch(err => {
          // Manejo de errores de inicio de sesión
          alert("Error al iniciar sesión: " + err.message);
          console.error("Error de inicio de sesión:", err);
        });
    });
  }

  // Agrega el evento de clic al botón de Registrarse
  if (registerBtn) { // Verifica que el botón existe
    registerBtn.addEventListener("click", () => {
      const email = emailInput.value;
      const password = passwordInput.value;

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Registro exitoso
          alert("Registrado con éxito. ¡Ya puedes iniciar sesión!");
          console.log("Nuevo usuario registrado:", userCredential.user.email);
          // Opcional: Podrías redirigir directamente o mantener al usuario en la página de login
          // window.location.href = "registro.html";
        })
        .catch(err => {
          // Manejo de errores de registro
          alert("Error al registrarse: " + err.message);
          console.error("Error de registro:", err);
        });
    });
  }
});
