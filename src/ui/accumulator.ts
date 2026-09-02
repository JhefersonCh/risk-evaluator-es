import { THRESHOLDS } from '../expert-system/config.js';
import type { RiskLevel } from '../expert-system/types.js';
import { countTo, el, prefersReducedMotion } from './components.js';

/**
 * Columna acumuladora — el instrumento del sistema.
 *
 * Un tubo graduado con las tres zonas de umbral al fondo. Cada regla que
 * aporta evidencia empuja un segmento hacia arriba, y la aguja marca el
 * puntaje alcanzado. El mismo componente sirve en reposo (portada),
 * llenándose (análisis) y como lectura final (resultado).
 */

export type GaugeLevel = RiskLevel | 'pendiente';

export interface AccumulatorOptions {
  scaleMax: number;
  caption: string;
  level?: GaugeLevel;
  score?: number;
}

export interface Accumulator {
  readonly el: HTMLElement;
  /** Agrega un segmento de evidencia y actualiza la lectura. */
  push(points: number, label: string): void;
  setLevel(level: GaugeLevel, text: string): void;
  setCaption(text: string): void;
  /** Carga todos los segmentos de una sola vez, sin reproducción. */
  loadAll(segments: { points: number; label: string }[]): void;
}

const LEVEL_TEXT: Record<GaugeLevel, string> = {
  pendiente: 'Sin evaluar',
  bajo: 'Riesgo bajo',
  medio: 'Riesgo medio',
  alto: 'Riesgo alto',
};

export function createAccumulator(options: AccumulatorOptions): Accumulator {
  const scaleMax = Math.max(1, options.scaleMax);
  let score = options.score ?? 0;

  const pct = (value: number) => `${(Math.min(value, scaleMax) / scaleMax) * 100}%`;

  /* Zonas de umbral: el fondo del instrumento */
  const bands = THRESHOLDS.map((threshold) => {
    const from = threshold.min;
    const to = Number.isFinite(threshold.max) ? threshold.max + 1 : scaleMax;
    return el('div', {
      class: `acc__band acc__band--${threshold.level}`,
      style: { bottom: pct(from), height: pct(Math.max(0, to - from)) },
      'aria-hidden': 'true',
    });
  });

  const bandLines = THRESHOLDS.slice(1).map((threshold) =>
    el('div', {
      class: 'acc__bandline',
      style: { bottom: pct(threshold.min) },
      'aria-hidden': 'true',
    }),
  );

  /* Regla graduada: marcas mayores en los umbrales, menores cada 6 puntos */
  const majorValues = new Set([0, ...THRESHOLDS.slice(1).map((t) => t.min)]);
  const tickValues = new Set<number>(majorValues);
  for (let value = 6; value < scaleMax; value += 6) tickValues.add(value);
  tickValues.add(scaleMax);

  const ticks = [...tickValues]
    .sort((a, b) => a - b)
    .map((value) =>
      el('span', {
        class: majorValues.has(value) ? 'acc__tick acc__tick--major' : 'acc__tick',
        style: { bottom: pct(value) },
        text: String(value),
        'aria-hidden': 'true',
      }),
    );

  const stack = el('div', { class: 'acc__stack' });
  const needle = el('div', {
    class: 'acc__needle',
    style: { bottom: pct(score) },
    'aria-hidden': 'true',
  });

  const track = el(
    'div',
    { class: 'acc__track' },
    bands,
    bandLines,
    stack,
    needle,
  );

  const scoreValue = el('span', { text: String(score) });
  const scoreBox = el(
    'p',
    { class: 'acc__score' },
    scoreValue,
    el('span', { class: 'acc__score-unit', text: 'puntos' }),
  );

  const levelBox = el('p', {
    class: 'acc__level',
    text: LEVEL_TEXT[options.level ?? 'pendiente'],
  });

  const caption = el('p', { class: 'acc__caption', text: options.caption });

  const root = el(
    'figure',
    {
      class: 'acc',
      'data-level': options.level ?? 'pendiente',
      role: 'img',
      'aria-label': `Acumulador de evidencia. ${score} de un máximo de escala de ${scaleMax} puntos.`,
      style: { margin: '0' },
    },
    el('div', { class: 'acc__gauge' }, el('div', { class: 'acc__scale' }, ticks), track),
    el('div', { class: 'acc__readout' }, scoreBox, levelBox),
    caption,
  );

  const addSegment = (from: number, points: number, label: string, animate: boolean) => {
    const segment = el('div', {
      class: animate ? 'acc__seg acc__seg--entering' : 'acc__seg',
      style: { bottom: pct(from), height: animate ? '0%' : pct(points) },
      title: label,
      'aria-hidden': 'true',
    });
    stack.appendChild(segment);

    if (!animate) return;
    requestAnimationFrame(() => {
      segment.classList.remove('acc__seg--entering');
      segment.style.height = pct(points);
    });
  };

  const updateReadout = (next: number) => {
    root.setAttribute(
      'aria-label',
      `Acumulador de evidencia. ${next} de un máximo de escala de ${scaleMax} puntos.`,
    );
    needle.style.bottom = pct(next);
  };

  return {
    el: root,

    push(points, label) {
      if (points <= 0) return;
      const from = score;
      score += points;
      const animate = !prefersReducedMotion();
      addSegment(from, points, label, animate);
      scoreBox.classList.add('is-ticking');
      window.setTimeout(() => scoreBox.classList.remove('is-ticking'), 200);
      countTo(scoreValue, from, score, 380, updateReadout);
    },

    loadAll(segments) {
      stack.replaceChildren();
      let running = 0;
      for (const segment of segments) {
        if (segment.points <= 0) continue;
        addSegment(running, segment.points, segment.label, false);
        running += segment.points;
      }
      score = running;
      scoreValue.textContent = String(score);
      updateReadout(score);
    },

    setLevel(level, text) {
      root.setAttribute('data-level', level);
      levelBox.textContent = text;
    },

    setCaption(text) {
      caption.textContent = text;
    },
  };
}
