/**
 * Contratos del sistema experto.
 *
 * Este módulo no conoce el DOM. Todo lo que vive aquí puede ejecutarse
 * en Node (pruebas de escenarios) o en el navegador sin cambios.
 */

/* ------------------------------------------------------------------ */
/* Hechos                                                              */
/* ------------------------------------------------------------------ */

export type FactValue = string | number | boolean;

/** Origen de un hecho: lo dijo el usuario o lo dedujo el motor. */
export type FactSource = 'user' | 'inference';

export interface Fact {
  id: string;
  value: FactValue;
  source: FactSource;
  category: RiskCategory;
  /** Texto legible del hecho, p. ej. "Requisitos cambiantes: alto". */
  label: string;
  /** Regla que lo produjo. Sólo para hechos inferidos. */
  ruleId?: string;
  /** Ciclo de inferencia en el que se asertó. 0 = hecho inicial. */
  cycle: number;
}

/* ------------------------------------------------------------------ */
/* Condiciones y reglas                                                */
/* ------------------------------------------------------------------ */

export type Operator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'notIn'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'exists';

export interface Condition {
  factId: string;
  operator: Operator;
  value?: FactValue | FactValue[];
  /** Lectura humana de la condición: "pruebas = insuficientes". */
  label: string;
}

export interface Conclusion {
  factId: string;
  value: FactValue;
  label: string;
}

export type RiskCategory =
  | 'requisitos'
  | 'planificacion'
  | 'calidad'
  | 'tecnico'
  | 'gestion'
  | 'equipo';

export interface RiskEvidence {
  id: string;
  /** Título corto: "Pruebas insuficientes". */
  label: string;
  /** Por qué esto es riesgo, en una frase. */
  detail: string;
  category: RiskCategory;
  points: number;
  /** Ids del catálogo de recomendaciones que esta evidencia dispara. */
  recommendations: string[];
}

export interface Rule {
  id: string;
  name: string;
  /** SI ... ENTONCES ..., para mostrar la regla tal como está escrita. */
  statement: string;
  /** Todas las condiciones se combinan con Y lógico. */
  conditions: Condition[];
  conclusion: Conclusion;
  /** Una regla puede inferir un hecho sin aportar riesgo. */
  evidence?: RiskEvidence;
  /** Mayor prioridad se evalúa primero dentro del mismo ciclo. */
  priority: number;
}

export interface Recommendation {
  id: string;
  title: string;
  action: string;
  category: RiskCategory;
  /** 1 = primero. Ordena el plan de mitigación. */
  priority: number;
}

/* ------------------------------------------------------------------ */
/* Traza de inferencia                                                 */
/* ------------------------------------------------------------------ */

export interface MatchedCondition {
  condition: Condition;
  factId: string;
  actualValue: FactValue;
  source: FactSource;
}

export interface RuleActivation {
  rule: Rule;
  cycle: number;
  matched: MatchedCondition[];
  derivedFact: Fact;
  evidence?: RiskEvidence;
  scoreBefore: number;
  scoreAfter: number;
  /** Orden global de activación (1, 2, 3...). */
  order: number;
}

export type TraceEvent =
  | { kind: 'engine-start'; factCount: number; ruleCount: number }
  | { kind: 'cycle-start'; cycle: number; candidates: number }
  | { kind: 'rule-fired'; activation: RuleActivation }
  | { kind: 'fact-derived'; fact: Fact; ruleId: string }
  | { kind: 'evidence-added'; evidence: RiskEvidence; total: number }
  | { kind: 'cycle-end'; cycle: number; fired: number }
  | { kind: 'stable'; cycles: number; activations: number }
  | { kind: 'scoring'; total: number }
  | { kind: 'verdict'; level: RiskLevel; total: number };

export interface InferenceResult {
  /** Hechos aportados por el usuario, tal cual entraron. */
  initialFacts: Fact[];
  /** Hechos producidos por el motor. */
  derivedFacts: Fact[];
  activations: RuleActivation[];
  events: TraceEvent[];
  cycles: number;
  /** Reglas que nunca cumplieron sus condiciones. */
  notFired: string[];
}

/* ------------------------------------------------------------------ */
/* Evaluación de riesgo                                                */
/* ------------------------------------------------------------------ */

export type RiskLevel = 'bajo' | 'medio' | 'alto';

export interface Threshold {
  level: RiskLevel;
  min: number;
  max: number;
  label: string;
  /** Lectura del umbral: "0 – 7 puntos". */
  range: string;
}

export interface CategoryScore {
  category: RiskCategory;
  label: string;
  points: number;
  /** Proporción respecto de la categoría más cargada. 0..1 */
  share: number;
  evidences: RiskEvidence[];
  ruleIds: string[];
}

export interface RiskAssessment {
  projectName: string;
  score: number;
  level: RiskLevel;
  threshold: Threshold;
  thresholds: Threshold[];
  /** Tope de la escala del instrumento, ya calculado para la UI. */
  scaleMax: number;
  evidences: RiskEvidence[];
  categories: CategoryScore[];
  recommendations: Recommendation[];
  inference: InferenceResult;
}
