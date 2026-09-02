import { SCENARIOS, runScenario } from '../data/scenarios.js';
import { THRESHOLDS } from '../expert-system/config.js';
import { KNOWLEDGE_BASE } from '../expert-system/knowledge-base.js';

/**
 * Suite de escenarios.
 *
 * Corre el mismo camino que usa la aplicación: respuestas → hechos →
 * motor → evaluación. Si el motor cambia y un escenario deja de dar el
 * nivel esperado, esto falla.
 */

interface Failure {
  scenario: string;
  message: string;
}

function check(failures: Failure[], scenario: string, ok: boolean, message: string): void {
  if (!ok) failures.push({ scenario, message });
}

function main(): void {
  const failures: Failure[] = [];

  console.log('');
  console.log('  EVALUADOR DE RIESGO — escenarios de prueba');
  console.log(`  base de conocimiento: ${KNOWLEDGE_BASE.length} reglas`);
  console.log(`  umbrales: ${THRESHOLDS.map((t) => `${t.label} ${t.range}`).join('  ·  ')}`);
  console.log('  ' + '─'.repeat(72));

  for (const scenario of SCENARIOS) {
    const assessment = runScenario(scenario);
    const fired = assessment.inference.activations.map((a) => a.rule.id);
    const firedSet = new Set(fired);
    const loaded = assessment.categories.filter((c) => c.points > 0);

    console.log('');
    console.log(`  ▸ ${scenario.name}`);
    console.log(
      `    esperado ${scenario.expectedLevel.toUpperCase()} · obtenido ${assessment.level.toUpperCase()} · ${assessment.score} puntos`,
    );
    console.log(
      `    ciclos: ${assessment.inference.cycles} · reglas activadas: ${fired.length} · evidencias: ${assessment.evidences.length} · recomendaciones: ${assessment.recommendations.length}`,
    );
    console.log(
      `    por categoría: ${loaded.length > 0 ? loaded.map((c) => `${c.label} ${c.points}`).join(' · ') : 'sin evidencia'}`,
    );

    check(
      failures,
      scenario.id,
      assessment.level === scenario.expectedLevel,
      `nivel esperado ${scenario.expectedLevel}, obtenido ${assessment.level} (${assessment.score} puntos)`,
    );

    for (const ruleId of scenario.mustFire) {
      check(failures, scenario.id, firedSet.has(ruleId), `la regla ${ruleId} debía activarse y no se activó`);
    }
    for (const ruleId of scenario.mustNotFire) {
      check(failures, scenario.id, !firedSet.has(ruleId), `la regla ${ruleId} no debía activarse y se activó`);
    }

    // El puntaje tiene que ser exactamente la suma de las evidencias.
    const sum = assessment.evidences.reduce((t, e) => t + e.points, 0);
    check(failures, scenario.id, sum === assessment.score, `el puntaje (${assessment.score}) no coincide con la suma de evidencias (${sum})`);

    // Refractariedad: ninguna regla se activa dos veces.
    check(failures, scenario.id, firedSet.size === fired.length, 'una regla se activó más de una vez');

    // Las categorías tienen que repartir el total sin perder ni inventar puntos.
    const byCategory = assessment.categories.reduce((t, c) => t + c.points, 0);
    check(failures, scenario.id, byCategory === assessment.score, `las categorías suman ${byCategory} y el total es ${assessment.score}`);

    // Toda recomendación tiene que estar respaldada por una evidencia real.
    const supported = new Set(assessment.evidences.flatMap((e) => e.recommendations));
    const unsupported = assessment.recommendations.filter((r) => !supported.has(r.id));
    check(failures, scenario.id, unsupported.length === 0, `recomendaciones sin evidencia: ${unsupported.map((r) => r.id).join(', ')}`);

    // Un hecho inferido siempre nombra la regla que lo produjo.
    const orphan = assessment.inference.derivedFacts.filter((f) => !f.ruleId);
    check(failures, scenario.id, orphan.length === 0, `hechos inferidos sin regla de origen: ${orphan.map((f) => f.id).join(', ')}`);

    // Las condiciones de cada activación se cumplen contra hechos existentes.
    for (const activation of assessment.inference.activations) {
      check(
        failures,
        scenario.id,
        activation.matched.length === activation.rule.conditions.length,
        `${activation.rule.id} se activó con ${activation.matched.length} de ${activation.rule.conditions.length} condiciones`,
      );
    }

    // Una regla de ciclo N sólo puede depender de hechos disponibles antes.
    for (const activation of assessment.inference.activations) {
      for (const match of activation.matched) {
        if (match.source !== 'inference') continue;
        const source = assessment.inference.derivedFacts.find((f) => f.id === match.factId);
        check(
          failures,
          scenario.id,
          !!source && source.cycle < activation.cycle,
          `${activation.rule.id} (ciclo ${activation.cycle}) usó ${match.factId}, deducido en el ciclo ${source?.cycle}`,
        );
      }
    }
  }

  // Las recomendaciones tienen que diferenciarse entre escenarios.
  const plans = SCENARIOS.map((s) => runScenario(s).recommendations.map((r) => r.id).join('|'));
  check(failures, 'global', new Set(plans).size === plans.length, 'dos escenarios produjeron exactamente las mismas recomendaciones');

  console.log('');
  console.log('  ' + '─'.repeat(72));
  if (failures.length === 0) {
    console.log(`  ✓ ${SCENARIOS.length} escenarios · todas las verificaciones pasaron`);
    console.log('');
    return;
  }
  console.log(`  ✗ ${failures.length} verificaciones fallaron`);
  for (const failure of failures) console.log(`    [${failure.scenario}] ${failure.message}`);
  console.log('');
  process.exitCode = 1;
}

main();
