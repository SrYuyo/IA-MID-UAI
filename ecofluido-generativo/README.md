# EcoFluido Generativo (p5.js + ml5.js bodyPose)

Sistema de diseño generativo interactivo en tiempo real diseñado para instalaciones y proyección en muros de oficina como feedback ambiental de **pausa activa**, basado en la dinámica corporal de transeúntes.

---

## 🏛️ Arquitectura del Sistema

El proyecto implementa con exactitud las 4 etapas del diagrama de flujo:

```
[1. Captura y Visión (ml5.js)]
       │ (Webcam / Gran angular en zona de tránsito)
       ▼
 ¿Se detecta al menos un cuerpo?
    ├── NO ──> Modo Reposo: Derivas lentas / Flujo calmo (Perlin advectivo)
    │
    └── SÍ ──> [2. Modos de Operación]
                 ├─ Extraer keypoints: Hombros, Caderas, Centro de Masa (CoM)
                 └─ Calcular vectores: Posición (x,y), Velocidad (dx,dy), Aceleración / Cadencia
                      │
                      ▼
               ¿Intensidad del paso?
                 ├─ Paso lento / Calmo  ──> Inyectar fuerza baja: Ondulación suave y tonos fríos
                 └─ Paso rápido / Dinámico ──> Inyectar fuerza alta y turbulencia: Dispersión amplia y tonos vivos
                      │
                      ▼
               [3. Motor de Partículas Fluidas (p5.js)]
                 ├─ Actualizar Campo Vectorial / Grilla de Fluidos
                 └─ Actualizar posición y vida de partículas fluidas
                      │
                      ▼
               [4. Salida Visual e Impacto]
                 ├─ Render en Canvas p5.js: Estelas luminosas + Difuminado alpha (Fade)
                 └─ Proyección / Pantalla en muro de oficina (Pausa activa ambiental)
```

---

## 🚀 Cómo Ejecutar el Proyecto

Para que el navegador permita el acceso seguro a la webcam (`getUserMedia`) y cargue los modelos de visión de `ml5.js`, la aplicación debe servirse a través de un servidor HTTP local (no abrir directamente mediante `file://`).

### Opción 1: Con Python (recomendado)
Abre PowerShell o terminal en esta carpeta y ejecuta:
```bash
python -m http.server 8000
```
Luego abre en tu navegador:
👉 [http://localhost:8000](http://localhost:8000)

### Opción 2: Con Node.js / npx
```bash
npx serve .
```

### Opción 3: Extensión Live Server de VS Code
Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

---

## ⌨️ Atajos de Teclado (Modo Instalación)

Diseñado para operar en pantallas o proyectores sin periféricos a la vista:

| Tecla | Acción | Descripción |
| :---: | :--- | :--- |
| **`[F]`** | **Pantalla Completa** | Activa/desactiva el modo de proyección a pantalla completa sin marcos. |
| **`[H]`** | **Ocultar / Mostrar HUD** | Esconde todos los paneles y controles flotantes para una experiencia visual inmersiva y limpia en la pared. |
| **`[D]`** | **Monitor de Visión** | Muestra/oculta la ventana de depuración con el esqueleto detectado, centro de masa y vectores de velocidad. |
| **`[S]`** | **Alternar Simulación** | Cambia entre Webcam real, cursor interactivo y transeúntes autónomos. |
| **`[C]`** | **Limpiar Lienzo** | Reinicia las corrientes del fluido y limpia las estelas acumuladas. |

---

## 🎛️ Parámetros y Personalización

El panel flotante HUD permite calibrar la experiencia según las condiciones del espacio:

- **Modo de Entrada**:
  - *Webcam Real (ml5 MoveNet)*: Rastreo corporal en vivo mediante cámara de tránsito o gran angular.
  - *Simulación Mouse*: Útil para demostraciones manuales en escritorio.
  - *Simulación Transeúntes*: Agentes autónomos que simulan personas caminando por la oficina a diferentes ritmos.
- **Densidad de Partículas** (1.000 a 7.000): Controla la masa del fluido. Valores entre 3.000 y 4.500 ofrecen un balance ideal entre fluidez y rendimiento a 60 FPS.
- **Fuerza de Inyección** (0.5x a 4.0x): Magnitud con la que el paso de una persona empuja las corrientes.
- **Persistencia de Estelas** (5% a 50%): Nivel de difuminado alpha. Valores menores crean estelas fosforescentes más largas y fluidas.
- **Turbulencia / Vórtice** (0.0 a 3.0): Controla la intensidad de los remolinos tangenciales generados por pasos acelerados.

---

## 🎨 Paletas Cromáticas Dinámicas

- **Modo Reposo**: Tonos azul marino profundo, cian sutil e índigo bioluminiscente con movimientos lentos y orgánicos.
- **Paso Lento / Calmo**: Esmeralda suave, menta, aguamarina y turquesa. Estimula la relajación y concentración.
- **Paso Rápido / Dinámico**: Ámbar incandescente, coral, magenta y destellos dorados con vórtices reactivos. Aporta vitalidad y energía al espacio.
