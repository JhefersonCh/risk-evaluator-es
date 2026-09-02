# Rol

Actúa como un **ingeniero de software senior especializado en sistemas expertos, inteligencia artificial simbólica, gestión de riesgos de proyectos y desarrollo frontend con TypeScript**.

Tienes experiencia diseñando sistemas basados en reglas, motores de inferencia mediante **encadenamiento hacia adelante (forward chaining)**, sistemas de evaluación de riesgos y aplicaciones web modernas.

Tu objetivo es diseñar e implementar un **sistema experto web para evaluar el nivel de riesgo de un proyecto de software**, utilizando hechos, reglas, acumulación de evidencias y un motor de inferencia explicable.

---

# Tarea

Construye una aplicación web que permita evaluar el riesgo de un proyecto de software a partir de diferentes factores relacionados con su gestión.

El usuario debe ingresar información sobre el proyecto y el sistema debe:

1. Registrar los datos como hechos.
2. Evaluar los hechos frente a una base de conocimiento.
3. Utilizar **encadenamiento hacia adelante (forward chaining)**.
4. Activar las reglas que correspondan.
5. Acumular las evidencias y puntuaciones de riesgo generadas.
6. Determinar el nivel final de riesgo:

   * Bajo.
   * Medio.
   * Alto.
7. Mostrar claramente qué evidencias produjeron el resultado.
8. Generar recomendaciones específicas para disminuir el riesgo.

La aplicación debe ser un **sistema experto basado en reglas**, no simplemente una colección de condiciones `if/else` distribuidas por la interfaz.

---

# Contexto del problema

El sistema se enfocará en la **gestión de proyectos de software**.

Los principales factores que se evaluarán serán:

* Requisitos cambiantes.
* Tamaño del equipo.
* Pruebas.
* Control de versiones.
* Tiempo disponible.
* Experiencia del equipo.

Estos factores deben convertirse en hechos estructurados que puedan ser procesados por el motor de inferencia.

Ejemplo:

```text
Requisitos cambiantes = Alto
Tamaño del equipo = Grande
Pruebas = Insuficientes
Control de versiones = Deficiente
Tiempo disponible = Bajo
Experiencia = Baja
```

---

# Arquitectura del sistema experto

La aplicación debe separar claramente los siguientes componentes:

```text
                 ┌──────────────────┐
                 │      Usuario     │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Formulario / UI  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Base de hechos   │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Motor de         │
                 │ inferencia       │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Base de          │
                 │ conocimiento     │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Evidencias       │
                 │ acumuladas       │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Evaluador de     │
                 │ riesgo           │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Resultado +      │
                 │ recomendaciones  │
                 └──────────────────┘
```

Mantén la lógica del sistema experto independiente de la UI.

---

# Stack tecnológico

La solución debe implementarse **completamente como aplicación web frontend**, utilizando:

* **HTML5**.
* **CSS3**.
* **TypeScript**.

No utilizar Python.

No utilizar backend salvo que sea estrictamente necesario. Para esta versión, prioriza una arquitectura **100 % ejecutable en el navegador**.

Puedes utilizar una herramienta de build para TypeScript como Vite si resulta conveniente, pero no introduzcas frameworks innecesarios.

La lógica del sistema experto debe ejecutarse en el cliente.

---

# Estructura recomendada

Organiza el proyecto de manera modular, por ejemplo:

```text
project/
├── index.html
├── src/
│   ├── main.ts
│   ├── expert-system/
│   │   ├── facts.ts
│   │   ├── rules.ts
│   │   ├── knowledge-base.ts
│   │   ├── inference-engine.ts
│   │   ├── risk-engine.ts
│   │   ├── recommendations.ts
│   │   └── types.ts
│   ├── ui/
│   │   ├── wizard.ts
│   │   ├── inference-view.ts
│   │   ├── risk-result.ts
│   │   └── components.ts
│   ├── data/
│   │   └── questions.ts
│   └── styles/
│       └── main.css
├── package.json
└── tsconfig.json
```

La estructura es orientativa. Puedes modificarla si existe una alternativa mejor.

---

# Modelo de hechos

Define una estructura explícita para representar los hechos.

Por ejemplo:

```ts
interface Fact {
  id: string;
  value: string | number | boolean;
  source: 'user' | 'inference';
  category: string;
}
```

