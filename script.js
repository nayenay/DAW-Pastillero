// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get, remove, update } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js'; // Importar remove y update

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el path de la URL actual para saber en qué página estamos
    const path = window.location.pathname;
    const isIndexPage = path.endsWith("index.html") || path === "/DAW-Pastillero/" || path === "/DAW-Pastillero/index.html";
    const isRegistroPage = path.endsWith("registro.html") || path === "/DAW-Pastillero/registro.html";
    const isListaPage = path.endsWith("lista.html") || path === "/DAW-Pastillero/lista.html";

    // Lógica de Depuración Global (mantener para visibilidad)
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
                    const horaPrimeraStr = horaPrimeraInput.value;   // 'HH:MM'

                    // VALIDACIONES
                    if (nombre === ""){          
                        mostrarError(nombreInput,errNombre,"Este campo es obligatorio");
                        return;
                    }

                    if (horasInput.value.trim()===""){          
                        mostrarError(horasInput,errHoras,"Este campo es obligatorio"); 
                        return;          
                    } else if (isNaN(horas) || horas <= 0){
                        mostrarError(horasInput,errHoras,"Debe ingresar un número válido de horas (> 0)");
                        return;
                    }
                    
                    if (noComInput.value.trim()===""){          
                        mostrarError(noComInput,errNoCom,"Este campo es obligatorio"); 
                        return;        
                    } else if (isNaN(noCom) || noCom <= 0){
                        mostrarError(noComInput,errNoCom,"Debe ingresar un número de compartimiento válido (> 0)");
                        return;
                    }

                    if (dosisTotalInput.value.trim()===""){          
                        mostrarError(dosisTotalInput,errDosis,"Este campo es obligatorio");          
                        return;
                    } else if (isNaN(dosisTotal) || dosisTotal <= 0){
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
            
                    // --- Lógica para registrar la PRIMERA Dosis ---
                    const [year, month, day] = fechaPrimeraStr.split('-').map(Number);
                    const [hour, minute] = horaPrimeraStr.split(':').map(Number);
                    
                    // La primera dosis se programa con la hora y fecha dadas por el usuario.
                    let firstDoseTime = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
                    const firstFormattedDose = firstDoseTime.toISOString().substring(0, 19) + 'Z';

                    const dosisProgramadas = {}; // Objeto para almacenar la primera dosis (pendiente)
                    dosisProgramadas[firstFormattedDose] = 0; // Valor 0 indica que está pendiente

                    const data = {
                        NombreMed: nombre,
                        Horas: horas.toString(),
                        NoCom: noCom.toString(),
                        DosisTotal: dosisTotal.toString(),
                        DosisTomadas: 0, // Nuevo campo para llevar el conteo de dosis tomadas
                        Nota: "",
                        Dosis: dosisProgramadas // Solo la primera dosis se guarda inicialmente
                    };

                    try {
                        // Asegúrate de que la ruta 'DataBase' sea correcta
                        await set(ref(db, "DataBase/" + userId + "/Medicamentos/" + nombre), data); 
                        alert("Medicamento registrado con éxito! Primera dosis programada.");
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

        // Función para cerrar todos los menús desplegables
        function closeAllMenus() {
            document.querySelectorAll('.options-menu.active').forEach(menu => {
                menu.classList.remove('active');
            });
        }

        // Cierra los menús si se hace clic fuera de ellos
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.options-button') && !event.target.closest('.options-menu')) {
                closeAllMenus();
            }
        });
