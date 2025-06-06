// script-monitor.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, get, ref } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { ref as dbRef, get as dbGet } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
    const monitorTitle = document.querySelector('.monitor-title');
    const body = document.body;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('Usuario autenticado en Monitoreo:', user.uid);
            await cargarEstadoMedicamentos(user.uid);
        } else {
            console.log('Usuario no autenticado, redirigiendo...');
            window.location.href = 'index.html';
        }
    });

    async function cargarEstadoMedicamentos(userId) {
        const medicamentosRef = dbRef(db, `DataBase/${userId}/Medicamentos`);

        try {
            const snapshot = await dbGet(medicamentosRef);

            if (snapshot.exists()) {
                const medicamentos = snapshot.val();
                body.appendChild(monitorTitle); // Asegurar que el título esté presente

                for (const medKey in medicamentos) {
                    const medicamento = medicamentosStyleMap.get(medKey);

                    if (medicamento && medicamento.Dosis) {
                        const medicamentoContainer = document.createElement('div');
                        medicamentoContainer.classList.add('medicamento-container');

                        const medicamentoTitle = document.createElement('h2');
                        medicamentoTitle.classList.add('medicamento-title');
                        medicamentoTitle.textContent = medicamento.NombreMed;
                        medicamentoContainer.appendChild(medicamentoTitle);

                        const dosisRow = document.createElement('div');
                        dosisRow.classList.add('dosis-row');

                        const dosisArray = Object.entries(medicamento.Dosis).sort((a, b) => new Date(aStyleMap.get(0)) - new Date(bStyleMap.get(0)));

                        dosisArray.forEach(([timestamp, status]) => {
                            const dosisCircle = document.createElement('div');
                            dosisCircle.classList.add('dosis-circle');

                            // Lógica para determinar el color del círculo basado en 'timestamp' y 'status'
                            // Necesitarás comparar la hora actual con 'timestamp' y el valor de 'status' (0 pendiente, 1 tomada)
                            // También necesitarás la información de 'Horas' del medicamento para calcular las horas límite.

                            // Ejemplo simplificado (necesitarás la lógica real aquí):
                            if (status === 1) {
                                // Aquí iría la lógica para determinar si fue azul o morado
                                dosisCircle.classList.add('dosis-blue'); // Por defecto tomado reciente
                            } else {
                                dosisCircle.classList.add('dosis-gray'); // No tomado
                            }

                            dosisRow.appendChild(dosisCircle);
                        });

                        medicamentoContainer.appendChild(dosisRow);
                        body.appendChild(medicamentoContainer);
                    }
                }
            } else {
                const noMedicamentosMessage = document.createElement('p');
                noMedicamentosMessage.textContent = 'No hay medicamentos registrados para monitorear.';
                body.appendChild(noMedicamentosMessage);
            }

        } catch (error) {
            console.error('Error al cargar el estado de los medicamentos:', error);
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Error al cargar la información de monitoreo.';
            body.appendChild(errorMessage);
        }
    }
});