Los hechos deben indicar si fueron:

* Proporcionados por el usuario.
* Generados por inferencia.

No mezcles ambos conceptos.

---

# Modelo de reglas

Las reglas deben estar definidas como objetos de datos, no como lógica dispersa.

Ejemplo conceptual:

```ts
interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  conclusion: Conclusion;
  evidence: RiskEvidence;
}
```

Una regla debería poder expresarse conceptualmente como:

```text
SI pruebas = insuficientes
Y tiempo = bajo
ENTONCES riesgo_calidad = alto
Y agregar +3 puntos
```

La estructura debe permitir incorporar nuevas reglas sin modificar el motor de inferencia.

---

# Base de conocimiento

Construye una base de conocimiento con suficientes reglas para cubrir los principales factores.

Ejemplos conceptuales:

```text
SI requisitos_cambiantes = alto
ENTONCES riesgo_requisitos +2
```

```text
SI pruebas = insuficientes
Y tiempo_disponible = bajo
ENTONCES riesgo_calidad +3
```

```text
SI experiencia = baja
Y tamaño_equipo = grande
ENTONCES riesgo_gestion +2
```

```text
SI control_versiones = deficiente
ENTONCES riesgo_tecnico +3
```

Las reglas deben combinar factores individuales y combinaciones de factores para demostrar el funcionamiento real del motor de inferencia.

---

# Motor de inferencia

Implementa **forward chaining** de forma explícita.

El flujo debe ser:

```text
Hechos iniciales
       ↓
Evaluación de reglas
       ↓
Reglas aplicables
       ↓
Nuevas evidencias / hechos
       ↓
Nueva evaluación
       ↓
Acumulación
       ↓
Resultado final
```

El motor debe:

1. Recibir los hechos iniciales.
2. Buscar reglas cuyas condiciones se cumplan.
3. Activar dichas reglas.
4. Registrar cada activación.
5. Generar nuevas evidencias o hechos.
6. Evitar activar repetidamente una misma regla sin motivo.
7. Repetir el proceso hasta alcanzar un estado estable.
8. Entregar una traza estructurada de la inferencia.

La UI no debe implementar la lógica de inferencia.

---

# Acumulación de evidencias

La característica principal del sistema será la **acumulación de evidencias**.

Cada regla activada puede aportar una determinada cantidad de riesgo.

Ejemplo:

```text
Requisitos cambiantes       +2
Pruebas insuficientes       +3
Poco tiempo disponible      +3
Experiencia baja            +2
Control de versiones malo   +3

Puntaje total = 13
```

Utiliza un sistema de puntuación configurable.

Por ejemplo:

```text
0 - 4    → Bajo
5 - 8    → Medio
9+       → Alto
```

Estos valores son iniciales y pueden modificarse.

La aplicación debe mantener los umbrales en una configuración centralizada.

No describas el puntaje como una probabilidad estadística. Debe denominarse:

* Puntaje de riesgo.
* Nivel de riesgo.
* Acumulación de evidencias.

---

# Categorías de riesgo

Organiza las evidencias dentro de categorías como:

* Requisitos.
* Planificación.
* Calidad.
* Técnico.
* Gestión.
* Equipo.

Cada categoría puede mostrar:

* Evidencias detectadas.
* Puntos acumulados.
* Reglas relacionadas.

Esto permitirá que el usuario comprenda **dónde se concentra el riesgo**.

---

# Sistema de recomendaciones

Las recomendaciones deben derivarse de las evidencias detectadas.

Por ejemplo:

```text
Evidencia:
Requisitos cambiantes

→ Recomendación:
Establecer un proceso formal de gestión de cambios.
```

```text
Evidencia:
Pruebas insuficientes

→ Recomendación:
Aumentar la cobertura de pruebas y automatizar pruebas repetitivas.
```

Las recomendaciones deben formar parte de la base de conocimiento o de una estructura equivalente y estar asociadas a los factores/riesgos correspondientes.

No generes una lista genérica idéntica para todos los proyectos.

---

# Flujo de usuario

La aplicación debe utilizar un flujo guiado mediante **steps**.

```text
01 Información
   ↓
02 Requisitos
   ↓
03 Equipo
   ↓
04 Calidad
   ↓
05 Tiempo y planificación
   ↓
06 Análisis
   ↓
07 Resultado
```

