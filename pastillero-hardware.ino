#include <WiFi.h>
#include <FirebaseESP32.h>
#include <time.h> // Para la función de tiempo NTP

// Datos de la red WiFi
#define WIFI_SSID "Mega-2.4G-2FAD"
#define WIFI_PASSWORD "nXBSaB2QfT"

// Datos de Firebase
#define FIREBASE_HOST "logincorreo-9d4c9-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "yJRwvdfruaBitv4ek2A5iOkWnXrXuznjDRpFocy1"

// Pines de los componentes
#define BUZZER_PIN 25        // GPIO para el Buzzer
#define MOTOR_VIBRADOR_PIN 26 // GPIO para el Motor Vibrador
#define BUTTON_GREEN_PIN 34  // GPIO para el botón verde
#define BUTTON_RED_PIN 35    // GPIO para el botón rojo

// Array de pines para los LEDs (ajusta según tu circuito)
// Los pines están definidos en el diagrama de izquierda a derecha.
int ledPins[] = {16, 17, 5, 18, 19, 21, 22, 23};
const int NUM_LEDS = sizeof(ledPins) / sizeof(ledPins[0]);

// Objetos globales de Firebase
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// Variables para la lógica de la alarma
bool alarmaActiva = false;
bool alarmaSilenciadaPorBotonVerde = false;
unsigned long tiempoInicioAlarma = 0;
unsigned long tiempoSilencioLedVerde = 0;
int compartimientoActivo = -1; // -1 significa ningún compartimiento activo

// --- Variables para la hora NTP ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -21600; // Offset para CST (GMT-6 horas) - Zacatecas
const int   daylightOffset_sec = 0; // No hay horario de verano en Zacatecas actualmente

// Estructura para almacenar los datos de un medicamento (ejemplo)
struct Medicamento {
  int hora;
  int minuto;
  int compartimiento;
  String nombre;
  bool tomado; // Para registrar si se tomó o no
};

// Aquí podrías tener una lista de medicamentos o leerlos desde Firebase
Medicamento medicamentoProgramado; // Solo para un medicamento de ejemplo por ahora

