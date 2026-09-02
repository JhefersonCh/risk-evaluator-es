import type {
  Condition,
  Fact,
  FactValue,
  MatchedCondition,
  RiskCategory,
} from './types.js';

/**
 * Base de hechos.
 *
 * Guarda un hecho por id. Distingue siempre el origen: los hechos del
 * usuario entran con source 'user' y ciclo 0; los que produce el motor
 * entran con source 'inference' y el ciclo en que se dedujeron.
 * Un hecho no se pisa a sí mismo: si ya existe con el mismo valor, la
 * aserción se ignora y el motor lo sabe.
 */
export class FactBase {
  private readonly facts = new Map<string, Fact>();

  constructor(initial: Fact[] = []) {
    for (const fact of initial) this.facts.set(fact.id, fact);
  }

  /** Devuelve true si el hecho es nuevo o cambió de valor. */
  assert(fact: Fact): boolean {
    const previous = this.facts.get(fact.id);
    if (previous && previous.value === fact.value) return false;
    this.facts.set(fact.id, fact);
    return true;
  }

  get(id: string): Fact | undefined {
    return this.facts.get(id);
  }

  has(id: string): boolean {
    return this.facts.has(id);
  }

  all(): Fact[] {
    return [...this.facts.values()];
  }

  bySource(source: Fact['source']): Fact[] {
    return this.all().filter((f) => f.source === source);
  }

  /** Copia inmutable, usada como snapshot al inicio de cada ciclo. */
  snapshot(): FactBase {
    return new FactBase(this.all());
  }

  size(): number {
    return this.facts.size;
  }
}

export function userFact(
  id: string,
  value: FactValue,
  category: RiskCategory,
  label: string,
): Fact {
  return { id, value, source: 'user', category, label, cycle: 0 };
}

export function inferredFact(
  id: string,
  value: FactValue,
  category: RiskCategory,
  label: string,
  ruleId: string,
  cycle: number,
): Fact {
  return { id, value, source: 'inference', category, label, ruleId, cycle };
}

/* ------------------------------------------------------------------ */
/* Evaluación de condiciones                                           */
/* ------------------------------------------------------------------ */

function compare(actual: FactValue, condition: Condition): boolean {
  const expected = condition.value;
  switch (condition.operator) {
    case 'exists':
      return true;
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'notIn':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'gt':
      return typeof actual === 'number' && actual > Number(expected);
    case 'gte':
      return typeof actual === 'number' && actual >= Number(expected);
    case 'lt':
      return typeof actual === 'number' && actual < Number(expected);
    case 'lte':
      return typeof actual === 'number' && actual <= Number(expected);
    default:
      return false;
  }
}

/**
 * Evalúa una condición contra la base de hechos.
 * Devuelve el emparejamiento cuando se cumple, o null cuando no.
 */
export function matchCondition(
  condition: Condition,
  base: FactBase,
): MatchedCondition | null {
  const fact = base.get(condition.factId);
  if (!fact) return null;
  if (!compare(fact.value, condition)) return null;
  return {
    condition,
    factId: fact.id,
    actualValue: fact.value,
    source: fact.source,
  };
}

/**
 * Todas las condiciones de una regla se combinan con Y lógico.
 * Devuelve la lista completa de emparejamientos, o null si alguna falla.
 */
export function matchAll(
  conditions: Condition[],
  base: FactBase,
): MatchedCondition[] | null {
  const matched: MatchedCondition[] = [];
  for (const condition of conditions) {
    const hit = matchCondition(condition, base);
    if (!hit) return null;
    matched.push(hit);
  }
  return matched;
}