El número y agrupación concreta de pasos puede adaptarse para lograr una mejor experiencia.

El usuario debe conocer siempre:

* Dónde está.
* Cuánto ha avanzado.
* Qué pasos completó.
* Qué falta por completar.

---

# Pantalla inicial

La pantalla inicial debe presentar:

* Nombre del sistema.
* Descripción breve.
* Propósito.
* Factores evaluados.
* Botón principal **"Evaluar proyecto"**.

La interfaz debe transmitir que es una herramienta de análisis de riesgo y no un formulario convencional.

---

# Formulario de evaluación

Utiliza controles adecuados para cada factor.

Ejemplos:

```text
Requisitos cambiantes
[ Bajo ] [ Medio ] [ Alto ]

Experiencia del equipo
[ Baja ] [ Media ] [ Alta ]

Pruebas
[ Buenas ] [ Parciales ] [ Insuficientes ]

Control de versiones
[ Bueno ] [ Parcial ] [ Deficiente ]
```

Para valores cuantitativos utiliza inputs o sliders cuando aporten valor.

Evita utilizar texto libre cuando la información pueda representarse mediante valores discretos.

---

# Pantalla de análisis

Debe existir una pantalla específica para mostrar la ejecución del motor de inferencia.

No utilizar solamente un spinner.

Debe representar visualmente:

```text
ANÁLISIS DEL PROYECTO

✓ Procesando hechos
       ↓
✓ Evaluando reglas
       ↓
✓ Regla R-03 activada
       ↓
✓ Evidencia +2
       ↓
✓ Regla R-07 activada
       ↓
✓ Evidencia +3
       ↓
● Calculando nivel final
```

Utiliza una **timeline de inferencia** con:

* Estados.
* Reglas activadas.
* Evidencias.
* Puntos acumulados.
* Conclusiones.

---

# Visualización de la cadena de inferencia

La aplicación debe mostrar una representación comprensible de la inferencia.

Ejemplo:

```text
[Requisitos cambiantes]
            │
            ↓
[Regla R-03]
            │
            ↓
[Riesgo de requisitos +2]
            │
            ↓
[Acumulación total = 2]
```

Cuando varias condiciones participen en una misma regla:

```text
[Pruebas insuficientes] ───┐
                           ├──→ [Regla R-07]
[Tiempo bajo] ─────────────┘
                                ↓
                         [Riesgo calidad +3]
```

Puedes implementarlo mediante:

* Timeline.
* Nodos.
* Cards conectadas.
* SVG.
* CSS.

No es necesario utilizar una librería de diagramación externa.

La visualización debe mantenerse sencilla y legible.

---

# Explicabilidad

Incluye una sección:

**"¿Por qué este proyecto tiene este nivel de riesgo?"**

Debe mostrar:

```text
Entradas
   ↓
Hechos
   ↓
Reglas activadas
   ↓
Evidencias
   ↓
Puntaje
   ↓
Nivel de riesgo
```

La explicación debe ser generada a partir de la información real registrada por el motor de inferencia.

No inventes una explicación posteriormente en la UI.

La aplicación debe mostrar una **traza de inferencia explicable**, no una cadena de pensamiento interna.

---

# Resultado final

La pantalla final debe destacar visualmente el nivel de riesgo.

Ejemplo:

```text
┌───────────────────────────────────┐
│                                   │
│        NIVEL DE RIESGO            │
│                                   │
│             ALTO                  │
│                                   │
│       Puntaje: 11 puntos          │
│                                   │
└───────────────────────────────────┘
```

Además debe mostrar:

### Puntaje total

Indicar el puntaje y los umbrales utilizados.

### Evidencias

Mostrar cada factor que contribuyó al riesgo:

```text
✓ Requisitos cambiantes       +2
✓ Pruebas insuficientes       +3
✓ Poco tiempo disponible      +3
✓ Experiencia baja            +2
```

### Riesgo por categoría

Representar visualmente:

```text
Requisitos      ████████░░
Calidad         ██████████
Gestión         ██████░░░░
Técnico         ████░░░░░░
```

### Recomendaciones

Mostrar acciones específicas para reducir el riesgo detectado.

### Reglas activadas

Permitir consultar las reglas responsables del resultado.

---

# Diseño visual

