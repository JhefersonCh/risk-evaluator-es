import type { Condition, Conclusion, Rule, RiskCategory, RiskEvidence } from './types.js';

/* ------------------------------------------------------------------ */
/* Constructores: azúcar para declarar reglas como datos               */
/* ------------------------------------------------------------------ */

export function eq(factId: string, value: string | number | boolean, label: string): Condition {
  return { factId, operator: 'eq', value, label };
}

export function oneOf(factId: string, values: (string | number)[], label: string): Condition {
  return { factId, operator: 'in', value: values, label };
}

export function gt(factId: string, value: number, label: string): Condition {
  return { factId, operator: 'gt', value, label };
}

export function lte(factId: string, value: number, label: string): Condition {
  return { factId, operator: 'lte', value, label };
}

export function concludes(factId: string, value: string | number | boolean, label: string): Conclusion {
  return { factId, value, label };
}

export function evidence(
  id: string,
  label: string,
  detail: string,
  category: RiskCategory,
  points: number,
  recommendations: string[],
): RiskEvidence {
  return { id, label, detail, category, points, recommendations };
}

/**
 * Fábrica de reglas.
 *
 * Toda la lógica del dominio vive en objetos de datos. El motor de
 * inferencia nunca conoce una regla concreta: sólo sabe evaluar
 * condiciones y asertar conclusiones. Agregar una regla nueva a
 * knowledge-base.ts no obliga a tocar el motor.
 */
export function rule(spec: {
  id: string;
  name: string;
  statement: string;
  conditions: Condition[];
  conclusion: Conclusion;
  evidence?: RiskEvidence;
  priority?: number;
}): Rule {
  return {
    id: spec.id,
    name: spec.name,
    statement: spec.statement,
    conditions: spec.conditions,
    conclusion: spec.conclusion,
    evidence: spec.evidence,
    priority: spec.priority ?? 50,
  };
}
