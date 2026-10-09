# 🥊 SUPER K.O. BOXING - Web Tracker Edition

Un juego de boxeo estilo arcade retro (inspirado en **Super K.O. Boxing** y **Punch-Out!!**) desarrollado con **p5.js** y **ml5.js**, controlado completamente mediante **seguimiento corporal y de brazos por cámara web** (MoveNet Pose Estimation).

---

## 🚀 Características Principales

1. **Control por Visión Artificial en Tiempo Real**:
   - **Esquivas Laterales**: Inclina tu torso o cabeza a la izquierda o derecha para esquivar ganchos.
   - **Agacharse (Duck)**: Desciende tu centro de gravedad para que los golpes altos pasen de largo.
   - **Guardia (Bloqueo Activo)**: Levanta ambas muñecas frente a tu cara para absorber golpes (85% de daño reducido).
   - **Puñetazos Directos**: Lanza tu puño izquierdo o derecho hacia el frente para conectar jabs y directos.
   - **Super K.O. Uppercut**: Cuando llenas el medidor de adrenalina al 100%, lanza ambos puños hacia adelante para un devastador golpe cinematográfico.

2. **Inteligencia Artificial de Rivales (Estilo Arcade)**:
   - **Bruiser Boris**: Boxeador de gran pegada y temibles *Haymakers* (golpes no bloqueables telegrafiados con brillo carmesí). Al fallar queda aturdido, abriendo una ventana para contra-golpes críticos.
   - **Lightning Leo**: Oponente veloz con combinaciones rápidas que pondrá a prueba tus reflejos de esquiva.

3. **Efectos de Audio y Visuales**:
   - **Sintetizador Web Audio API puro**: Sin necesidad de archivos de audio externos (cero errores de carga o CORS). Campanas, crujidos de impacto, silbidos de viento, avisos de peligro y rugido del público.
   - **Efectos visuales Arcade**: Sacudida de pantalla (*screen shake*), congelamiento de impacto (*hit-stop*), textos de cómic ("¡POW!", "¡BAM!", "¡CONTRA-GOLPE!"), chispas y gotas de sudor.
   - **PiP de Cámara con Esqueleto**: Mini visor en pantalla con detección de puntos clave (COCO-17), retícula de postura neutral y estado de acción actual.

4. **Soporte Híbrido (Teclado)**:
   - Si no dispones de cámara en algún momento, puedes jugar inmediatamente con:
     - `←` / `→`: Esquivar Izquierda / Derecha
     - `↓`: Agacharse
     - `Espacio`: Guardia / Bloqueo
     - `Z`: Golpe Izquierdo
     - `X`: Golpe Derecho
     - `S`: Super K.O. Blow
     - `C`: Calibrar Cámara
     - `P`: Mostrar / Ocultar mini-cámara

---

## ⚙️ Cómo Ejecutar el Juego Localmente

Dado que los navegadores exigen un contexto seguro (`http://localhost` o `https://`) para permitir el acceso a la cámara web (`navigator.mediaDevices.getUserMedia`), debes iniciar un servidor local:

### Opción 1: Con Python (Recomendado)
Abre una terminal en esta carpeta y ejecuta:
```bash
python -m http.server 8000
```
Luego abre tu navegador en:
👉 `http://localhost:8000`

### Opción 2: Con VS Code / Cursor Live Server
Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

---

## 🎯 Consejos para Mejor Detección con la Cámara

1. **Iluminación**: Asegúrate de tener buena luz de frente (evita contraluces intensos de ventanas o focos a tu espalda).
2. **Distancia**: Sitúate a entre 1 y 2 metros de la cámara para que tu cabeza, hombros y brazos sean claramente visibles.
3. **Calibración**: Al iniciar, quédate en el centro en postura de guardia relajada durante 2 segundos para que el sistema aprenda automáticamente tu posición neutra. Puedes presionar la tecla **C** en cualquier momento para recalibrar.
