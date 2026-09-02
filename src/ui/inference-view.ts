import { LEVEL_LABELS } from '../expert-system/config.js';
import type { RiskAssessment, RuleActivation, TraceEvent } from '../expert-system/types.js';
import { createAccumulator } from './accumulator.js';
import { chip, el, eyebrow, prefersReducedMotion, screen, signed, wrap } from './components.js';

/**
 * Pantalla de análisis.
 *
 * El motor ya corrió: acá se reproduce su traza, evento por evento. Nada
 * se calcula en esta pantalla — cada fila sale de `inference.events` y el
 * instrumento se llena con la evidencia que las reglas aportaron, en el
 * mismo orden en que se activaron.
 */

interface AnalysisHandlers {
  onDone: () => void;
}

export function renderAnalysis(
  assessment: RiskAssessment,
  handlers: AnalysisHandlers,
): { el: HTMLElement; stop: () => void } {
  const gauge = createAccumulator({
    scaleMax: assessment.scaleMax,
    level: 'pendiente',
    score: 0,
    caption: 'La aguja marca la evidencia acumulada hasta el evento en curso.',
  });

  const trace = el('ol', {
    class: 'mt-6 border-l border-line',
    'aria-live': 'polite',
    'aria-label': 'Traza de la inferencia',
  });

  const skipButton = el('button', {
    class: 'btn btn--ghost',
    type: 'button',
    text: 'Ver el resultado',
    onClick: () => finish(true),
  });

  const root = screen(
    wrap(
      el(
        'div',
        {
          class:
            'grid items-start gap-10 py-10 pb-24 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:gap-16 lg:py-12',
        },
        el('div', { class: 'lg:sticky lg:top-[76px]' }, gauge.el),
        el(
          'div',
          {},
          el(
            'header',
            { class: 'border-b border-line pb-4' },
            eyebrow('Motor de inferencia · Ejecución'),
            el('h2', { class: 'mt-3 text-h1', text: 'Análisis del proyecto' }),
            el('p', {
              class: 'mt-3 max-w-[56ch] text-ink-2',
              text: `${assessment.inference.initialFacts.length} hechos iniciales confrontados contra la base de conocimiento. Cada ciclo vuelve a evaluar las reglas con los hechos que produjo el ciclo anterior.`,
            }),
          ),
          trace,
          el('div', { class: 'mt-8' }, skipButton),
        ),
      ),
    ),
  );

  /* ---------------------------------------------------------------- */
  /* Filas de la traza                                                 */
  /* ---------------------------------------------------------------- */

  const row = (kind: string, tag: string, ...content: (Node | string)[]): HTMLElement =>
    el(
      'li',
      { class: 'trace-item', 'data-kind': kind },
      el(
        'div',
        { class: 'flex flex-wrap items-baseline gap-3' },
        el('span', {
          class: 'shrink-0 font-mono text-xs tracking-[0.1em] uppercase text-graphite',
          text: tag,
        }),
        ...content,
      ),
    );

  const activationRow = (activation: RuleActivation): HTMLElement => {
    const points = activation.evidence?.points ?? 0;

    return el(
      'li',
      { class: 'trace-item', 'data-kind': 'rule-fired' },
      el(
        'div',
        { class: 'flex flex-wrap items-baseline gap-3' },
        el('span', {
          class: 'shrink-0 font-mono text-xs font-medium tracking-[0.1em] text-signal-deep',
          text: activation.rule.id,
        }),
        el('span', { class: 'text-sm font-semibold', text: activation.rule.name }),
        points > 0
          ? el('span', { class: 'trace-points', text: `${signed(points)} evidencia` })
          : el('span', {
              class: 'ml-auto shrink-0 font-mono text-xs uppercase text-graphite',
              text: 'sin puntaje',
            }),
      ),
      el(
        'div',
        { class: 'mt-2 flex flex-wrap gap-2' },
        activation.matched.map((match) => chip(match.condition.label, match.source === 'inference')),
        chip(`⇒ ${activation.derivedFact.label}`, true),
      ),
    );
  };

  const rowFor = (event: TraceEvent): HTMLElement | null => {
    switch (event.kind) {
      case 'engine-start':
        return row(
          'engine-start',
          'Inicio',
          el('span', {
            class: 'text-sm',
            text: `${event.factCount} hechos cargados · ${event.ruleCount} reglas en la base`,
          }),
        );
      case 'cycle-start':
        return row(
          'cycle-start',
          `Ciclo ${event.cycle}`,
          el('span', {
            class: 'font-display text-[1.0625rem] font-bold font-stretch-[112%]',
            text: `${event.candidates} ${event.candidates === 1 ? 'regla aplicable' : 'reglas aplicables'}`,
          }),
        );
      case 'rule-fired':
        return activationRow(event.activation);
      case 'stable':
        return row(
          'stable',
          'Estable',
          el('span', {
            class: 'text-sm',
            text: `Ninguna regla nueva se activa. ${event.activations} activaciones en ${event.cycles} ciclos.`,
          }),
        );
      case 'scoring':
        return row(
          'scoring',
          'Puntaje',
          el('span', { class: 'text-sm', text: `Evidencia acumulada: ${event.total} puntos` }),
        );
      case 'verdict':
        return row(
          'verdict',
          'Veredicto',
          el('span', {
            class: 'text-sm font-semibold',
            text: `Riesgo ${LEVEL_LABELS[event.level].toLowerCase()}`,
          }),
        );
      default:
        return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Reproducción                                                      */
  /* ---------------------------------------------------------------- */

  const events = assessment.inference.events;
  let timer: number | undefined;
  let index = 0;
  let done = false;

  // Con muchas activaciones se acorta el paso para que la traza no se eternice.
  const ruleCount = events.filter((e) => e.kind === 'rule-fired').length;
  const stepDelay = ruleCount > 12 ? 120 : 190;

  const applyEvent = (event: TraceEvent): void => {
    const node = rowFor(event);
    if (node) trace.appendChild(node);

    if (event.kind === 'evidence-added') {
      gauge.push(event.evidence.points, `${event.evidence.label} ${signed(event.evidence.points)}`);
    }

    if (event.kind === 'verdict') {
      gauge.setLevel(event.level, `Riesgo ${LEVEL_LABELS[event.level].toLowerCase()}`);
      gauge.setCaption(`Lectura final: ${event.total} puntos. El umbral alcanzado define el nivel.`);
    }

    node?.scrollIntoView({
      block: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  function finish(immediate: boolean): void {
    if (done) return;
    done = true;
    if (timer !== undefined) window.clearTimeout(timer);
    for (let i = index; i < events.length; i += 1) applyEvent(events[i]);
    index = events.length;
    window.setTimeout(handlers.onDone, immediate ? 0 : 700);
  }

  const tick = (): void => {
    if (index >= events.length) {
      finish(false);
      return;
    }
    const event = events[index];
    index += 1;
    applyEvent(event);

    const delay =
      event.kind === 'cycle-start' ? stepDelay * 2 : event.kind === 'rule-fired' ? stepDelay : 90;
    timer = window.setTimeout(tick, delay);
  };

  if (prefersReducedMotion()) {
    for (const event of events) applyEvent(event);
    index = events.length;
    done = true;
    window.setTimeout(handlers.onDone, 400);
  } else {
    timer = window.setTimeout(tick, 260);
  }

  return {
    el: root,
    stop: () => {
      done = true;
      if (timer !== undefined) window.clearTimeout(timer);
    },
  };
}
