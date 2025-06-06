// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get, remove, update } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Asegúrate de que el DOM esté completamente cargado antes de intentar acceder a los elementos
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el path de la URL actual para saber en qué página estamos
    const path = window.location.pathname;
    const isIndexPage = path.endsWith("index.html") || path === "/DAW-Pastillero/" || path === "/DAW-Pastillero/index.html";
    const isRegistroPage = path.endsWith("registro.html") || path === "/DAW-Pastillero/registro.html";
    const isListaPage = path.endsWith("lista.html") || path === "/DAW-Pastillero/lista.html";
    const isMonitoreoPage = path.endsWith("monitoreo.html") || path === "/DAW-Pastillero/monitoreo.html"; // Nueva página

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
                    const horaPrimeraStr = horaPrimeraInput.value;   // 'HH:MM'

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
            
                    // --- Lógica para PRE-CALCULAR TODAS LAS DOSIS ---
                    const [year, month, day] = fechaPrimeraStr.split('-').map(Number);
                    const [hour, minute] = horaPrimeraStr.split(':').map(Number);
                    
                    let currentDoseTime = new Date(Date.UTC(year, month - 1, day, hour, minute, 0)); // Hora UTC

                    const dosisProgramadas = {}; // Objeto para almacenar todas las dosis programadas

                    for (let i = 0; i < dosisTotal; i++) { // Iterar hasta dosisTotal
                        const scheduledDoseIso = currentDoseTime.toISOString().substring(0, 19) + 'Z';
                        
                        // Guardar la dosis programada con su estado inicial
                        dosisProgramadas[scheduledDoseIso] = {
                            scheduled: scheduledDoseIso,
                            taken_at: null,
                            status_code: 0 // 0 para pendiente
                        };

                        // Calcular la siguiente toma: añadir el intervalo de horas
                        currentDoseTime.setUTCHours(currentDoseTime.getUTCHours() + horas);
                    }

                    const data = {
                        NombreMed: nombre,
                        Horas: horas.toString(),
                        NoCom: noCom.toString(),
                        DosisTotal: dosisTotal.toString(),
                        Nota: "",
                        Dosis: dosisProgramadas // Todas las dosis pre-calculadas
                    };

                    try {
                        await set(ref(db, "DataBase/" + userId + "/Medicamentos/" + nombre), data); 
                        alert("Medicamento registrado con éxito! Todas las dosis programadas.");
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

    // Función auxiliar para calcular el estado de la dosis (para monitoreo y lista)
    function getDoseStatus(scheduledTimeIso, actualTakenTimeIso) {
        const scheduledDate = new Date(scheduledTimeIso);
        const actualTakenDate = actualTakenTimeIso ? new Date(actualTakenTimeIso) : null;
        const now = new Date(); // Hora actual local
        const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
                                          now.getHours(), now.getMinutes(), now.getSeconds()));

        if (actualTakenDate) { // Si ya se tomó
            // Diferencia en milisegundos entre la toma real y la programada
            const diffMs = Math.abs(actualTakenDate.getTime() - scheduledDate.getTime());
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours <= 1) { // Menos de 1 hora de diferencia
                return { status: 1, colorClass: 'dosis-blue', text: 'Tomada a tiempo' };
            } else { // Más de 1 hora de diferencia
                return { status: 2, colorClass: 'dosis-purple', text: 'Tomada con retraso' };
            }
        } else { // Si no se ha tomado
            if (scheduledDate.getTime() < nowUtc.getTime()) {
                return { status: 0, colorClass: 'dosis-gray', text: 'Pendiente (atrasada)' }; // Dosis en el pasado
            } else {
                return { status: 0, colorClass: 'dosis-gray', text: 'Pendiente (futura)' }; // Dosis en el futuro
            }
        }
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

        // =========================================================
        // === INICIO DE LA LÓGICA DEL MODAL DE EDICIÓN Y SUS FUNCIONES ===
        // =========================================================

        // Obtener referencias al modal y sus elementos
        const editModal = document.getElementById("editModal");
        // Verificar si el modal existe antes de intentar acceder a sus elementos
        if (editModal) { // Solo si estamos en lista.html y el modal está en el HTML
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
                        
                        // Recalcular TODAS las dosis si cambian Horas o DosisTotal para el nuevo medicamento
                        // Si el nombre cambia, es un medicamento nuevo. No arrastra el historial de dosis.
                        // Para simplificar, si cambia el nombre, solo copia las propiedades básicas.
                        const dosisProgramadasParaNuevo = {};
                        if (newHoras === parseInt(oldMedData.Horas) && newDosisTotal === parseInt(oldMedData.DosisTotal)) {
                            // Si solo cambia el nombre o NoCom, pero no la lógica de dosis, copiar Dosis
                            // Esto asume que la estructura de Dosis es compatible (clave=scheduled_time)
                            Object.assign(dosisProgramadasParaNuevo, oldMedData.Dosis); 
                        } else {
                            // Si horas o dosisTotal cambian, las dosis deben ser RECALCULADAS
                            // Esto es una simplificación: idealmente se pediría una nueva "primera toma" fecha/hora
                            // o se tomaría la primera dosis original como base. Aquí, reseteamos la programación.
                            // Esto implica que se perdería el historial de tomas si cambian estas propiedades clave.
                            alert("Advertencia: Al cambiar las horas o dosis total, la programación de dosis será reseteada.");
                            // Aquí podrías añadir una lógica para pedir la primera fecha/hora del nuevo ciclo
                            // Por ahora, solo se crea una dosis inicial si se resetea la programación.
                            // O podríamos obligar a que la edición solo cambie el nombre o NoCom.
                            // Por la complejidad, si cambian Horas/DosisTotal, el usuario deberá re-registrar.
                            // O se toma la primera dosis actual como base y se recalcula a partir de ahí.
                            // POR SIMPLICIDAD AHORA: Si cambian Horas/DosisTotal, no se arrastra el historial.
                            // El sistema actual no tiene un input de "primera toma" en el modal de edición,
                            // por lo que generar nuevas dosis sería arbitrario.
                            // UNA SOLUCIÓN MÁS ROBUSTA: Abrir el formulario de registro con datos pre-rellenados,
                            // o pedir la primera toma en el modal de edición si cambian Horas/DosisTotal.
                            // Por ahora, no recalcular las dosis. Mantener las existentes.
                        }


                        const newMedData = {
                            NombreMed: newNombre,
                            Horas: newHoras.toString(),
                            NoCom: newNoCom.toString(),
                            DosisTotal: newDosisTotal.toString(),
                            Nota: oldMedData.Nota || "", // Mantener la nota
                            Dosis: oldMedData.Dosis || {} // Mantener las dosis existentes
                        };
                        
                        await remove(medRef); // Eliminar el medicamento con el nombre antiguo
                        await set(ref(db, `DataBase/${user.uid}/Medicamentos/${newNombre}`), newMedData); // Guardar con el nuevo nombre
                    } else {
                        // Si el nombre no cambia, solo actualizamos los campos modificados
                        // Si Horas o DosisTotal cambian, NO recalculamos las dosis existentes.
                        // Esto se debe a que la lógica actual no tiene cómo determinar
                        // la nueva primera toma para recalcular.
                        // Para recalcular: necesitarías que el modal de edición tenga los campos de fecha/hora
                        // y que la lógica aquí sea similar a la de registro.
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
        } // Fin if (editModal)

        // =========================================================
        // === FIN DE LA LÓGICA DEL MODAL DE EDICIÓN ===
        // =========================================================


        // Función para registrar que se tomó una dosis
        async function registrarDosisTomada(userId, medicamentoNombre) { // Ya no necesitamos 'dosisPrevias'
            const user = auth.currentUser;
            if (!user) {
                alert("Debe iniciar sesión para registrar dosis.");
                window.location.href = "index.html";
                return;
            }

            const medRef = ref(db, "DataBase/" + userId + "/Medicamentos/" + medicamentoNombre);
            try {
                const snapshot = await get(medRef);
                if (!snapshot.exists()) {
                    alert("Medicamento no encontrado.");
                    return;
                }
                const medData = snapshot.val();
                let { Dosis, Horas, DosisTotal } = medData;
                Horas = parseInt(Horas); 
                DosisTotal = parseInt(DosisTotal);

                // --- Lógica para encontrar la dosis pendiente y actualizarla ---
                let targetDoseKey = null;
                let targetScheduledTime = null;

                const dosisEntries = Object.entries(Dosis || {}).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()); // Ordenar por fecha programada
                const now = new Date(); // Hora actual de la toma
                const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
                                                  now.getHours(), now.getMinutes(), now.getSeconds())); // Hora actual UTC

                // Encontrar la primera dosis pendiente cuyo tiempo programado sea pasado o actual
                for (const [scheduledIso, doseObj] of dosisEntries) {
                    if (doseObj.status_code === 0) { // Si está pendiente
                        const scheduledDate = new Date(scheduledIso);
                        if (scheduledDate.getTime() <= nowUtc.getTime() + (5 * 60 * 1000)) { // Dar un margen de 5 min para "a tiempo" en dosis pasadas/actuales
                            targetDoseKey = scheduledIso;
                            targetScheduledTime = scheduledDate;
                            break;
                        }
                    }
                }

                // Si no se encontró una dosis pendiente que sea pasada/actual, buscar la primera futura pendiente
                if (!targetDoseKey) {
                    for (const [scheduledIso, doseObj] of dosisEntries) {
                        if (doseObj.status_code === 0) {
                            const scheduledDate = new Date(scheduledIso);
                            if (scheduledDate.getTime() > nowUtc.getTime()) {
                                targetDoseKey = scheduledIso;
                                targetScheduledTime = scheduledDate;
                                break;
                            }
                        }
                    }
                }
                
                // Si no hay ninguna dosis pendiente (todas tomadas o no hay), salir
                if (!targetDoseKey) {
                    if (Object.keys(Dosis).length >= DosisTotal) { // Todas las dosis ya están registradas como tomadas
                         alert("Todas las dosis de " + medicamentoNombre + " ya han sido registradas.");
                    } else {
                         // Esto no debería pasar si DosisTotal se precalcula.
                         alert("No se encontró una dosis pendiente para registrar.");
                    }
                    return;
                }

                // Determinar el status_code (1: a tiempo, 2: retraso)
                let newStatusCode = 0;
                const diffMs = Math.abs(nowUtc.getTime() - targetScheduledTime.getTime());
                const diffMinutes = diffMs / (1000 * 60);

                if (diffMinutes <= 60) { // Tomada dentro de 1 hora de la programada
                    newStatusCode = 1; // A tiempo
                } else {
                    newStatusCode = 2; // Con retraso
                }

                // Construir las actualizaciones
                const updates = {};
                const dosePath = `/DataBase/${userId}/Medicamentos/${medicamentoNombre}/Dosis/${targetDoseKey}`;
                updates[dosePath + '/taken_at'] = nowUtc.toISOString().substring(0, 19) + 'Z';
                updates[dosePath + '/status_code'] = newStatusCode;
                
                // Aplicar todas las actualizaciones a la base de datos
                await update(ref(db, '/'), updates);

                alert(`Dosis de ${medicamentoNombre} registrada con éxito! Estado: ${newStatusCode === 1 ? 'A tiempo' : 'Con retraso'}.`);
                cargarMedicamentos(userId); // Recargar la lista después de la operación
                if (scriptStatusLista) {
                    scriptStatusLista.textContent = `Dosis de ${medicamentoNombre} registrada!`;
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
            const medRef = ref(db, "DataBase/" + userId + "/Medicamentos"); // Asegúrate de que esta ruta sea correcta
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
                            // Llama a la función para abrir el modal, pasándole los datos del medicamento
                            openEditModal(med, medKey); // `med` es el objeto medicamento actual, `medKey` es su nombre
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
                            await registrarDosisTomada(userId, medKey); // Ya no necesitamos 'dosisPrevias'
                        });
                        optionsMenu.appendChild(takeDoseBtn);

                        // Enlace a la nueva página de monitoreo
                        const monitorBtn = document.createElement("button");
                        monitorBtn.textContent = "Ver Monitoreo";
                        monitorBtn.addEventListener('click', () => {
                            window.location.href = "monitoreo.html"; // Redirige a la página de monitoreo
                            closeAllMenus();
                        });
                        optionsMenu.appendChild(monitorBtn);

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

                        if (med.Dosis) {
                            const dosisEntries = Object.entries(med.Dosis).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()); // Ordenar por fecha programada
                            let proximaDosisEncontrada = null;

                            // Buscar la primera dosis pendiente (status_code: 0) cuyo scheduled time es futuro o actual
                            for (const [scheduledIso, doseObj] of dosisEntries) {
                                const scheduledDate = new Date(scheduledIso);
                                if (doseObj.status_code === 0 && scheduledDate.getTime() >= nowUtc.getTime()) {
                                    proximaDosisEncontrada = scheduledDate;
                                    break;
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
                                // Si no hay dosis futuras pendientes, verificar si todas las dosis han sido tomadas
                                const dosesTakenCount = Object.values(med.Dosis).filter(d => d.status_code === 1 || d.status_code === 2).length;
                                if (dosesTakenCount >= parseInt(med.DosisTotal)) {
                                    proximaDosisTexto = "Todas las dosis completadas.";
                                } else {
                                    // Esto ocurriría si hay dosis pendientes, pero todas están en el pasado.
                                    proximaDosisTexto = "Próxima dosis: ¡Dosis atrasada!";
                                    // Opcional: mostrar la dosis atrasada más próxima
                                    const firstMissedDose = dosisEntries.find(([iso, obj]) => obj.status_code === 0 && new Date(iso).getTime() < nowUtc.getTime());
                                    if (firstMissedDose) {
                                        const missedDate = new Date(firstMissedDose[0]);
                                        const displayHour = String(missedDate.getHours()).padStart(2, '0');
                                        const displayMinute = String(missedDate.getMinutes()).padStart(2, '0');
                                        const displayDay = String(missedDate.getDate()).padStart(2, '0');
                                        const displayMonth = String(missedDate.getMonth() + 1).padStart(2, '0');
                                        const displayYear = missedDate.getFullYear();
                                        proximaDosisTexto += ` (${displayHour}:${displayMinute} ${displayDay}/${displayMonth}/${displayYear})`;
                                    }
                                }
                            }
                        } else {
                            proximaDosisTexto = "No hay dosis programadas.";
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

    // -------------------------------------------------------------
    // LÓGICA ESPECÍFICA PARA MONITOREO.HTML (NUEVO)
    // -------------------------------------------------------------
    if (isMonitoreoPage) {
        const monitoreoContainer = document.getElementById("monitoreo-lista"); // Asume un ul/div en monitoreo.html
        
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = "index.html";
                return;
            }

            const userId = user.uid;
            const medRef = ref(db, `DataBase/${userId}/Medicamentos`);

            monitoreoContainer.innerHTML = ""; // Limpiar la lista al cargar

            try {
                const snapshot = await get(medRef);
                if (snapshot.exists()) {
                    const medicamentos = snapshot.val();
                    const now = new Date(); // Hora actual local
                    const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
                                                      now.getHours(), now.getMinutes(), now.getSeconds())); // Hora actual UTC

                    for (let medKey in medicamentos) {
                        const med = medicamentos[medKey];

                        const medItemDiv = document.createElement("div");
                        medItemDiv.classList.add("medicamento-container"); // Usar clase de estilo de monitoreo

                        const medTitle = document.createElement("h2");
                        medTitle.classList.add("medicamento-title");
                        medTitle.textContent = med.NombreMed;
                        medItemDiv.appendChild(medTitle);

                        const dosisRow = document.createElement("div");
                        dosisRow.classList.add("dosis-row");

                        if (med.Dosis) {
                            // Obtener todas las dosis (keys son las fechas programadas) y ordenarlas
                            const dosisEntries = Object.entries(med.Dosis).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

                            for (const [scheduledIso, doseObj] of dosisEntries) {
                                const dosisCircle = document.createElement("div");
                                dosisCircle.classList.add("dosis-circle");

                                const { colorClass, text } = getDoseStatus(scheduledIso, doseObj.taken_at);
                                dosisCircle.classList.add(colorClass);
                                dosisCircle.title = `${med.NombreMed} - Programada: ${new Date(scheduledIso).toLocaleString()} - ${text}`; // Tooltip

                                dosisRow.appendChild(dosisCircle);
                            }
                        } else {
                            const noDosesText = document.createElement('p');
                            noDosesText.textContent = 'No hay dosis programadas.';
                            dosisRow.appendChild(noDosesText);
                        }
                        
                        medItemDiv.appendChild(dosisRow);
                        monitoreoContainer.appendChild(medItemDiv);
                    }
                } else {
                    monitoreoContainer.innerHTML = "<p>No hay medicamentos registrados para monitorear.</p>";
                }
            } catch (error) {
                console.error("Error al cargar monitoreo:", error);
                monitoreoContainer.innerHTML = `<p style="color:red;">Error al cargar el monitoreo: ${error.message}</p>`;
            }
        });
    } // Cierre del if (isMonitoreoPage)


}); // Cierre del document.addEventListener('DOMContentLoaded')