void setup() {
  Serial.begin(115200);

  // Configurar pines de salida
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MOTOR_VIBRADOR_PIN, OUTPUT);
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW); // Asegurarse de que todos los LEDs estén apagados al inicio
  }

  // Configurar pines de entrada para los botones
  // Si usas pull-down externo como en tu diagrama, no uses INPUT_PULLUP.
  // Si no hay pull-down y quieres usar el pull-up interno del ESP32: pinMode(BUTTON_GREEN_PIN, INPUT_PULLUP);
  // En tu diagrama los botones parecen usar resistencias pull-down externas.
  pinMode(BUTTON_GREEN_PIN, INPUT);
  pinMode(BUTTON_RED_PIN, INPUT);

  // Apagar buzzer y motor vibrador al inicio
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(MOTOR_VIBRADOR_PIN, LOW);

  // Conectar a Wi-Fi
  Serial.print("Conectando a Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.println("Conectado a Wi-Fi");
  Serial.println(WiFi.localIP());

  // Configurar Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Firebase.setwriteSizeLimit(firebaseData, "tiny");

  if (Firebase.ready()) {
    Serial.println("Firebase listo.");
    // Sincronizar la hora NTP una vez que Firebase esté listo y conectado a Wi-Fi
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    printLocalTime(); // Imprimir la hora para verificar

    // **** EJEMPLO: Cargar un medicamento de prueba desde Firebase ****
    // Ruta actualizada para buscar medicamentos
    String baseMedicamentosPath = "DataBase/WKiH1ESIcCgYgIUjyBKcfpgdAnu1/Medicamentos";
    
    Serial.print("Intentando leer datos de medicamento de prueba desde Firebase en la ruta: ");
    Serial.println(baseMedicamentosPath);

    // Para leer un medicamento específico, asumimos que dentro de "Medicamentos" hay un ID o nombre de medicamento.
    // Ejemplo: /Medicamentos/Chocofresa/horario
    // Si tu estructura es diferente, ajusta esta línea.
    String specificMedicamentoPath = baseMedicamentosPath + "/Chocofresa/horario"; // Ajusta "Chocofresa" al nombre de tu medicamento
                                                                                 // o al primer hijo que esperas encontrar.

    if (Firebase.get(firebaseData, specificMedicamentoPath)) {
      if (firebaseData.dataType() == "json") {
        // Nueva forma de obtener los datos JSON
        FirebaseJson json;
        json.setJsonData(firebaseData.jsonString()); // Pasa el String JSON de la respuesta a un objeto FirebaseJson

        // Ahora puedes usar 'json' para extraer los datos
        // Intentar obtener los datos del JSON
        FirebaseJsonData result; // Objeto para extraer los datos individuales

        if (json.get(result, "hora")) {
          medicamentoProgramado.hora = result.intValue;
        } else {
            Serial.println("No se pudo obtener 'hora'.");
        }
        if (json.get(result, "minuto")) {
          medicamentoProgramado.minuto = result.intValue;
        } else {
            Serial.println("No se pudo obtener 'minuto'.");
        }
        if (json.get(result, "compartimiento")) {
          medicamentoProgramado.compartimiento = result.intValue;
        } else {
            Serial.println("No se pudo obtener 'compartimiento'.");
        }
        if (json.get(result, "nombre")) {
          medicamentoProgramado.nombre = result.stringValue;
        } else {
            Serial.println("No se pudo obtener 'nombre'.");
        }
        medicamentoProgramado.tomado = false; // Estado inicial

        Serial.print("Medicamento cargado: ");
        Serial.print(medicamentoProgramado.nombre);
        Serial.print(" a las ");
        Serial.print(medicamentoProgramado.hora);
        Serial.print(":");
        Serial.print(medicamentoProgramado.minuto);
        Serial.print(" en compartimiento ");
        Serial.println(medicamentoProgramado.compartimiento);

      } else {
        Serial.print("Tipo de dato incorrecto o no se encontró el medicamento en la ruta: ");
        Serial.println(specificMedicamentoPath);
        // Establecer un medicamento de prueba si el tipo de dato es incorrecto
        medicamentoProgramado.hora = 18; // 6 PM
        medicamentoProgramado.minuto = 50; // 50 minutos
        medicamentoProgramado.compartimiento = 4; // Compartimiento 4
        medicamentoProgramado.nombre = "Paracetamol (Ejemplo JSON fallido)";
        medicamentoProgramado.tomado = false;
        Serial.println("Usando medicamento de prueba.");
      }
    } else {
      Serial.print("Fallo al leer medicamento de Firebase en la ruta ");
      Serial.print(specificMedicamentoPath);
      Serial.print(": ");
      Serial.println(firebaseData.errorReason());
      // Establecer un medicamento de prueba si no se pudo leer de Firebase
      medicamentoProgramado.hora = 19; // 7 PM
      medicamentoProgramado.minuto = 59; // 59 minutos (Hora actual de Zacatecas es 7:57 PM)
      medicamentoProgramado.compartimiento = 4; // Compartimiento 4
      medicamentoProgramado.nombre = "Paracetamol (Ejemplo Fallback)";
      medicamentoProgramado.tomado = false;
      Serial.println("Usando medicamento de prueba (Paracetamol, 19:59, comp. 4).");
    }

  } else {
    Serial.println("Firebase NO está listo.");
  }
}


