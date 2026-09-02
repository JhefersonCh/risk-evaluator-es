import { FactBase, inferredFact, matchAll } from './facts.js';
import { MAX_CYCLES } from './config.js';
import { DERIVED_FACT_CATEGORY, KNOWLEDGE_BASE } from './knowledge-base.js';
import type {
  Fact,
  InferenceResult,
  Rule,
  RuleActivation,
  TraceEvent,
} from './types.js';

/**
 * Motor de inferencia — encadenamiento hacia adelante.
 *
 * El motor no conoce ninguna regla concreta. Recibe hechos y una base de
 * conocimiento, y repite este ciclo hasta que nada más cambia:
 *
 *   1. Toma una foto de la base de hechos al inicio del ciclo.
 *   2. Busca las reglas cuyas condiciones se cumplen contra esa foto.
 *   3. Las activa por prioridad y registra cada activación.
 *   4. Aserta las conclusiones en la base de hechos viva.
 *   5. Si el ciclo activó al menos una regla, vuelve al paso 1.
 *
 * La foto por ciclo es deliberada: separa las generaciones de razonamiento.
 * Las reglas que miran hechos del usuario se activan en el ciclo 1; las que
 * miran hechos inferidos por aquéllas, en el ciclo 2, y así sucesivamente.
 * Sin la foto, todo colapsaría en un solo ciclo y la cadena de razonamiento
 * dejaría de ser legible.
 *
 * Refractariedad: una regla se activa una sola vez por ejecución. El conjunto
 * `fired` es lo que garantiza la terminación junto con el corte de MAX_CYCLES.
 */
export function runInference(
  initialFacts: Fact[],
  rules: Rule[] = KNOWLEDGE_BASE,
): InferenceResult {
  const base = new FactBase(initialFacts);
  const events: TraceEvent[] = [];
  const activations: RuleActivation[] = [];
  const fired = new Set<string>();

  let score = 0;
  let cycle = 0;
  let order = 0;

  events.push({
    kind: 'engine-start',
    factCount: initialFacts.length,
    ruleCount: rules.length,
  });

  let firedThisCycle = 0;
  do {
    cycle += 1;
    firedThisCycle = 0;

    // Foto del estado al inicio del ciclo: define la generación actual.
    const snapshot = base.snapshot();
    const candidates: { rule: Rule; matched: NonNullable<ReturnType<typeof matchAll>> }[] = [];

    for (const rule of rules) {
      if (fired.has(rule.id)) continue;
      const matched = matchAll(rule.conditions, snapshot);
      if (matched) candidates.push({ rule, matched });
    }

    if (candidates.length === 0) {
      events.push({ kind: 'cycle-end', cycle, fired: 0 });
      break;
    }

    events.push({ kind: 'cycle-start', cycle, candidates: candidates.length });
    candidates.sort((a, b) => b.rule.priority - a.rule.priority);

    for (const { rule, matched } of candidates) {
      const scoreBefore = score;
      const points = rule.evidence?.points ?? 0;
      score += points;

      const derivedFact = inferredFact(
        rule.conclusion.factId,
        rule.conclusion.value,
        DERIVED_FACT_CATEGORY[rule.conclusion.factId] ?? rule.evidence?.category ?? 'gestion',
        rule.conclusion.label,
        rule.id,
        cycle,
      );

      const activation: RuleActivation = {
        rule,
        cycle,
        matched,
        derivedFact,
        evidence: rule.evidence,
        scoreBefore,
        scoreAfter: score,
        order: ++order,
      };

      fired.add(rule.id);
      base.assert(derivedFact);
      activations.push(activation);
      firedThisCycle += 1;

      events.push({ kind: 'rule-fired', activation });
      events.push({ kind: 'fact-derived', fact: derivedFact, ruleId: rule.id });
      if (rule.evidence) {
        events.push({ kind: 'evidence-added', evidence: rule.evidence, total: score });
      }
    }

    events.push({ kind: 'cycle-end', cycle, fired: firedThisCycle });
  } while (firedThisCycle > 0 && cycle < MAX_CYCLES);

  events.push({ kind: 'stable', cycles: cycle, activations: activations.length });

  const notFired = rules.filter((r) => !fired.has(r.id)).map((r) => r.id);

  return {
    initialFacts: base.bySource('user'),
    derivedFacts: base.bySource('inference'),
    activations,
    events,
    cycles: cycle,
    notFired,
  };
}