Antes de desarrollar la interfaz, inspecciona el proyecto y, si existe una **skill ****`frontend-design`**** en el directorio**, léela y aplícala.

La skill debe utilizarse para definir la ejecución estética de la interfaz, pero el diseño debe respetar además estas necesidades funcionales.

La aplicación debe transmitir:

**gestión de proyectos + análisis de riesgo + sistema experto + tecnología.**

Prioriza:

* Jerarquía visual.
* Claridad.
* Feedback inmediato.
* Buena visualización de evidencias.
* Separación clara entre entrada, análisis y resultado.
* Responsive design.
* Accesibilidad.

Evita:

* Formularios genéricos.
* Tablas innecesarias.
* Exceso de texto.
* Diagramas difíciles de interpretar.
* Interfaces con apariencia de proyecto escolar básico.
* Decoración sin función.

---

# Animaciones y feedback

Utiliza animaciones sutiles para:

* Cambio entre steps.
* Activación de reglas.
* Aparición de evidencias.
* Incremento del puntaje.
* Cambio de estado del análisis.
* Presentación del resultado.

No utilizar animaciones excesivas.

---

# Responsive design

Debe funcionar correctamente en:

* Desktop.
* Tablet.
* Mobile.

El flujo de steps, timeline, evidencias y resultado debe adaptarse correctamente a pantallas pequeñas.

---

# Accesibilidad

Considera:

* Contraste adecuado.
* Focus visible.
* Navegación mediante teclado.
* Etiquetas claras.
* Estados comprensibles.
* No utilizar únicamente color para indicar Bajo/Medio/Alto.

---

# Casos de prueba

Implementa y prueba como mínimo tres escenarios.

## Escenario 1 — Riesgo bajo

Características:

* Requisitos estables.
* Equipo con experiencia.
* Buen control de versiones.
* Buen nivel de pruebas.
* Tiempo suficiente.

Resultado esperado:

```text
RIESGO BAJO
```

## Escenario 2 — Riesgo medio

Características con algunos factores problemáticos.

Resultado esperado:

```text
RIESGO MEDIO
```

## Escenario 3 — Riesgo alto

Características:

* Requisitos cambiantes.
* Poco tiempo.
* Pruebas insuficientes.
* Baja experiencia.
* Control de versiones deficiente.

Resultado esperado:

```text
RIESGO ALTO
```

Verifica especialmente que:

* Se activen las reglas correspondientes.
* Las evidencias se acumulen.
* El puntaje sea consistente.
* Las recomendaciones cambien según las evidencias.
* La explicación coincida con la ejecución real del motor.

---

# Proceso de implementación

Antes de escribir código:

1. Inspecciona el directorio actual.
2. Revisa los archivos existentes.
3. Lee `frontend-design` si está disponible.
4. Define la arquitectura.
5. Define los tipos TypeScript.
6. Define el formato de hechos.
7. Define el formato de reglas.
8. Define la base de conocimiento.
9. Implementa el motor de forward chaining.
10. Implementa el sistema de acumulación de evidencias.
11. Implementa las recomendaciones.
12. Construye la UI.
13. Implementa la visualización de la inferencia.
14. Implementa el resultado.
15. Ejecuta los casos de prueba.
16. Corrige cualquier error encontrado.

No te limites a explicar cómo hacerlo. **Implementa directamente la aplicación en el proyecto.**

---

# Formato de salida

Al finalizar, responde utilizando:

## 1. Análisis

Qué encontraste y qué decisiones tomaste.

## 2. Arquitectura

Componentes y responsabilidades.

## 3. Base de conocimiento

Estructura de reglas, evidencias y categorías.

## 4. Motor de inferencia

Cómo se implementó el forward chaining.

## 5. Acumulación de riesgo

Cómo se calculan evidencias, puntajes y umbrales.

## 6. Interfaz

Pantallas y componentes visuales implementados.

## 7. Pruebas

Escenarios ejecutados y resultados.

## 8. Resultado

Cómo ejecutar y utilizar la aplicación.

Cuando exista una decisión técnica no especificada, toma una decisión razonable y continúa con la implementación sin detener el desarrollo para solicitar confirmación.




Prompt 2
Asegurate de usar la skill para animaciones motion-design que está instalada en el proyecto, ajusta los estilos correspondientes en base a dicha skill
