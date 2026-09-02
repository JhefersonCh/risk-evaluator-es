import { CATEGORY_ORDER, THRESHOLDS } from '../expert-system/config.js';
import { KNOWLEDGE_BASE } from '../expert-system/knowledge-base.js';
import { QUESTIONS } from '../data/questions.js';
import { createAccumulator } from './accumulator.js';
import { el, eyebrow, hairline, screen, wrap } from './components.js';

/**
 * Portada.
 *
 * Presenta el sistema y muestra el instrumento en reposo: las tres zonas
 * de umbral, vacías. El usuario ve el aparato antes de usarlo.
 */

interface LandingHandlers {
  onStart: () => void;
  onScenario: (id: string) => void;
}

/** Los seis factores, mapeados a la categoría de riesgo que alimentan. */
const FACTOR_SHEET: { key: string; value: string }[] = [
  { key: 'REQ', value: 'Volatilidad y documentación del alcance' },
  { key: 'EQU', value: 'Experiencia y rotación del equipo' },
  { key: 'GES', value: 'Tamaño del equipo y carga de coordinación' },
  { key: 'CAL', value: 'Cobertura de pruebas y validación' },
  { key: 'TEC', value: 'Control de versiones, integración y dependencias' },
  { key: 'PLA', value: 'Tiempo disponible y planificación' },
];

const DEMOS: { id: string; label: string }[] = [
  { id: 'bajo', label: 'Alcance estable' },
  { id: 'medio', label: 'Frentes flojos' },
  { id: 'alto', label: 'Todo en rojo' },
];

export function renderLanding(handlers: LandingHandlers): HTMLElement {
  const gauge = createAccumulator({
    scaleMax: 24,
    level: 'pendiente',
    score: 0,
    caption:
      'El instrumento arranca vacío. Cada regla que se active empuja un segmento y la aguja sube hasta la zona que le corresponde.',
  });

  const sheet = el(
    'div',
    { class: 'grid border-t border-line sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2' },
    FACTOR_SHEET.map((row) =>
      el(
        'div',
        { class: 'flex items-baseline gap-3 border-b border-line-soft py-3 xl:mr-8' },
        el('span', {
          class: 'shrink-0 font-mono text-xs tracking-[0.1em] text-graphite',
          text: row.key,
        }),
        el('span', { class: 'text-sm', text: row.value }),
      ),
    ),
  );

  return screen(
    wrap(
      el(
        'div',
        {
          class:
            'grid items-center gap-12 py-10 pb-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:gap-16 lg:py-16',
        },
        el(
          'div',
          {},
          eyebrow('Sistema experto · Encadenamiento hacia adelante'),
          el(
            'h1',
            { class: 'mt-4 text-display font-stretch-[122%]' },
            'Evaluador de riesgo',
            el('em', { class: 'block not-italic text-signal-deep', text: 'de proyectos de software' }),
          ),
          el('p', {
            class: 'mt-6 max-w-[44ch] text-[1.0625rem] text-ink-2',
            text:
              'Registra tus respuestas como hechos, los confronta contra una base de conocimiento y acumula la evidencia que cada regla activada aporta. El resultado viene con la traza completa: qué se activó, por qué y cuánto sumó.',
          }),
          hairline('my-8'),
          eyebrow('Factores que evalúa'),
          el('div', { class: 'mt-3' }, sheet),
          el(
            'div',
            { class: 'mt-8 flex flex-wrap items-center gap-4' },
            el(
              'button',
              { class: 'btn btn--lg', type: 'button', onClick: handlers.onStart },
              'Evaluar proyecto',
              el('span', { class: 'btn__arrow', text: '→', 'aria-hidden': 'true' }),
            ),
            el('span', {
              class: 'font-mono text-xs tracking-[0.08em] text-graphite',
              text: `${KNOWLEDGE_BASE.length} reglas · ${CATEGORY_ORDER.length} categorías · ${QUESTIONS.length - 1} factores`,
            }),
          ),
          el(
            'div',
            { class: 'mt-4 flex flex-wrap items-center gap-3' },
            el('span', {
              class: 'font-mono text-xs tracking-[0.08em] text-graphite',
              text: 'Casos de prueba:',
            }),
            DEMOS.map((demo) =>
              el('button', {
                class: 'btn btn--ghost btn--sm',
                type: 'button',
                text: demo.label,
                onClick: () => handlers.onScenario(demo.id),
              }),
            ),
          ),
          el('p', {
            class: 'mt-4 max-w-[54ch] font-mono text-xs leading-relaxed tracking-[0.04em] text-graphite',
            text: `Umbrales: ${THRESHOLDS.map((t) => `${t.label} ${t.range}`).join(' · ')}.`,
          }),
        ),
        el('div', { class: 'flex justify-start lg:justify-center' }, gauge.el),
      ),
    ),
  );
}
