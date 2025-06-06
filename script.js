// Importa las funciones de autenticación y la configuración de Firebase
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref, set, get, remove, update } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// =========================================================
// === FUNCIONES AUXILIARES GLOBALES (compartidas entre lógicas de página) ===
// =========================================================

function mostrarError(inputElement, msgDivElement, mensaje) {
    if (inputElement) inputElement.classList.add("incorrecto");
    if (msgDivElement) {
        msgDivElement.textContent = mensaje;
        msgDivElement.style.display = "block";
    }
}

function getDoseStatus(scheduledTimeIso, actualTakenTimeIso) {
    const scheduledDate = new Date(scheduledTimeIso);
    const actualTakenDate = actualTakenTimeIso ? new Date(actualTakenTimeIso) : null;
    const now = new Date(); 
    const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
                                      now.getHours(), now.getMinutes(), now.getSeconds()));

    if (actualTakenDate) { 
        const diffMs = actualTakenDate.getTime() - scheduledDate.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes <= 60) { 
            return { status: 1, colorClass: 'dosis-blue', text: 'Tomada a tiempo' };
        } else { 
            return { status: 2, colorClass: 'dosis-purple', text: 'Tomada con retraso' };
        }
    } else { 
        if (scheduledDate.getTime() < nowUtc.getTime()) {
            return { status: 0, colorClass: 'dosis-gray', text: 'Pendiente (atrasada/omitida)' }; 
        } else {
            return { status: 0, colorClass: 'dosis-gray', text: 'Pendiente (futura)' }; 
        }
    }
}

