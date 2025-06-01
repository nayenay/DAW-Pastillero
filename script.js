// ... (código anterior sin cambios) ...

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
          // OBTENER EL UID DEL USUARIO
          const userId = user.uid; // <-- AQUÍ SE OBTIENE EL UID

          const nombre = document.getElementById("nombre").value;
          const horas = parseInt(document.getElementById("horas").value);
          const noCom = parseInt(document.getElementById("noCom").value);
          const dosis = parseInt(document.getElementById("dosis").value);
          const primera = document.getElementById("primera").value;

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

          // MODIFICAR LA RUTA DE LA BASE DE DATOS PARA USAR EL UID
          try {
            await set(ref(db, "Usuarios/" + userId + "/medicamentos/" + nombre), data); // <-- RUTA CAMBIADA
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

      // OBTENER EL UID DEL USUARIO TAMBIÉN PARA LA LISTA
      const userId = user.uid; // <-- AQUÍ SE OBTIENE EL UID

      const medRef = ref(db, "Usuarios/" + userId + "/medicamentos"); // <-- RUTA CAMBIADA

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
