import { JSDOM } from 'jsdom';

/**
 * Prueba de humo de la interfaz.
 *
 * Monta la aplicación completa sobre un DOM real (jsdom) y recorre el
 * flujo de punta a punta: portada → recorrido → análisis → resultado.
 * Verifica que lo que se muestra en pantalla coincida con lo que produjo
 * el motor, no sólo que no explote.
 */

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

const { window } = dom;

// jsdom no implementa estas dos: la aplicación las usa para desplazarse.
window.HTMLElement.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};

// Se fuerza "menos movimiento" para que la traza se pinte de una sola vez.
window.matchMedia = ((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const globals = globalThis as unknown as Record<string, unknown>;
globals.window = window;
globals.document = window.document;
globals.HTMLElement = window.HTMLElement;
globals.Node = window.Node;
globals.Event = window.Event;
globals.requestAnimationFrame = (cb: FrameRequestCallback) =>
  window.setTimeout(() => cb(Date.now()), 0) as unknown as number;
globals.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
globals.performance = window.performance;

/* Los módulos de UI se cargan después de instalar los globales. */
const { createApp } = await import('../ui/app.js');
const { SCENARIOS, runScenario } = await import('../data/scenarios.js');
const { STEPS, REQUIRED_QUESTIONS } = await import('../data/questions.js');
const { LEVEL_LABELS } = await import('../expert-system/config.js');

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

const doc = window.document;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function text(): string {
  return doc.body.textContent ?? '';
}

function buttonByText(label: string): HTMLButtonElement {
  const match = [...doc.querySelectorAll('button')].find((node) =>
    (node.textContent ?? '').includes(label),
  );
  if (!match) throw new Error(`No se encontró el botón "${label}"`);
  return match as HTMLButtonElement;
}

function count(selector: string): number {
  return doc.querySelectorAll(selector).length;
}

/* ------------------------------------------------------------------ */
/* Recorrido                                                           */
/* ------------------------------------------------------------------ */

const root = doc.getElementById('app')!;
createApp(root as unknown as HTMLElement);

console.log('');
console.log('  EVALUADOR DE RIESGO — prueba de humo de la interfaz');
console.log('  ' + '─'.repeat(72));

/* --- Portada ------------------------------------------------------- */

check(text().includes('Evaluador de riesgo'), 'la portada no muestra el nombre del sistema');
check(text().includes('de proyectos de software'), 'la portada no muestra el subtítulo');
check(count('.acc') === 1, 'la portada no muestra el instrumento');
check(count('.acc__band') === 3, `el instrumento debe tener 3 zonas de umbral, tiene ${count('.acc__band')}`);
check(count('.acc__seg') === 0, 'el instrumento en reposo no debería tener segmentos');
check(text().includes('Motor en espera'), 'la barra superior no reporta el estado del motor');
console.log('  ✓ portada: instrumento en reposo con 3 zonas de umbral');

/* --- Recorrido guiado ---------------------------------------------- */

buttonByText('Evaluar proyecto').click();

check(count('.rail-step') === STEPS.length, `el riel debe listar ${STEPS.length} pasos`);
check(text().includes('Información'), 'el primer paso no es Información');
check(text().includes(`0 de ${REQUIRED_QUESTIONS.length} hechos`), 'el progreso no arranca en cero');
console.log(`  ✓ recorrido: ${STEPS.length} pasos, progreso en 0 de ${REQUIRED_QUESTIONS.length} hechos`);

// Se avanza hasta el último paso: el motor no debe poder ejecutarse todavía.
(doc.querySelectorAll('.rail-step')[STEPS.length - 1] as HTMLButtonElement).click();
const runButton = buttonByText('Ejecutar el motor');
check(runButton.disabled, 'el motor se puede ejecutar sin haber respondido todo');
check(text().includes('Faltan'), 'no se avisa cuántas respuestas faltan');
console.log('  ✓ recorrido: el motor queda bloqueado hasta completar los hechos');

// Se responde el paso visible y el progreso tiene que moverse.
const radios = [...doc.querySelectorAll('input[type=radio]')] as HTMLInputElement[];
const firstName = radios[0].name;
for (const radio of radios) {
  if (radio.name !== firstName) continue;
  radio.checked = true;
  radio.dispatchEvent(new window.Event('change', { bubbles: true }));
  break;
}
check(text().includes(`1 de ${REQUIRED_QUESTIONS.length} hechos`), 'el progreso no avanzó al responder');
check(text().includes('Hecho →'), 'no se muestra el hecho que genera la respuesta');
console.log('  ✓ recorrido: responder registra el hecho y mueve el progreso');

/* --- Escenarios de punta a punta ------------------------------------ */

// Se vuelve a la portada, donde viven los casos de referencia. Cada
// iteración termina en la portada gracias a "Evaluar otro proyecto".
(doc.querySelectorAll('.rail-step')[0] as HTMLButtonElement).click();
buttonByText('Volver a la portada').click();

for (const scenario of SCENARIOS) {
  const expected = runScenario(scenario);
  const label = { bajo: 'Alcance estable', medio: 'Frentes flojos', alto: 'Todo en rojo' }[
    scenario.id
  ]!;

  buttonByText(label).click();

  // Pantalla de análisis: la traza se pinta completa por movimiento reducido.
  check(text().includes('Análisis del proyecto'), `[${scenario.id}] no se muestra la pantalla de análisis`);
  check(text().includes('Ejecutando reglas'), `[${scenario.id}] el motor no se reporta en ejecución`);

  const firedRows = count('.trace-item[data-kind="rule-fired"]');
  check(
    firedRows === expected.inference.activations.length,
    `[${scenario.id}] la traza muestra ${firedRows} activaciones y el motor produjo ${expected.inference.activations.length}`,
  );

  const cycleRows = count('.trace-item[data-kind="cycle-start"]');
  check(
    cycleRows === expected.inference.cycles - (expected.inference.cycles > 1 ? 1 : 0) ||
      cycleRows > 0,
    `[${scenario.id}] la traza no separa los ciclos`,
  );

  const segments = count('.acc__seg');
  check(
    segments === expected.evidences.length,
    `[${scenario.id}] el instrumento apiló ${segments} segmentos y hay ${expected.evidences.length} evidencias`,
  );

  await wait(600);

  // Pantalla de resultado.
  const body = text();
  // El bloque de veredicto lleva el nivel como dato, no sólo como estilo.
  const verdict = doc.querySelector(`[data-level="${expected.level}"]`);
  check(!!verdict, `[${scenario.id}] el veredicto no declara el nivel alcanzado`);
  check(
    (verdict?.textContent ?? '').includes(LEVEL_LABELS[expected.level]),
    `[${scenario.id}] el veredicto no muestra el nivel ${LEVEL_LABELS[expected.level]}`,
  );
  check(body.includes(`${expected.score} puntos`), `[${scenario.id}] el resultado no muestra el puntaje ${expected.score}`);
  check(body.includes(expected.threshold.range), `[${scenario.id}] el resultado no muestra el umbral aplicado`);
  check(body.includes('Inferencia estable'), `[${scenario.id}] el motor no se reporta estable`);

  const ruleRows = count('details.rule-row');
  check(
    ruleRows === expected.inference.activations.length,
    `[${scenario.id}] se listan ${ruleRows} reglas activadas y el motor activó ${expected.inference.activations.length}`,
  );

  const chainCards = count('#cadena article');
  check(
    chainCards === expected.inference.activations.length,
    `[${scenario.id}] la cadena dibuja ${chainCards} nodos y hubo ${expected.inference.activations.length} activaciones`,
  );

  const recCards = count('#recomendaciones article');
  check(
    recCards === expected.recommendations.length,
    `[${scenario.id}] se muestran ${recCards} recomendaciones y corresponden ${expected.recommendations.length}`,
  );

  for (const section of ['evidencias', 'categorias', 'cadena', 'porque', 'recomendaciones', 'reglas']) {
    check(!!doc.getElementById(section), `[${scenario.id}] falta la sección ${section}`);
  }

  // Cada recomendación tiene que nombrar la evidencia que la sostiene.
  const orphanRecs = [...doc.querySelectorAll('#recomendaciones article')].filter(
    (node) => !(node.textContent ?? '').includes('Responde a:'),
  ).length;
  check(orphanRecs === 0, `[${scenario.id}] hay ${orphanRecs} recomendaciones sin evidencia declarada`);

  console.log(
    `  ✓ ${scenario.id}: ${expected.score} pts · ${LEVEL_LABELS[expected.level]} · ${expected.inference.activations.length} reglas · ${expected.recommendations.length} recomendaciones`,
  );

  buttonByText('Evaluar otro proyecto').click();
}

/* --- Cierre -------------------------------------------------------- */

console.log('  ' + '─'.repeat(72));
if (failures.length === 0) {
  console.log('  ✓ interfaz verificada de punta a punta');
  console.log('');
} else {
  console.log(`  ✗ ${failures.length} verificaciones fallaron`);
  for (const failure of failures) console.log(`    ${failure}`);
  console.log('');
  process.exitCode = 1;
}
