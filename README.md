# Evaluador de riesgo de proyectos de software

Sistema experto basado en reglas que estima el nivel de riesgo de un proyecto
de software mediante **encadenamiento hacia adelante** y **acumulación de
evidencias**. Corre entero en el navegador: HTML, CSS (Tailwind v4) y TypeScript,
sin backend.

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # bundle de producción en dist/
npm test         # motor + interfaz
```

## Cómo razona

```
respuestas → hechos → motor de inferencia ⇄ base de conocimiento
                              ↓
                        evidencias acumuladas
                              ↓
                    puntaje → umbral → nivel + recomendaciones
```

El motor toma una foto de la base de hechos al inicio de cada ciclo, activa
las reglas que se cumplen contra esa foto y aserta sus conclusiones. El ciclo
se repite mientras algo cambie. Esa foto por ciclo es lo que separa las
generaciones de razonamiento: el ciclo 1 mira los hechos del usuario, el 2 mira
lo que dedujo el 1, y así. Una regla se activa una sola vez por ejecución.

## Estructura

```
src/
├── expert-system/        lógica del dominio, sin DOM
│   ├── types.ts          contratos: hechos, reglas, evidencias, traza
│   ├── config.ts         umbrales y categorías — punto único de calibración
│   ├── facts.ts          base de hechos y evaluación de condiciones
│   ├── rules.ts          constructores para declarar reglas como datos
│   ├── knowledge-base.ts 34 reglas en cuatro generaciones
│   ├── inference-engine.ts  encadenamiento hacia adelante
│   ├── risk-engine.ts    acumulación, umbrales y categorías
│   └── recommendations.ts catálogo ligado a las evidencias
├── data/
│   ├── questions.ts      cuestionario → hechos
│   └── scenarios.ts      los tres casos de referencia
├── ui/                   pantallas; no calculan nada
└── test/                 escenarios del motor + humo de la interfaz
```

## Calibración

Los umbrales viven en `src/expert-system/config.ts` y en ningún otro lado:

| Nivel | Rango           |
|-------|-----------------|
| Bajo  | 0 – 7 puntos    |
| Medio | 8 – 17 puntos   |
| Alto  | 18 puntos o más |

## Agregar una regla

Sumá un objeto a `KNOWLEDGE_BASE`. El motor no necesita cambios: sólo sabe
evaluar condiciones y asertar conclusiones.

```ts
rule({
  id: 'R-40',
  name: 'Nombre corto',
  statement: 'SI a = x Y b = y ENTONCES c = z (+2)',
  priority: 50,
  conditions: [eq('a', 'x', 'a = x'), eq('b', 'y', 'b = y')],
  conclusion: concludes('c', 'z', 'Conclusión legible'),
  evidence: evidence('E-ID', 'Título', 'Por qué es riesgo.', 'calidad', 2, ['REC-CI']),
});
```

Si la conclusión es un hecho nuevo, agregá su categoría en
`DERIVED_FACT_CATEGORY` para que la evidencia caiga en el grupo correcto.

## Pruebas

`npm run test:engine` corre los tres escenarios contra el motor y verifica
nivel, reglas activadas, refractariedad, coherencia del puntaje, reparto por
categoría, respaldo de cada recomendación y orden causal de los ciclos.

`npm run test:ui` monta la aplicación sobre jsdom y recorre el flujo completo,
comprobando que la pantalla muestre exactamente lo que produjo el motor.
