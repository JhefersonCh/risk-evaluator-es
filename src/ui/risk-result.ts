import { LEVEL_LABELS, LEVEL_SUMMARY } from '../expert-system/config.js';
import { evidencesFor } from '../expert-system/recommendations.js';
import type {
  CategoryScore,
  RiskAssessment,
  RuleActivation,
} from '../expert-system/types.js';
import { createAccumulator } from './accumulator.js';
import { chip, el, eyebrow, screen, signed, wrap } from './components.js';

/**
 * Pantalla de resultado.
 *
 * Todo lo que aparece acá sale de la traza del motor: las evidencias son
 * las que aportaron las reglas activadas, el puntaje es su suma y la
 * explicación se arma con los datos reales de la ejecución. La interfaz
 * no interpreta nada por su cuenta.
 */

interface ResultHandlers {
  onRestart: () => void;
  onEdit: () => void;
}

const SECTIONS = [
  { id: 'evidencias', label: 'Evidencias' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'cadena', label: 'Cadena de inferencia' },
  { id: 'porque', label: '¿Por qué?' },
  { id: 'recomendaciones', label: 'Recomendaciones' },
  { id: 'reglas', label: 'Reglas activadas' },
];

export function renderResult(
  assessment: RiskAssessment,
  handlers: ResultHandlers,
): HTMLElement {
  return screen(
    wrap(
      el(
        'div',
        { class: 'py-10 pb-24 lg:py-12' },
        verdictBlock(assessment),
        sectionsNav(),
        block(
          'evidencias',
          'Evidencia acumulada',
          `Cada línea es una regla que se activó y el riesgo que aportó. La suma de esta columna es el puntaje total: ${assessment.score} puntos.`,
          evidenceList(assessment),
        ),
        block(
          'categorias',
          'Dónde se concentra el riesgo',
          'Las barras comparan cada categoría contra la más cargada del proyecto, para ver de un vistazo qué frente pesa más.',
          categoryBars(assessment),
        ),
        block(
          'cadena',
          'Cadena de inferencia',
          'El motor razona por ciclos: el primero mira los hechos que cargaste, y cada ciclo siguiente vuelve a evaluar las reglas usando lo que dedujo el anterior.',
          chainByCycle(assessment),
        ),
        block(
          'porque',
          `¿Por qué este proyecto tiene riesgo ${LEVEL_LABELS[assessment.level].toLowerCase()}?`,
          'El recorrido completo, desde lo que respondiste hasta el veredicto.',
          explanation(assessment),
        ),
        block(
          'recomendaciones',
          'Qué hacer para bajar el riesgo',
          'Cada acción sale de una evidencia concreta. Si esa evidencia no se hubiese detectado, esta recomendación no estaría acá.',
          recommendationList(assessment),
        ),
        block(
          'reglas',
          'Reglas activadas',
          `${assessment.inference.activations.length} de ${assessment.inference.activations.length + assessment.inference.notFired.length} reglas cumplieron sus condiciones. Abrí cualquiera para ver cómo está escrita.`,
          ruleList(assessment),
        ),
        el(
          'div',
          { class: 'flex flex-wrap gap-4 border-t border-line pt-12' },
          el(
            'button',
            { class: 'btn', type: 'button', onClick: handlers.onEdit },
            'Ajustar respuestas',
          ),
          el('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Evaluar otro proyecto',
            onClick: handlers.onRestart,
          }),
        ),
      ),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Veredicto                                                           */
/* ------------------------------------------------------------------ */

function verdictBlock(assessment: RiskAssessment): HTMLElement {
  const gauge = createAccumulator({
    scaleMax: assessment.scaleMax,
    level: assessment.level,
    caption: `Escala del instrumento: 0 a ${assessment.scaleMax} puntos.`,
  });

  gauge.loadAll(
    assessment.evidences.map((evidence) => ({
      points: evidence.points,
      label: `${evidence.label} ${signed(evidence.points)}`,
    })),
  );
  gauge.setLevel(assessment.level, `Riesgo ${LEVEL_LABELS[assessment.level].toLowerCase()}`);

  const levelColor =
    assessment.level === 'bajo'
      ? 'text-low'
      : assessment.level === 'medio'
        ? 'text-mid'
        : 'text-high';

  return el(
    'div',
    {
      class:
        'grid items-center gap-10 rounded-panel border border-ink-2 bg-surface p-6 shadow-raised lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:p-12',
      'data-level': assessment.level,
    },
    el(
      'div',
      {},
      eyebrow(`Nivel de riesgo · ${assessment.projectName}`),
      el('p', {
        class: `mt-2 block font-display text-verdict font-bold tracking-[-0.035em] uppercase font-stretch-[125%] animate-verdict-in ${levelColor}`,
        text: LEVEL_LABELS[assessment.level],
      }),
      el('p', {
        class: 'mt-4 max-w-[46ch] text-ink-2',
        text: LEVEL_SUMMARY[assessment.level],
      }),
      thresholdScale(assessment),
      el(
        'div',
        {
          class:
            'mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-line-soft pt-4 font-mono text-xs tracking-[0.06em] text-graphite',
        },
        metaItem('Puntaje', `${assessment.score} puntos`),
        metaItem('Umbral', assessment.threshold.range),
        metaItem('Reglas activadas', String(assessment.inference.activations.length)),
        metaItem('Ciclos', String(assessment.inference.cycles)),
        metaItem('Evidencias', String(assessment.evidences.length)),
      ),
    ),
    el('div', { class: 'justify-self-start lg:justify-self-end' }, gauge.el),
  );
}

function metaItem(label: string, value: string): HTMLElement {
  return el(
    'span',
    {},
    `${label}: `,
    el('b', { class: 'font-medium text-ink', text: value }),
  );
}

/** Escala con las tres zonas y la marca del puntaje obtenido. */
function thresholdScale(assessment: RiskAssessment): HTMLElement {
  const max = assessment.scaleMax;

  const zones = assessment.thresholds.map((threshold) => {
    const to = Number.isFinite(threshold.max) ? threshold.max + 1 : max;
    const width = ((Math.min(to, max) - threshold.min) / max) * 100;
    return el(
      'div',
      {
        class: `zone zone--${threshold.level}`,
        style: { width: `${width}%` },
      },
      el('span', { text: threshold.label }),
    );
  });

  const marker = el('div', {
    class: 'marker',
    style: { left: `${(Math.min(assessment.score, max) / max) * 100}%` },
    'data-score': `${assessment.score} pts`,
  });

  return el(
    'div',
    { class: 'mt-8' },
    el(
      'div',
      { class: 'relative flex h-7.5 overflow-visible rounded-xs border border-ink-2' },
      el('div', { class: 'flex w-full overflow-hidden rounded-xs' }, zones),
      marker,
    ),
    el(
      'div',
      { class: 'mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-graphite' },
      assessment.thresholds.map((threshold) =>
        el('span', { text: `${threshold.label}: ${threshold.range}` }),
      ),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Navegación de secciones                                             */
/* ------------------------------------------------------------------ */

function sectionsNav(): HTMLElement {
  return el(
    'nav',
    {
      class:
        'sticky top-[57px] z-10 mt-12 mb-8 flex gap-1 overflow-x-auto border-b border-line bg-paper/90 py-2 backdrop-blur',
      'aria-label': 'Secciones del informe',
    },
    SECTIONS.map((section) =>
      el('a', {
        class:
          'rounded-xs px-3 py-2 font-mono text-xs tracking-[0.08em] whitespace-nowrap uppercase text-graphite no-underline transition-colors duration-150 ease-signature hover:bg-surface hover:text-ink',
        href: `#${section.id}`,
        text: section.label,
      }),
    ),
  );
}

function block(
  id: string,
  title: string,
  intro: string,
  body: HTMLElement,
): HTMLElement {
  return el(
    'section',
    { class: 'scroll-mt-32 border-t border-line py-12', id },
    eyebrow(id.replace(/^\w/, (c) => c.toUpperCase())),
    el('h2', { class: 'mt-2 text-h2', text: title }),
    el('p', { class: 'mt-3 max-w-[62ch] text-ink-2', text: intro }),
    el('div', { class: 'mt-6' }, body),
  );
}

/* ------------------------------------------------------------------ */
/* Evidencias                                                          */
/* ------------------------------------------------------------------ */

function evidenceList(assessment: RiskAssessment): HTMLElement {
  if (assessment.evidences.length === 0) {
    return emptyNote(
      'Ninguna regla aportó evidencia de riesgo. Todas las prácticas evaluadas están en su valor sano.',
    );
  }

  const rows = assessment.inference.activations
    .filter((activation) => activation.evidence)
    .map((activation) => {
      const evidence = activation.evidence!;
      return el(
        'li',
        {
          class:
            'grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line-soft py-4',
        },
        el('span', { class: 'font-mono text-sm text-low', text: '✓', 'aria-hidden': 'true' }),
        el(
          'div',
          {},
          el('p', { class: 'text-sm font-semibold', text: evidence.label }),
          el('p', { class: 'mt-1 text-sm text-graphite', text: evidence.detail }),
          el(
            'div',
            { class: 'mt-2 flex flex-wrap gap-2' },
            chip(activation.rule.id),
            chip(evidence.category),
            chip(`ciclo ${activation.cycle}`),
          ),
        ),
        el('span', {
          class: 'font-mono text-sm font-medium whitespace-nowrap tabular',
          text: signed(evidence.points),
        }),
      );
    });

  return el(
    'ul',
    { class: 'border-t border-line-soft' },
    rows,
    el(
      'li',
      { class: 'flex items-baseline justify-between gap-4 py-4' },
      el('span', {
        class: 'font-mono text-xs tracking-[0.1em] uppercase text-graphite',
        text: 'Total acumulado',
      }),
      el('span', {
        class: 'font-display text-xl font-bold tabular',
        text: `${assessment.score} puntos`,
      }),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

function categoryBars(assessment: RiskAssessment): HTMLElement {
  const weightOf = (category: CategoryScore): string => {
    if (category.points === 0) return 'nulo';
    if (category.share >= 0.66) return 'alto';
    if (category.share >= 0.33) return 'medio';
    return 'bajo';
  };

  return el(
    'div',
    { class: 'grid gap-5' },
    assessment.categories.map((category) => {
      const fill = el('div', {
        class: 'cat-fill',
        'data-weight': weightOf(category),
      });

      // El ancho se aplica en el cuadro siguiente para que la barra crezca.
      requestAnimationFrame(() => {
        fill.style.width = `${Math.max(category.share * 100, category.points > 0 ? 4 : 0)}%`;
      });

      return el(
        'div',
        { class: 'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[130px_minmax(0,1fr)_56px]' },
        el('span', {
          class: 'font-mono text-xs tracking-[0.1em] uppercase',
          text: category.label,
        }),
        el(
          'div',
          {
            class:
              'order-3 col-span-2 h-4.5 overflow-hidden rounded-xs border border-line bg-sunk sm:order-none sm:col-span-1',
          },
          fill,
        ),
        el('span', {
          class: 'text-right font-mono text-sm tabular',
          text: `${category.points} pt`,
        }),
        category.ruleIds.length > 0 &&
          el(
            'div',
            { class: 'order-4 col-span-2 flex flex-wrap gap-1 sm:col-span-3 sm:col-start-2' },
            category.ruleIds.map((id) => chip(id)),
          ),
      );
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Cadena de inferencia                                                */
/* ------------------------------------------------------------------ */

function chainByCycle(assessment: RiskAssessment): HTMLElement {
  const cycles = new Map<number, RuleActivation[]>();
  for (const activation of assessment.inference.activations) {
    const bucket = cycles.get(activation.cycle) ?? [];
    bucket.push(activation);
    cycles.set(activation.cycle, bucket);
  }

  if (cycles.size === 0) {
    return emptyNote('Ninguna regla cumplió sus condiciones: no hay cadena que mostrar.');
  }

  return el(
    'div',
    { class: 'grid gap-8' },
    [...cycles.entries()].map(([cycle, activations]) =>
      el(
        'div',
        {},
        el(
          'div',
          { class: 'flex flex-wrap items-baseline gap-3 border-b border-line pb-2' },
          el('span', {
            class: 'font-display text-[1.0625rem] font-bold font-stretch-[112%]',
            text: `Ciclo ${cycle}`,
          }),
          el('span', {
            class: 'font-mono text-xs tracking-[0.08em] uppercase text-graphite',
            text:
              cycle === 1
                ? 'reglas que miran los hechos que cargaste'
                : 'reglas que miran hechos deducidos en el ciclo anterior',
          }),
        ),
        el('div', { class: 'mt-4 grid gap-4' }, activations.map(chainCard)),
      ),
    ),
  );
}

/** Una regla dibujada como grafo: condiciones → regla → conclusión. */
function chainCard(activation: RuleActivation): HTMLElement {
  const inputs = el(
    'div',
    { class: 'grid gap-2' },
    activation.matched.map((match) =>
      el(
        'div',
        { class: match.source === 'inference' ? 'node node--derived' : 'node' },
        match.condition.label,
        el('span', {
          class: `mt-1 block text-[0.6875rem] ${match.source === 'inference' ? 'text-signal-deep' : 'text-graphite'}`,
          text: match.source === 'inference' ? 'hecho inferido' : 'hecho del usuario',
        }),
      ),
    ),
  );

  const brace = el(
    'div',
    { class: 'brace hidden sm:block', 'aria-hidden': 'true' },
    activation.matched.map((_, index) =>
      el('span', {
        class: 'brace__stub',
        style: {
          top: `${((index + 0.5) / activation.matched.length) * 100}%`,
        },
      }),
    ),
  );

  const outputs = el(
    'div',
    { class: 'grid gap-2' },
    el('div', { class: 'node node--rule', text: activation.rule.id }),
    el('div', { class: 'flex items-center gap-2 font-mono text-xs text-graphite' },
      el('span', { class: 'h-px w-4 shrink-0 bg-line', 'aria-hidden': 'true' }),
      el('span', { text: 'concluye' }),
    ),
    el(
      'div',
      { class: 'node node--out' },
      activation.derivedFact.label,
      activation.evidence
        ? el('span', {
            class: 'mt-1 block text-[0.6875rem] text-graphite',
            text: `${signed(activation.evidence.points)} en ${activation.evidence.category} · total ${activation.scoreAfter}`,
          })
        : el('span', {
            class: 'mt-1 block text-[0.6875rem] text-graphite',
            text: 'no aporta puntaje: sólo habilita otras reglas',
          }),
    ),
  );

  return el(
    'article',
    { class: 'rounded-panel border border-line bg-surface p-5' },
    el(
      'header',
      { class: 'flex flex-wrap items-baseline gap-3 border-b border-line-soft pb-4' },
      el('span', {
        class: 'font-mono text-sm font-medium text-signal-deep',
        text: activation.rule.id,
      }),
      el('span', { class: 'text-sm font-semibold', text: activation.rule.name }),
      el('span', {
        class: 'ml-auto font-mono text-xs tracking-[0.08em] uppercase text-graphite',
        text: `activación ${activation.order}`,
      }),
    ),
    el(
      'div',
      {
        class:
          'mt-4 grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_40px_minmax(0,0.9fr)]',
      },
      inputs,
      brace,
      outputs,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Explicación                                                         */
/* ------------------------------------------------------------------ */

function explanation(assessment: RiskAssessment): HTMLElement {
  const { inference } = assessment;

  const stage = (label: string, text: string, items?: HTMLElement[]): HTMLElement =>
    el(
      'div',
      {
        class:
          'grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-b border-line-soft py-4 first:border-t',
      },
      el('span', {
        class: 'w-23 shrink-0 font-mono text-xs tracking-[0.1em] uppercase text-graphite',
        text: label,
      }),
      el(
        'div',
        {},
        el('p', { class: 'text-sm', text }),
        items && items.length > 0
          ? el('div', { class: 'mt-2 flex flex-wrap gap-2' }, items)
          : null,
      ),
    );

  return el(
    'div',
    { class: 'grid' },
    stage(
      'Entradas',
      `Respondiste ${inference.initialFacts.length} preguntas sobre el proyecto.`,
      inference.initialFacts.map((fact) => chip(fact.label)),
    ),
    stage(
      'Hechos',
      `Esas respuestas se registraron como ${inference.initialFacts.length} hechos del usuario. El motor dedujo otros ${inference.derivedFacts.length} a partir de ellos.`,
      inference.derivedFacts.map((fact) => chip(fact.label, true)),
    ),
    stage(
      'Reglas',
      `${inference.activations.length} reglas cumplieron sus condiciones a lo largo de ${inference.cycles} ciclos. Las ${inference.notFired.length} restantes no se activaron.`,
      inference.activations.map((activation) => chip(activation.rule.id)),
    ),
    stage(
      'Evidencias',
      assessment.evidences.length > 0
        ? `${assessment.evidences.length} de esas reglas aportaron riesgo. Las demás sólo dedujeron hechos.`
        : 'Ninguna regla aportó riesgo.',
      assessment.evidences.map((evidence) =>
        chip(`${evidence.label} ${signed(evidence.points)}`),
      ),
    ),
    stage(
      'Puntaje',
      `La suma de la evidencia da ${assessment.score} puntos.`,
      assessment.categories
        .filter((category) => category.points > 0)
        .map((category) => chip(`${category.label} ${category.points}`)),
    ),
    stage(
      'Nivel',
      `${assessment.score} puntos cae en el rango ${assessment.threshold.range}, que corresponde a riesgo ${LEVEL_LABELS[assessment.level].toLowerCase()}.`,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Recomendaciones                                                     */
/* ------------------------------------------------------------------ */

function recommendationList(assessment: RiskAssessment): HTMLElement {
  if (assessment.recommendations.length === 0) {
    return emptyNote(
      'No hay acciones pendientes: el motor no detectó evidencia de riesgo. Sostené las prácticas actuales y volvé a evaluar si cambia alguna condición del proyecto.',
    );
  }

  return el(
    'div',
    { class: 'grid gap-4' },
    assessment.recommendations.map((recommendation, index) => {
      const supporting = evidencesFor(recommendation.id, assessment);
      return el(
        'article',
        {
          class:
            'grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-panel border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-150 ease-signature hover:border-ink-2 hover:shadow-raised',
        },
        el('span', {
          class: 'pt-1 font-mono text-xs text-graphite tabular',
          text: String(index + 1).padStart(2, '0'),
        }),
        el(
          'div',
          {},
          el('h3', {
            class: 'font-display text-[1.0625rem] font-semibold font-stretch-[108%]',
            text: recommendation.title,
          }),
          el('p', {
            class: 'mt-2 max-w-[66ch] text-sm text-ink-2',
            text: recommendation.action,
          }),
          el(
            'p',
            { class: 'mt-3 border-t border-dashed border-line pt-3 text-xs text-graphite' },
            'Responde a: ',
            el('b', {
              class: 'font-medium text-ink-2',
              text: supporting.map((evidence) => evidence.label).join(' · '),
            }),
          ),
        ),
      );
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Reglas activadas                                                    */
/* ------------------------------------------------------------------ */

function ruleList(assessment: RiskAssessment): HTMLElement {
  if (assessment.inference.activations.length === 0) {
    return emptyNote('Ninguna regla se activó en esta evaluación.');
  }

  return el(
    'div',
    { class: 'grid gap-2' },
    assessment.inference.activations.map((activation) =>
      el(
        'details',
        { class: 'rule-row rounded-panel border border-line bg-surface' },
        el(
          'summary',
          {},
          el('span', {
            class: 'font-mono text-sm font-medium text-signal-deep',
            text: activation.rule.id,
          }),
          el('span', { class: 'text-sm', text: activation.rule.name }),
          el('span', {
            class: 'font-mono text-sm text-graphite tabular',
            text: activation.evidence ? signed(activation.evidence.points) : '0',
          }),
        ),
        el(
          'div',
          { class: 'border-t border-dashed border-line px-4 pb-4' },
          el('p', {
            class: 'mt-3 rounded-xs bg-sunk p-3 font-mono text-xs/relaxed',
            text: activation.rule.statement,
          }),
          el(
            'div',
            { class: 'mt-3 flex flex-wrap gap-2' },
            chip(`ciclo ${activation.cycle}`),
            chip(`prioridad ${activation.rule.priority}`),
            chip(`acumulado ${activation.scoreBefore} → ${activation.scoreAfter}`),
            activation.evidence ? chip(activation.evidence.category) : chip('sin evidencia'),
          ),
        ),
      ),
    ),
  );
}

function emptyNote(text: string): HTMLElement {
  return el('p', {
    class: 'rounded-panel border border-dashed border-line bg-surface p-6 text-sm text-ink-2',
    text,
  });
}
