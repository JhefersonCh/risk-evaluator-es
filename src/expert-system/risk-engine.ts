import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  THRESHOLDS,
  levelFor,
  scaleMaxFor,
} from './config.js';
import { runInference } from './inference-engine.js';
import { buildRecommendations } from './recommendations.js';
import type {
  CategoryScore,
  Fact,
  RiskAssessment,
  RiskCategory,
  RiskEvidence,
} from './types.js';

/**
 * Evaluador de riesgo.
 *
 * Corre el motor de inferencia, acumula la evidencia que las reglas
 * activadas aportaron y traduce ese total a un nivel usando los umbrales
 * de config.ts. No decide nada por su cuenta: todo lo que reporta sale de
 * la traza.
 */
export function evaluateProject(
  facts: Fact[],
  projectName = 'Proyecto sin nombre',
): RiskAssessment {
  const inference = runInference(facts);

  const evidences: RiskEvidence[] = inference.activations
    .map((a) => a.evidence)
    .filter((e): e is RiskEvidence => Boolean(e));

  const score = evidences.reduce((total, e) => total + e.points, 0);
  const threshold = levelFor(score);

  const categories = buildCategoryScores(inference.activations);
  const categoryPoints = new Map(categories.map((c) => [c.category, c.points]));
  const recommendations = buildRecommendations(evidences, categoryPoints);

  inference.events.push({ kind: 'scoring', total: score });
  inference.events.push({ kind: 'verdict', level: threshold.level, total: score });

  return {
    projectName,
    score,
    level: threshold.level,
    threshold,
    thresholds: THRESHOLDS,
    scaleMax: scaleMaxFor(score),
    evidences,
    categories,
    recommendations,
    inference,
  };
}

/**
 * Agrupa la evidencia por categoría de riesgo.
 * `share` se calcula contra la categoría más cargada, no contra el total:
 * la barra responde "dónde se concentra el riesgo", no "qué porcentaje es".
 */
function buildCategoryScores(
  activations: RiskAssessment['inference']['activations'],
): CategoryScore[] {
  const buckets = new Map<RiskCategory, CategoryScore>();

  for (const category of CATEGORY_ORDER) {
    buckets.set(category, {
      category,
      label: CATEGORY_LABELS[category],
      points: 0,
      share: 0,
      evidences: [],
      ruleIds: [],
    });
  }

  for (const activation of activations) {
    const evidence = activation.evidence;
    if (!evidence) continue;
    const bucket = buckets.get(evidence.category);
    if (!bucket) continue;
    bucket.points += evidence.points;
    bucket.evidences.push(evidence);
    bucket.ruleIds.push(activation.rule.id);
  }

  const all = [...buckets.values()];
  const peak = Math.max(1, ...all.map((c) => c.points));
  for (const bucket of all) bucket.share = bucket.points / peak;

  return all.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });
}