void loop() {
  // Asegurarse de que Firebase esté conectado antes de hacer operaciones
  if (!Firebase.ready()) {
    return;
  }

  // Obtener la hora actual
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Error al obtener la hora NTP");
    delay(1000);
    return;
  }

  // --- Lógica de la alarma ---
  // Solo se activa si la alarma no está ya activa y no se ha silenciado con el botón verde (esperando 30s)
  if (!alarmaActiva && !alarmaSilenciadaPorBotonVerde) { 
    // Verificar si es hora de tomar el medicamento
    // Asegurarse de que el medicamento no se haya tomado ya (para evitar que suene repetidamente)
    if (timeinfo.tm_hour == medicamentoProgramado.hora &&
        timeinfo.tm_min == medicamentoProgramado.minuto &&
        !medicamentoProgramado.tomado) { 
      
      Serial.println("¡Es hora de tomar el medicamento!");
      activarAlarma(medicamentoProgramado.compartimiento);
      tiempoInicioAlarma = millis(); // Registrar el inicio de la alarma
      alarmaActiva = true;
    }
  }

  // --- Manejo de botones cuando la alarma está activa ---
  if (alarmaActiva) {
    // Caso 1: Presiona el botón verde (dentro de los 5 min que suena la alarma)
    // Asumiendo pull-down externo, el botón se lee HIGH cuando se presiona.
    if (digitalRead(BUTTON_GREEN_PIN) == HIGH) { 
      if (millis() - tiempoInicioAlarma <= 5 * 60 * 1000) { // Dentro de los 5 minutos (5 * 60 * 1000 ms)
        Serial.println("Botón Verde presionado: Medicamento tomado.");
        desactivarAlarma(); // Apaga buzzer y motor
        medicamentoProgramado.tomado = true; // Marcar como tomado
        registrarTomaMedicamento(true, medicamentoProgramado.nombre); // Registrar en Firebase
        alarmaSilenciadaPorBotonVerde = true; // Activar estado de silencio con retardo de LED
        tiempoSilencioLedVerde = millis(); // Iniciar conteo para apagar LED
        // El LED permanecerá encendido hasta que se cumplan los 30s
      } else {
        Serial.println("Botón Verde presionado pero fuera del tiempo permitido (5 min).");
      }
      delay(200); // Debounce simple para el botón
    }

    // Caso 2: Presiona el botón rojo
    // Asumiendo pull-down externo, el botón se lee HIGH cuando se presiona.
    if (digitalRead(BUTTON_RED_PIN) == HIGH) { 
      Serial.println("Botón Rojo presionado: Medicamento NO tomado.");
      desactivarAlarma(); // Apaga buzzer y motor
      medicamentoProgramado.tomado = false; // Marcar como NO tomado
      registrarTomaMedicamento(false, medicamentoProgramado.nombre); // Registrar en Firebase
      
      // Apagar el LED inmediatamente si estaba encendido por la alarma
      if (compartimientoActivo != -1 && compartimientoActivo >= 1 && compartimientoActivo <= NUM_LEDS) {
        digitalWrite(ledPins[compartimientoActivo - 1], LOW); 
      }
      alarmaActiva = false; // La alarma se ha manejado y desactivado.
      compartimientoActivo = -1; // Resetear compartimiento activo
      delay(200); // Debounce simple para el botón
    }

    // Caso 3: Alarma activa pero no se presiona ningún botón después de 5 minutos
    // El LED, buzzer y motor vibrador se mantienen activos durante los 5 minutos.
    if (millis() - tiempoInicioAlarma > 5 * 60 * 1000 && !alarmaSilenciadaPorBotonVerde) {
      if (alarmaActiva) { // Solo si la alarma sigue lógicamente activa
        Serial.println("Tiempo de alarma agotado (5 minutos). Medicamento NO tomado.");
        medicamentoProgramado.tomado = false; // Marcar como NO tomado
        registrarTomaMedicamento(false, medicamentoProgramado.nombre); // Registrar en Firebase
        
        // Desactivar la alarma y apagar el LED completamente después de los 5 minutos.
        desactivarAlarma(); // Apaga buzzer y motor
        if (compartimientoActivo != -1 && compartimientoActivo >= 1 && compartimientoActivo <= NUM_LEDS) {
            digitalWrite(ledPins[compartimientoActivo - 1], LOW); // Apagar LED
        }
        alarmaActiva = false; // La alarma ha terminado su ciclo.
        compartimientoActivo = -1; // Resetear compartimiento activo
      }
    }
  }

  // Lógica para apagar el LED después de 30s si se presionó el botón verde
  if (alarmaSilenciadaPorBotonVerde && compartimientoActivo != -1 && millis() - tiempoSilencioLedVerde >= 30 * 1000) {
    Serial.println("Apagando LED después de 30 segundos (Botón Verde).");
    if (compartimientoActivo >= 1 && compartimientoActivo <= NUM_LEDS) {
        digitalWrite(ledPins[compartimientoActivo -1], LOW);
    }
    alarmaSilenciadaPorBotonVerde = false; // Resetear el estado para que la alarma pueda volver a activarse
    compartimientoActivo = -1; // Resetear compartimiento activo
  }

  // Pequeño delay para evitar que el loop se ejecute demasiado rápido
  delay(50);
}