// =========================================================
// === LÓGICA PRINCIPAL AL CARGAR EL DOM (modularizada por página) ===
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const isIndexPage = path.endsWith("index.html") || path === "/DAW-Pastillero/" || path === "/DAW-Pastillero/index.html";
    const isRegistroPage = path.endsWith("registro.html") || path === "/DAW-Pastillero/registro.html";
    const isListaPage = path.endsWith("lista.html") || path === "/DAW-Pastillero/lista.html";
    const isMonitoreoPage = path.endsWith("monitoreo.html") || path === "/DAW-Pastillero/monitoreo.html";

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
                if (!email || !password) { alert("Por favor, ingresa correo y contraseña."); return; }
                signInWithEmailAndPassword(auth, email, password)
                    .then(() => window.location.href = "registro.html")
                    .catch(err => { alert("Error al iniciar sesión: " + err.message); console.error("Error de inicio de sesión:", err); if (scriptStatusIndex) { scriptStatusIndex.textContent = "Error de Login: " + err.message; scriptStatusIndex.style.color = 'red'; } });
            });
        }
        if (registerBtn) {
            registerBtn.addEventListener("click", () => {
                const email = emailInput.value;
                const password = passwordInput.value;
                if (!email || !password) { alert("Por favor, ingresa correo y contraseña."); return; }
                if (password.length < 6) { alert("La contraseña debe tener al menos 6 caracteres."); return; }
                createUserWithEmailAndPassword(auth, email, password)
                    .then(() => alert("Registrado con éxito. ¡Ya puedes iniciar sesión!"))
                    .catch(err => { alert("Error al registrarse: " + err.message); console.error("Error de registro:", err); if (scriptStatusIndex) { scriptStatusIndex.textContent = "Error de Registro: " + err.message; scriptStatusIndex.style.color = 'red'; } });
            });
        }
    }

    // -------------------------------------------------------------
    // LÓGICA ESPECÍFICA PARA REGISTRO.HTML
    // -------------------------------------------------------------
    if (isRegistroPage) {
        onAuthStateChanged(auth, (user) => {
            if (!user) { window.location.href = "index.html"; return; }
            const guardarBtn = document.getElementById("guardarBtn");
            if (guardarBtn) {
                guardarBtn.addEventListener("click", async () => {
                    const userId = user.uid;
                    const nombreInput = document.getElementById("nombre");
                    const horasInput = document.getElementById("horas");
                    const noComInput = document.getElementById("noCom");
                    const dosisTotalInput = document.getElementById("dosis");
                    const fechaPrimeraInput = document.getElementById("fechaPrimera");
                    const horaPrimeraInput = document.getElementById("horaPrimera");

                    const errNombre = document.getElementById("msj-nombre");
                    const errHoras = document.getElementById("msj-horas");
                    const errNoCom = document.getElementById("msj-noCom");
                    const errDosis = document.getElementById("msj-dosis");
                    const errFecha = document.getElementById("msj-fecha");
                    const errHoraPrimera = document.getElementById("msj-horaP");

                    [nombreInput, horasInput, noComInput, dosisTotalInput, fechaPrimeraInput, horaPrimeraInput].forEach(e => e.classList.remove("incorrecto"));
                    [errNombre, errHoras, errNoCom, errDosis, errFecha, errHoraPrimera].forEach(e => { e.textContent = ""; e.style.display = "none"; });

                    const nombre = nombreInput.value.trim();
                    const horas = parseInt(horasInput.value.trim());
                    const noCom = parseInt(noComInput.value.trim());
                    const dosisTotal = parseInt(dosisTotalInput.value.trim());
                    const fechaPrimeraStr = fechaPrimeraInput.value;
                    const horaPrimeraStr = horaPrimeraInput.value;

                    if (nombre === "") { mostrarError(nombreInput, errNombre, "Este campo es obligatorio"); return; }
                    if (horasInput.value.trim() === "") { mostrarError(horasInput, errHoras, "Este campo es obligatorio"); return; } else if (isNaN(horas) || horas <= 0) { mostrarError(horasInput, errHoras, "Debe ingresar un número válido de horas (> 0)"); return; }
                    if (noComInput.value.trim() === "") { mostrarError(noComInput, errNoCom, "Este campo es obligatorio"); return; } else if (isNaN(noCom) || noCom <= 0) { mostrarError(noComInput, errNoCom, "Debe ingresar un número de compartimiento válido (> 0)"); return; }
                    if (dosisTotalInput.value.trim() === "") { mostrarError(dosisTotalInput, errDosis, "Este campo es obligatorio"); return; } else if (isNaN(dosisTotal) || dosisTotal <= 0) { mostrarError(dosisTotalInput, errDosis, "Debe ingresar una dosis total válida (> 0)"); return; }
                    if (fechaPrimeraInput.value === "") { mostrarError(fechaPrimeraInput, errFecha, "Seleccione una fecha"); return; }
                    if (horaPrimeraInput.value === "") { mostrarError(horaPrimeraInput, errHoraPrimera, "Seleccione una hora"); return; }

                    const [year, month, day] = fechaPrimeraStr.split('-').map(Number);
                    const [hour, minute] = horaPrimeraStr.split(':').map(Number);
                    let currentDoseTime = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

                    const dosisProgramadas = {};
                    for (let i = 0; i < dosisTotal; i++) {
                        const scheduledDoseIso = currentDoseTime.toISOString().substring(0, 19) + 'Z';
                        dosisProgramadas[scheduledDoseIso] = {
                            scheduled: scheduledDoseIso,
                            taken_at: null,
                            status_code: 0
                        };
                        currentDoseTime.setUTCHours(currentDoseTime.getUTCHours() + horas);
                    }

                    console.log("Dosis programadas generadas en registro:", dosisProgramadas);
                    console.log("Número de dosis generadas:", Object.keys(dosisProgramadas).length);

                    const data = {
                        NombreMed: nombre, Horas: horas.toString(), NoCom: noCom.toString(),
                        DosisTotal: dosisTotal.toString(), Nota: "", Dosis: dosisProgramadas
                    };

                    try {
                        await set(ref(db, "DataBase/" + userId + "/Medicamentos/" + nombre), data);
                        alert("Medicamento registrado con éxito! Todas las dosis programadas.");
                        if (scriptStatusRegistro) { scriptStatusRegistro.textContent = "Medicamento guardado!"; scriptStatusRegistro.style.color = 'greenyellow'; scriptStatusRegistro.style.backgroundColor = "rgba(203, 255, 203, 0.60)"; }
                        nombreInput.value = ""; horasInput.value = ""; noComInput.value = ""; dosisTotalInput.value = "";
                        fechaPrimeraInput.value = ""; horaPrimeraInput.value = "";
                        window.location.href = "lista.html";
                    } catch (err) {
                        alert("Error al guardar medicamento: " + err.message); console.error("Error al guardar:", err);
                        if (scriptStatusRegistro) { scriptStatusRegistro.textContent = "Error al guardar: " + err.message; scriptStatusRegistro.style.color = 'red'; scriptStatusRegistro.style.backgroundColor = "rgba(255, 135, 135, 0.60)"; }
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

        function closeAllMenus() {
            document.querySelectorAll('.options-menu.active').forEach(menu => {
                menu.classList.remove('active');
            });
        }
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.options-button') && !event.target.closest('.options-menu')) {
                closeAllMenus();
            }
        });

        // =========================================================
        // === LÓGICA DEL MODAL DE EDICIÓN Y SUS FUNCIONES ===
        // === INICIALIZACIÓN MÁS ROBUSTA ===
        // =========================================================
        let editModal, closeButton, editNombreInput, editHorasInput, editNoComInput, editDosisTotalInput, saveEditBtn;
        let currentEditingMedKey = null;

        // --- FUNCIONES DEL MODAL (Declaradas al inicio del scope isListaPage) ---
        function openEditModal(medData, medKey) {
            // Asegurarse de que el modal y sus inputs estén inicializados
            if (editModal && editNombreInput && editHorasInput && editNoComInput && editDosisTotalInput) {
                currentEditingMedKey = medKey;
                editNombreInput.value = medData.NombreMed;
                editHorasInput.value = medData.Horas;
                editNoComInput.value = medData.NoCom;
                editDosisTotalInput.value = medData.DosisTotal;
                editModal.style.display = "flex"; // Usar flex para centrar
            } else {
                console.error("Modal de edición o sus elementos no encontrados. Asegúrate de que el HTML del modal esté en lista.html y tenga los IDs correctos.");
                alert("Error: No se pudo abrir el formulario de edición. Intenta recargar la página.");
            }
        }

        function closeEditModal() {
            if (editModal) {
                editModal.style.display = "none";
                currentEditingMedKey = null;
            }
        }

        // --- INICIALIZACIÓN DE ELEMENTOS DEL MODAL Y SUS EVENTOS (Una vez que el DOM está listo) ---
        // Se asegura que editModal exista antes de intentar acceder a sus propiedades
        const modalElement = document.getElementById("editModal");
        if (modalElement) {
            editModal = modalElement; // Asignar a la variable de scope superior
            closeButton = editModal.querySelector(".close-button");
            editNombreInput = document.getElementById("editNombre");
            editHorasInput = document.getElementById("editHoras");
            editNoComInput = document.getElementById("editNoCom");
            editDosisTotalInput = document.getElementById("editDosisTotal");
            saveEditBtn = document.getElementById("saveEditBtn");

            if (closeButton) closeButton.addEventListener('click', closeEditModal);
            window.addEventListener('click', (event) => {
                if (event.target === editModal) { closeEditModal(); }
            });
            if (saveEditBtn) {
                saveEditBtn.addEventListener('click', async () => {
                    const user = auth.currentUser;
                    if (!user || !currentEditingMedKey) return;

                    const newNombre = editNombreInput.value.trim();
                    const newHoras = parseInt(editHorasInput.value.trim());
                    const newNoCom = parseInt(editNoComInput.value.trim());
                    const newDosisTotal = parseInt(editDosisTotalInput.value.trim());

                    if (!newNombre || isNaN(newHoras) || isNaN(newNoCom) || isNaN(newDosisTotal) || newHoras <= 0 || newNoCom <= 0 || newDosisTotal <= 0) {
                        alert("Por favor, rellena todos los campos del formulario de edición correctamente."); return;
                    }

                    const medRef = ref(db, `DataBase/${user.uid}/Medicamentos/${currentEditingMedKey}`);
                    try {
                        if (newNombre !== currentEditingMedKey) {
                            const snapshot = await get(medRef);
                            const oldMedData = snapshot.val();
                            const newMedData = {
                                NombreMed: newNombre, Horas: newHoras.toString(), NoCom: newNoCom.toString(),
                                DosisTotal: newDosisTotal.toString(), Nota: oldMedData.Nota || "", Dosis: oldMedData.Dosis || {}
                            };
                            await remove(medRef);
                            await set(ref(db, `DataBase/${user.uid}/Medicamentos/${newNombre}`), newMedData);
                        } else {
                            await update(medRef, {
                                NombreMed: newNombre, Horas: newHoras.toString(),
                                NoCom: newNoCom.toString(), DosisTotal: newDosisTotal.toString()
                            });
                        }
                        alert("Medicamento actualizado con éxito!");
                        closeEditModal();
                        cargarMedicamentos(user.uid);
                    } catch (error) {
                        alert("Error al actualizar medicamento: " + error.message); console.error("Error al actualizar:", error);
                    }
                });
            }
        } else {
            console.warn("Elemento 'editModal' no encontrado en lista.html. La funcionalidad de edición no estará disponible.");
        }
        // =========================================================
        // === FIN DE LA LÓGICA DEL MODAL DE EDICIÓN ===
        // =========================================================


        // Función para registrar que se tomó una dosis
        async function registrarDosisTomada(userId, medicamentoNombre) {
            const user = auth.currentUser;
            if (!user) { alert("Debe iniciar sesión para registrar dosis."); window.location.href = "index.html"; return; }
            const medRef = ref(db, "DataBase/" + userId + "/Medicamentos/" + medicamentoNombre);
            try {
                const snapshot = await get(medRef);
                if (!snapshot.exists()) { alert("Medicamento no encontrado."); return; }
                const medData = snapshot.val();
                let { Dosis, DosisTotal } = medData;
                DosisTotal = parseInt(DosisTotal);

                let targetScheduledIso = null;
                const dosisEntries = Object.entries(Dosis || {}).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()); 
                const now = new Date();
                const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()));

                for (const [scheduledIso, doseObj] of dosisEntries) {
                    if (doseObj.status_code === 0) { targetScheduledIso = scheduledIso; break; }
                }
                if (!targetScheduledIso) {
                    const dosesTakenCount = Object.values(Dosis).filter(d => d.status_code === 1 || d.status_code === 2).length;
                    if (dosesTakenCount >= DosisTotal) { alert("Todas las dosis de " + medicamentoNombre + " ya han sido registradas."); }
                    else { alert("No se encontró una dosis pendiente para registrar."); }
                    return;
                }

                const targetDoseObj = Dosis[targetScheduledIso];
                const scheduledDate = new Date(targetDoseObj.scheduled);

                let newStatusCode = 0;
                const diffMs = nowUtc.getTime() - scheduledDate.getTime();
                const diffMinutes = diffMs / (1000 * 60);

                if (diffMinutes <= 60) { newStatusCode = 1; } else { newStatusCode = 2; }

                const updates = {};
                const dosePath = `DataBase/${userId}/Medicamentos/${medicamentoNombre}/Dosis/${targetScheduledIso}`;
                updates[dosePath + '/taken_at'] = nowUtc.toISOString().substring(0, 19) + 'Z';
                updates[dosePath + '/status_code'] = newStatusCode;

                await update(ref(db, '/'), updates);

                alert(`Dosis de ${medicamentoNombre} registrada con éxito! Estado: ${newStatusCode === 1 ? 'A tiempo' : 'Con retraso'}.`);
                cargarMedicamentos(userId);
                if (scriptStatusLista) { scriptStatusLista.textContent = `Dosis de ${medicamentoNombre} registrada!`; scriptStatusLista.style.color = 'yellowgreen'; }

            } catch (error) {
                alert("Error al registrar dosis: " + error.message); console.error("Error al registrar dosis:", error);
                if (scriptStatusLista) { scriptStatusLista.textContent = "Error al registrar dosis: " + error.message; scriptStatusLista.style.color = 'red'; }
            }
        }

        // Función para cargar y mostrar medicamentos
        async function cargarMedicamentos(userId) {
            const medRef = ref(db, "DataBase/" + userId + "/Medicamentos");
            lista.innerHTML = "";

            try {
                const snapshot = await get(medRef);
                if (snapshot.exists()) {
                    const datos = snapshot.val();
                    const now = new Date();
                    const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()));

                    for (let medKey in datos) {
                        const med = datos[medKey];

                        const li = document.createElement("li");
                        li.classList.add("medicamento-item");

                        const medHeader = document.createElement("div");
                        medHeader.classList.add("medicamento-header");

                        const titleMed = document.createElement("h3");
                        titleMed.textContent = med.NombreMed;
                        medHeader.appendChild(titleMed);

                        const optionsButton = document.createElement("button");
                        optionsButton.classList.add("options-button");
                        optionsButton.textContent = '...';
                        optionsButton.dataset.medKey = medKey;
                        optionsButton.addEventListener('click', (event) => {
                            event.stopPropagation();
                            closeAllMenus();
                            const listItem = event.target.closest('.medicamento-item');
                            if (listItem) {
                                const menu = listItem.querySelector('.options-menu');
                                if (menu) { menu.classList.toggle('active'); }
                            }
                        });
                        medHeader.appendChild(optionsButton);
                        li.appendChild(medHeader);

                        const optionsMenu = document.createElement("div");
                        optionsMenu.classList.add("options-menu");

                        const editBtn = document.createElement("button");
                        editBtn.textContent = "Editar";
                        editBtn.addEventListener('click', () => {
                            closeAllMenus();
                            openEditModal(med, medKey); // openEditModal ahora está en el scope correcto
                        });
                        optionsMenu.appendChild(editBtn);

                        const deleteBtn = document.createElement("button");
                        deleteBtn.textContent = "Borrar";
                        deleteBtn.addEventListener('click', async () => {
                            if (confirm("¿Estás seguro de que quieres borrar " + med.NombreMed + "?")) {
                                try {
                                    await remove(ref(db, `DataBase/${userId}/Medicamentos/${medKey}`));
                                    alert(med.NombreMed + " borrado con éxito.");
                                    cargarMedicamentos(userId);
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
                            await registrarDosisTomada(userId, medKey);
                        });
                        optionsMenu.appendChild(takeDoseBtn);

                        const monitorBtn = document.createElement("button");
                        monitorBtn.textContent = "Ver Monitoreo";
                        monitorBtn.addEventListener('click', () => {
                            window.location.href = "monitoreo.html";
                            closeAllMenus();
                        });
                        optionsMenu.appendChild(monitorBtn);
                        li.appendChild(optionsMenu);

                        const medInfoHoras = document.createElement("p");
                        medInfoHoras.textContent = `Cada ${med.Horas} hrs`;
                        li.appendChild(medInfoHoras);

                        const medInfoCompartimiento = document.createElement("p");
                        medInfoCompartimiento.textContent = `Compartimiento No. ${med.NoCom}`;
                        li.appendChild(medInfoCompartimiento);

                        const medInfoProximaDosis = document.createElement("p");
                        let proximaDosisTexto = "Próxima dosis: No programada";

                        if (med.Dosis) {
                            const dosisEntries = Object.entries(med.Dosis).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
                            let proximaDosisEncontrada = null;

                            for (const [scheduledIso, doseObj] of dosisEntries) {
                                const scheduledDate = new Date(scheduledIso);
                                if (doseObj.status_code === 0 && scheduledDate.getTime() >= nowUtc.getTime() - (5 * 60 * 1000)) {
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
                                const dosesTakenCount = Object.values(med.Dosis).filter(d => d.status_code === 1 || d.status_code === 2).length;
                                if (dosesTakenCount >= parseInt(med.DosisTotal)) { proximaDosisTexto = "Todas las dosis completadas."; }
                                else {
                                    proximaDosisTexto = "Próxima dosis: ¡Dosis atrasada!";
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
                        } else { proximaDosisTexto = "No hay dosis programadas."; }

                        medInfoProximaDosis.textContent = proximaDosisTexto;
                        li.appendChild(medInfoProximaDosis);
                        lista.appendChild(li);
                    }
                } else { lista.innerHTML = "<li>No hay medicamentos registrados.</li>"; }
                if (scriptStatusLista) { scriptStatusLista.textContent = "Medicamentos cargados!"; scriptStatusLista.style.color = 'yellowgreen'; }
            } catch (err) {
                console.error("Error al cargar medicamentos:", err);
                if (scriptStatusLista) { scriptStatusLista.textContent = "Error al cargar meds: " + err.message; scriptStatusLista.style.color = 'red'; }
            }
        }

        onAuthStateChanged(auth, (user) => {
            if (user) { cargarMedicamentos(user.uid); } else { window.location.href = "index.html"; }
        });
    }

    // -------------------------------------------------------------
    // LÓGICA ESPECÍFICA PARA MONITOREO.HTML
    // -------------------------------------------------------------
    if (isMonitoreoPage) {
        const monitoreoContainer = document.getElementById("monitoreo-lista");
        onAuthStateChanged(auth, async (user) => {
            if (!user) { window.location.href = "index.html"; return; }
            const userId = user.uid;
            const medRef = ref(db, `DataBase/${userId}/Medicamentos`);
            monitoreoContainer.innerHTML = "";

            try {
                const snapshot = await get(medRef);
                if (snapshot.exists()) {
                    const medicamentos = snapshot.val();
                    for (let medKey in medicamentos) {
                        const med = medicamentos[medKey];
                        console.log(`Monitoreando ${med.NombreMed}. DosisTotal: ${med.DosisTotal}`);
                        console.log(`Dosis en DB para ${med.NombreMed}:`, med.Dosis);
                        console.log(`Número de entradas en Dosis:`, med.Dosis ? Object.keys(med.Dosis).length : 0);

                        const medItemDiv = document.createElement("div");
                        medItemDiv.classList.add("medicamento-container");

                        const medTitle = document.createElement("h2");
                        medTitle.classList.add("medicamento-title");
                        medTitle.textContent = med.NombreMed;
                        medItemDiv.appendChild(medTitle);

                        const dosisRow = document.createElement("div");
                        dosisRow.classList.add("dosis-row");

                        if (med.Dosis) {
                            const dosisEntries = Object.entries(med.Dosis).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

                            for (const [scheduledIso, doseObj] of dosisEntries) {
                                const dosisCircle = document.createElement("div");
                                dosisCircle.classList.add("dosis-circle");

                                const { colorClass, text } = getDoseStatus(scheduledIso, doseObj.taken_at);
                                dosisCircle.classList.add(colorClass);
                                dosisCircle.title = `${med.NombreMed}\nProgramada: ${new Date(scheduledIso).toLocaleString()}\nEstado: ${text}`; 

                                dosisRow.appendChild(dosisCircle);
                            }
                        } else {
                            const noDosesText = document.createElement('p');
                            noDosesText.textContent = 'No hay dosis programadas para este medicamento.';
                            dosisRow.appendChild(noDosesText);
                        }
                        medItemDiv.appendChild(dosisRow);
                        monitoreoContainer.appendChild(medItemDiv);
                    }
                } else { monitoreoContainer.innerHTML = "<p>No hay medicamentos registrados para monitorear.</p>"; }
            } catch (error) {
                console.error("Error al cargar monitoreo:", error);
                monitoreoContainer.innerHTML = `<p style="color:red;">Error al cargar el monitoreo: ${error.message}</p>`;
            }
        });
    }

}); // Cierre del document.addEventListener('DOMContentLoaded')