//-------------------------------------

        // =========================================================
        // === INICIO DE LA LÓGICA DEL MODAL DE EDICIÓN Y SUS FUNCIONES ===
        // =========================================================

        // Obtener referencias al modal y sus elementos
        const editModal = document.getElementById("editModal");
        const closeButton = editModal.querySelector(".close-button");
        const editNombreInput = document.getElementById("editNombre");
        const editHorasInput = document.getElementById("editHoras");
        const editNoComInput = document.getElementById("editNoCom");
        const editDosisTotalInput = document.getElementById("editDosisTotal");
        const saveEditBtn = document.getElementById("saveEditBtn");

        let currentEditingMedKey = null; // Para saber qué medicamento estamos editando

        // Función para abrir el modal
        function openEditModal(medData, medKey) {
            currentEditingMedKey = medKey;
            editNombreInput.value = medData.NombreMed;
            editHorasInput.value = medData.Horas;
            editNoComInput.value = medData.NoCom;
            editDosisTotalInput.value = medData.DosisTotal;
            editModal.style.display = "flex"; // Usar flex para centrar
        }

        // Función para cerrar el modal
        function closeEditModal() {
            editModal.style.display = "none";
            currentEditingMedKey = null;
        }

        // Eventos para cerrar el modal
        closeButton.addEventListener('click', closeEditModal);
        window.addEventListener('click', (event) => {
            if (event.target == editModal) {
                closeEditModal();
            }
        });

        // Event listener para el botón "Guardar Cambios" del modal
        saveEditBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user || !currentEditingMedKey) return;

            const newNombre = editNombreInput.value.trim();
            const newHoras = parseInt(editHorasInput.value.trim());
            const newNoCom = parseInt(editNoComInput.value.trim());
            const newDosisTotal = parseInt(editDosisTotalInput.value.trim());

            // Validación básica (puedes añadir más)
            if (!newNombre || isNaN(newHoras) || isNaN(newNoCom) || isNaN(newDosisTotal) || newHoras <=0 || newNoCom <=0 || newDosisTotal <=0) {
                alert("Por favor, rellena todos los campos del formulario de edición correctamente.");
                return;
            }

            const medRef = ref(db, `DataBase/${user.uid}/Medicamentos/${currentEditingMedKey}`);
            try {
                // Si el nombre del medicamento cambia, es un poco más complejo:
                // hay que borrar el viejo y crear uno nuevo con el nuevo nombre
                if (newNombre !== currentEditingMedKey) {
                    // Obtener los datos actuales para no perder Dosis y Nota
                    const snapshot = await get(medRef);
                    const oldMedData = snapshot.val();
                    const newMedData = {
                        ...oldMedData, // Copia datos existentes
                        NombreMed: newNombre,
                        Horas: newHoras.toString(),
                        NoCom: newNoCom.toString(),
                        DosisTotal: newDosisTotal.toString()
                    };
                    await remove(medRef); // Eliminar el medicamento con el nombre antiguo
                    await set(ref(db, `DataBase/${user.uid}/Medicamentos/${newNombre}`), newMedData); // Guardar con el nuevo nombre
                } else {
                    // Si el nombre no cambia, solo actualizamos los campos modificados
                    await update(medRef, {
                        NombreMed: newNombre,
                        Horas: newHoras.toString(),
                        NoCom: newNoCom.toString(),
                        DosisTotal: newDosisTotal.toString()
                    });
                }
                
                alert("Medicamento actualizado con éxito!");
                closeEditModal();
                cargarMedicamentos(user.uid); // Recargar la lista
            } catch (error) {
                alert("Error al actualizar medicamento: " + error.message);
                console.error("Error al actualizar:", error);
            }
        });

        // =========================================================
        // === FIN DE LA LÓGICA DEL MODAL DE EDICIÓN ===
        // =========================================================


        // Función para registrar que se tomó una dosis
        async function registrarDosisTomada(userId, medicamentoNombre, dosisPrevias) {
            const user = auth.currentUser;
            if (!user) {
                alert("Debe iniciar sesión para registrar dosis.");
                window.location.href = "index.html";
                return;
            }

            // Obtener el medicamento actual de la base de datos
            const medRef = ref(db, "DataBase/" + userId + "/Medicamentos/" + medicamentoNombre);
            try {
                const snapshot = await get(medRef);
                if (!snapshot.exists()) {
                    alert("Medicamento no encontrado.");
                    return;
                }
                const medData = snapshot.val();
                let { Dosis, DosisTomadas, DosisTotal, Horas } = medData;
                Horas = parseInt(Horas); // Asegurar que es un número para cálculos

                // Eliminar la dosis pendiente si existe
                // Encontrar la dosis pendiente más antigua (asumiendo que hay una)
                let dosisPendienteKey = null;
                const dosisKeys = Object.keys(Dosis).sort(); // Las fechas están ordenadas cronológicamente
                for (const key of dosisKeys) {
                    if (Dosis[key] === 0) { // Si el valor es 0, está pendiente
                        dosisPendienteKey = key;
                        break;
                    }
                }

                // Si encontramos una dosis pendiente, la eliminamos
                if (dosisPendienteKey) {
                    const oldDoseRef = ref(db, `DataBase/${userId}/Medicamentos/${medicamentoNombre}/Dosis/${dosisPendienteKey}`);
                    await remove(oldDoseRef);
                    console.log(`Dosis ${dosisPendienteKey} marcada como tomada y eliminada de pendientes.`);
                } else {
                    console.warn("No se encontró una dosis pendiente para marcar como tomada. Registrando nueva dosis.");
                }

                // Registrar la dosis tomada con la hora actual
                const now = new Date();
                const currentFormattedDose = now.toISOString().substring(0, 19) + 'Z';
                // Añadimos la dosis tomada con el valor 1 (tomada)
                const updates = {};
                updates[`/DataBase/${userId}/Medicamentos/${medicamentoNombre}/Dosis/${currentFormattedDose}`] = 1;

                // Incrementar el contador de dosis tomadas
                DosisTomadas = (DosisTomadas || 0) + 1;
                updates[`/DataBase/${userId}/Medicamentos/${medicamentoNombre}/DosisTomadas`] = DosisTomadas;

                // Calcular y programar la siguiente dosis si aún no se ha alcanzado la dosis total
                if (DosisTomadas < parseInt(DosisTotal)) {
                    // Obtener la hora de la última dosis tomada (la actual)
                    let nextDoseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                                                now.getHours(), now.getMinutes(), now.getSeconds());
                    // Añadir el intervalo de horas
                    nextDoseTime.setHours(nextDoseTime.getHours() + Horas);
                    const nextFormattedDose = nextDoseTime.toISOString().substring(0, 19) + 'Z';
                    updates[`/DataBase/${userId}/Medicamentos/${medicamentoNombre}/Dosis/${nextFormattedDose}`] = 0; // Nueva dosis pendiente
                    console.log("Siguiente dosis programada:", nextFormattedDose);
                } else {
                    alert("¡Has completado todas las dosis de " + medicamentoNombre + "!");
                    console.log("Todas las dosis de", medicamentoNombre, "han sido completadas.");
                }

                // Aplicar todas las actualizaciones a la base de datos en una sola operación
                await update(ref(db, '/'), updates);

                alert(`Dosis de ${medicamentoNombre} registrada con éxito!`);
                // Recargar la lista después de la operación
                cargarMedicamentos(userId); // Reutilizamos la función de carga
                if (scriptStatusLista) {
                    scriptStatusLista.textContent = "Dosis registrada!";
                    scriptStatusLista.style.color = 'yellowgreen';
                }

            } catch (error) {
                alert("Error al registrar dosis: " + error.message);
                console.error("Error al registrar dosis:", error);
                if (scriptStatusLista) {
                    scriptStatusLista.textContent = "Error al registrar dosis: " + error.message;
                    scriptStatusLista.style.color = 'red';
                }
            }
        }

        // Función para cargar y mostrar medicamentos
        async function cargarMedicamentos(userId) {
            const medRef = ref(db, "DataBase/" + userId + "/Medicamentos");
            lista.innerHTML = ""; // Limpiar la lista antes de cargar

            try {
                const snapshot = await get(medRef);
                if (snapshot.exists()) {
                    const datos = snapshot.val();
                    const now = new Date(); // Hora actual local
                    const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
                                                      now.getHours(), now.getMinutes(), now.getSeconds())); // Hora actual UTC

                    for (let medKey in datos) {
                        const med = datos[medKey];

                        const li = document.createElement("li");
                        li.classList.add("medicamento-item"); // Añadir clase para estilos

                        // Header para el título y el botón de opciones
                        const medHeader = document.createElement("div");
                        medHeader.classList.add("medicamento-header");

                        const titleMed = document.createElement("h3");
                        titleMed.textContent = med.NombreMed;
                        medHeader.appendChild(titleMed);

                        // Botón de opciones (tres puntos)
                        const optionsButton = document.createElement("button");
                        optionsButton.classList.add("options-button");
                        optionsButton.textContent = '...'; // Tres puntos Unicode o ASCII
                        optionsButton.dataset.medKey = medKey; // Guardar la clave del medicamento
                        optionsButton.addEventListener('click', (event) => {
                            event.stopPropagation(); // Evitar que el clic se propague al documento
                            closeAllMenus(); // Cierra otros menús abiertos


                            const listItem = event.target.closest('.medicamento-item'); // Encuentra el li padre
                            if (listItem) {
                            const menu = listItem.querySelector('.options-menu'); // Busca el menú dentro de ese li
                            if (menu) {
                                menu.classList.toggle('active'); // Alternar visibilidad
                                }
                            }
                        });
                        medHeader.appendChild(optionsButton);
                        li.appendChild(medHeader); // medHeader se añade a li

                        // Menú desplegable
                        const optionsMenu = document.createElement("div");
                        optionsMenu.classList.add("options-menu");

                        const editBtn = document.createElement("button");
                        editBtn.textContent = "Editar";
                        editBtn.addEventListener('click', () => {
                            closeAllMenus();
                            // Implementar lógica de edición aquí
                            openEditModal(med, medKey);
                        });
                        optionsMenu.appendChild(editBtn);

                        const deleteBtn = document.createElement("button");
                        deleteBtn.textContent = "Borrar";
                        deleteBtn.addEventListener('click', async () => {
                            if (confirm("¿Estás seguro de que quieres borrar " + med.NombreMed + "?")) {
                                try {
                                    await remove(ref(db, `DataBase/${userId}/Medicamentos/${medKey}`));
                                    alert(med.NombreMed + " borrado con éxito.");
                                    cargarMedicamentos(userId); // Recargar la lista
                                    closeAllMenus();
                                } catch (error) {
                                    alert("Error al borrar medicamento: " + error.message);
                                    console.error("Error al borrar:", error);
                                }
                            }
                        });
                        optionsMenu.appendChild(deleteBtn);

                        const takeDoseBtn = document.createElement("button");
                        takeDoseBtn.textContent = "Dosis tomada";
                        takeDoseBtn.addEventListener('click', async () => {
                            closeAllMenus();
                            await registrarDosisTomada(userId, medKey, med.Dosis);
                        });
                        optionsMenu.appendChild(takeDoseBtn);
                        li.appendChild(optionsMenu);

                        // Información del medicamento (debajo del header)
                        const medInfoHoras = document.createElement("p");
                        medInfoHoras.textContent = `Cada ${med.Horas} hrs`;
                        li.appendChild(medInfoHoras);

                        const medInfoCompartimiento = document.createElement("p");
                        medInfoCompartimiento.textContent = `Compartimiento No. ${med.NoCom}`;
                        li.appendChild(medInfoCompartimiento);

                        const medInfoProximaDosis = document.createElement("p");
                        let proximaDosisTexto = "Próxima dosis: No programada";

                        if (med.Dosis && med.DosisTomadas < parseInt(med.DosisTotal)) {
                            // Obtener las claves (que ahora son las fechas) y ordenarlas
                            const dosisKeys = Object.keys(med.Dosis).sort();
                            let proximaDosisEncontrada = null;

                            // Buscar la primera dosis pendiente (valor 0)
                            for (const doseStr of dosisKeys) {
                                if (med.Dosis[doseStr] === 0) {
                                    proximaDosisEncontrada = new Date(doseStr);
                                    break;
                                }
                            }
                            
                            // Si no hay dosis pendiente pero aún no se han completado todas
                            // Esto podría pasar si el usuario llega a la página antes de que se calcule la siguiente
                            // o si la última pendiente ya es pasada y no se ha marcado.
                            // En un sistema real, podrías programar la próxima dosis si DosisTomadas < DosisTotal
                            // y no hay dosis pendientes (por ejemplo, al cargar la lista).
                            if (!proximaDosisEncontrada && med.DosisTomadas < parseInt(med.DosisTotal)) {
                                // Encuentra la última dosis tomada para calcular la siguiente
                                let ultimaDosisTomadaTime = null;
                                for (const key of dosisKeys) {
                                    if (med.Dosis[key] === 1) { // Buscar la última tomada
                                        ultimaDosisTomadaTime = new Date(key);
                                    }
                                }

                                if (ultimaDosisTomadaTime) {
                                     // Calcular la siguiente dosis basada en la última tomada
                                    let nextDoseTime = new Date(ultimaDosisTomadaTime.getFullYear(), ultimaDosisTomadaTime.getMonth(), ultimaDosisTomadaTime.getDate(),
                                                                ultimaDosisTomadaTime.getHours(), ultimaDosisTomadaTime.getMinutes(), ultimaDosisTomadaTime.getSeconds());
                                    nextDoseTime.setHours(nextDoseTime.getHours() + parseInt(med.Horas));
                                    
                                    // Solo mostrar si es futura o muy reciente
                                    if (nextDoseTime.getTime() >= nowUtc.getTime() - (5 * 60 * 1000)) { // 5 minutos de margen para que no desaparezca justo al segundo
                                        proximaDosisEncontrada = nextDoseTime;
                                    }
                                }
                            }


                            if (proximaDosisEncontrada) {
                                const displayHour = String(proximaDosisEncontrada.getHours()).padStart(2, '0');
                                const displayMinute = String(proximaDosisEncontrada.getMinutes()).padStart(2, '0');
                                const displayDay = String(proximaDosisEncontrada.getDate()).padStart(2, '0');
                                const displayMonth = String(proximaDosisEncontrada.getMonth() + 1).padStart(2, '0');
                                const displayYear = proximaDosisEncontrada.getFullYear();
                                proximaDosisTexto = `Próxima dosis: ${displayHour}:${displayMinute} ${displayDay}/${displayMonth}/${displayYear}`;
                            } else {
                                if (med.DosisTomadas >= parseInt(med.DosisTotal)) {
                                     proximaDosisTexto = "Todas las dosis completadas.";
                                } else {
                                     proximaDosisTexto = "Próxima dosis: Calculando..."; // Caso intermedio
                                }
                            }
                        } else if (med.DosisTomadas >= parseInt(med.DosisTotal)) {
                            proximaDosisTexto = "Todas las dosis completadas.";
                        }
                        
                        medInfoProximaDosis.textContent = proximaDosisTexto;
                        li.appendChild(medInfoProximaDosis);
                        
                        lista.appendChild(li);
                    }
                } else {
                    lista.innerHTML = "<li>No hay medicamentos registrados.</li>";
                }
                if (scriptStatusLista) {
                    scriptStatusLista.textContent = "Medicamentos cargados!";
                    scriptStatusLista.style.color = 'yellowgreen';
                }
            } catch (err) {
                console.error("Error al cargar medicamentos:", err);
                if (scriptStatusLista) {
                    scriptStatusLista.textContent = "Error al cargar meds: " + err.message;
                    scriptStatusLista.style.color = 'red';
                }
            }
        }

        // Cargar medicamentos al iniciar la página de lista
        onAuthStateChanged(auth, (user) => {
            if (user) {
                cargarMedicamentos(user.uid);
            } else {
                window.location.href = "index.html";
            }
        });
    } // Cierre del if (isListaPage)

}); // Cierre del document.addEventListener('DOMContentLoaded')