// --- Funciones de utilidad ---

void activarAlarma(int compartimiento) {
  Serial.print("Activando alarma para compartimiento: ");
  Serial.println(compartimiento);

  digitalWrite(BUZZER_PIN, HIGH);        // Encender Buzzer
  digitalWrite(MOTOR_VIBRADOR_PIN, HIGH); // Encender Motor Vibrador

  // Encender el LED correspondiente al compartimiento
  if (compartimiento >= 1 && compartimiento <= NUM_LEDS) {
    digitalWrite(ledPins[compartimiento - 1], HIGH); // -1 porque los arrays son base 0
    compartimientoActivo = compartimiento;
  } else {
    Serial.println("Número de compartimiento inválido. No se puede encender el LED.");
  }
}

void desactivarAlarma() {
  Serial.println("Desactivando alarma (Buzzer y Motor Vibrador).");
  digitalWrite(BUZZER_PIN, LOW);         // Apagar Buzzer
  digitalWrite(MOTOR_VIBRADOR_PIN, LOW);  // Apagar Motor Vibrador
  // El LED se apaga dependiendo del caso (30s después con botón verde, inmediatamente con botón rojo/tiempo agotado)
}

void registrarTomaMedicamento(bool tomado, String nombreMedicamento) {
  String estado = tomado ? "Tomado" : "No Tomado";
  Serial.print("Registrando en Firebase: Medicamento ");
  Serial.print(nombreMedicamento);
  Serial.print(" como: ");
  Serial.println(estado);

  // Ruta donde se registrará la toma del medicamento
  // Esta ruta ya utiliza tu UID predefinido
  String rutaRegistro = "DataBase/WKiH1ESIcCgYgIUjyBKcfpgdAnu1/RegistrosTomaMedicamento/";
  rutaRegistro += nombreMedicamento + "/";
  
  // Usar la hora actual para el nombre del registro (timestamp)
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Error al obtener la hora para el registro.");
    return;
  }
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d_%H-%M-%S", &timeinfo);
  rutaRegistro += String(timeStringBuff);

  FirebaseJson json; // Crear un objeto FirebaseJson para enviar
  json.set("estado", estado);
  json.set("horaRegistro", String(timeinfo.tm_hour) + ":" + String(timeinfo.tm_min) + ":" + String(timeinfo.tm_sec));
  json.set("compartimiento", medicamentoProgramado.compartimiento);
  json.set("medicamento", medicamentoProgramado.nombre); // Asegurarse de que el nombre esté incluido

  if (Firebase.set(firebaseData, rutaRegistro.c_str(), &json)) {
    Serial.println("Registro de toma de medicamento guardado correctamente en Firebase.");
  } else {
    Serial.print("Fallo al guardar registro en Firebase: ");
    Serial.println(firebaseData.errorReason());
  }
}

void printLocalTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Fallo al obtener la hora NTP");
    return;
  }
  Serial.print("Hora actual: ");
  Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
}
