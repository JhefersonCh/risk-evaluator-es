import type { RiskCategory, RiskLevel, Threshold } from './types.js';

/**
 * Configuración central del evaluador.
 *
 * Los umbrales viven acá y en ningún otro lado. Cambiar estos números
 * cambia el veredicto de toda la aplicación sin tocar el motor ni la UI.
 *
 * Calibración: la base de conocimiento reparte hasta 60 puntos entre 34
 * reglas. Un proyecto sano acumula 0–2 puntos; uno con varios frentes
 * flojos ronda 10; uno con todos los factores en rojo supera los 45.
 */
export const THRESHOLDS: Threshold[] = [
  { level: 'bajo', min: 0, max: 7, label: 'Bajo', range: '0 – 7 puntos' },
  { level: 'medio', min: 8, max: 17, label: 'Medio', range: '8 – 17 puntos' },
  {
    level: 'alto',
    min: 18,
    max: Number.POSITIVE_INFINITY,
    label: 'Alto',
    range: '18 puntos o más',
  },
];

/** Corte de seguridad del encadenamiento hacia adelante. */
export const MAX_CYCLES = 12;

/** Piso de la escala del instrumento, para que un puntaje bajo no se vea gigante. */
export const SCALE_FLOOR = 24;

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  requisitos: 'Requisitos',
  planificacion: 'Planificación',
  calidad: 'Calidad',
  tecnico: 'Técnico',
  gestion: 'Gestión',
  equipo: 'Equipo',
};

export const CATEGORY_ORDER: RiskCategory[] = [
  'requisitos',
  'planificacion',
  'calidad',
  'tecnico',
  'gestion',
  'equipo',
];

export const LEVEL_LABELS: Record<RiskLevel, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

/** Lectura del veredicto en una frase, para el bloque de resultado. */
export const LEVEL_SUMMARY: Record<RiskLevel, string> = {
  bajo: 'La evidencia acumulada se mantiene por debajo del primer umbral. El proyecto puede avanzar con seguimiento normal.',
  medio:
    'La evidencia acumulada cruzó el primer umbral. Hay frentes que exigen acción antes de comprometer fechas.',
  alto: 'La evidencia acumulada superó el umbral superior. El proyecto necesita intervención antes de continuar.',
};

export function levelFor(score: number): Threshold {
  const match = THRESHOLDS.find((t) => score >= t.min && score <= t.max);
  return match ?? THRESHOLDS[THRESHOLDS.length - 1];
}

/** Tope de la escala del instrumento: nunca menor al piso ni al puntaje real. */
export function scaleMaxFor(score: number): number {
  return Math.max(SCALE_FLOOR, Math.ceil(score / 6) * 6);
}
