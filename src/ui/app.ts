import {
  buildFacts,
  defaultAnswers,
  projectNameFrom,
  type Answers,
} from '../data/questions.js';
import { scenarioById } from '../data/scenarios.js';
import { evaluateProject } from '../expert-system/risk-engine.js';
import type { RiskAssessment } from '../expert-system/types.js';
import { clear, el } from './components.js';
import { renderAnalysis } from './inference-view.js';
import { renderLanding } from './landing.js';
import { renderResult } from './risk-result.js';
import { renderWizard } from './wizard.js';

/**
 * Controlador de la aplicación.
 *
 * Sostiene el estado, decide qué pantalla se muestra y es el único punto
 * donde se llama al evaluador. Las pantallas reciben datos ya calculados
 * y avisan por callbacks: ninguna corre el motor por su cuenta.
 */

type ScreenName = 'landing' | 'wizard' | 'analysis' | 'result';

const ENGINE_STATE: Record<ScreenName, { state: string; label: string }> = {
  landing: { state: 'idle', label: 'Motor en espera' },
  wizard: { state: 'idle', label: 'Cargando hechos' },
  analysis: { state: 'running', label: 'Ejecutando reglas' },
  result: { state: 'stable', label: 'Inferencia estable' },
};

export function createApp(root: HTMLElement): void {
  let answers: Answers = defaultAnswers();
  let assessment: RiskAssessment | null = null;
  let stopAnalysis: (() => void) | null = null;

  const engineDot = el('span', { class: 'engine-state__dot', 'aria-hidden': 'true' });
  const engineLabel = el('span', { text: ENGINE_STATE.landing.label });
  const engineState = el(
    'p',
    { class: 'engine-state', 'data-state': 'idle', role: 'status' },
    engineDot,
    engineLabel,
  );

  const stage = el('main', { class: 'flex flex-1 flex-col' });

  const topbar = el(
    'header',
    {
      class:
        'sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:px-6',
    },
    el(
      'div',
      { class: 'flex min-w-0 items-baseline gap-3' },
      el('span', {
        class: 'font-display text-[0.9375rem] font-bold whitespace-nowrap font-stretch-[118%]',
        text: 'Evaluador de riesgo',
      }),
      el('span', {
        class:
          'hidden truncate font-mono text-xs tracking-[0.12em] uppercase text-graphite sm:inline',
        text: 'Sistema experto de proyectos de software',
      }),
    ),
    engineState,
  );

  root.append(
    el('div', { class: 'flex min-h-screen flex-col' }, topbar, stage),
  );

  /* ---------------------------------------------------------------- */
  /* Cambio de pantalla                                                */
  /* ---------------------------------------------------------------- */

  function show(name: ScreenName, node: HTMLElement): void {
    stopAnalysis?.();
    stopAnalysis = null;

    const engine = ENGINE_STATE[name];
    engineState.setAttribute('data-state', engine.state);
    engineLabel.textContent = engine.label;

    clear(stage);
    stage.appendChild(node);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------------------------------------------------------------- */
  /* Pantallas                                                         */
  /* ---------------------------------------------------------------- */

  function goLanding(): void {
    answers = defaultAnswers();
    assessment = null;
    show(
      'landing',
      renderLanding({
        onStart: goWizard,
        onScenario: loadScenario,
      }),
    );
  }

  function goWizard(): void {
    show('wizard', renderWizard(answers, { onRun: runEngine, onExit: goLanding }));
  }

  function runEngine(): void {
    // Punto único de ejecución del motor. La pantalla de análisis sólo
    // reproduce la traza que sale de acá.
    assessment = evaluateProject(buildFacts(answers), projectNameFrom(answers));
    goAnalysis();
  }

  function goAnalysis(): void {
    if (!assessment) return goWizard();
    const analysis = renderAnalysis(assessment, { onDone: goResult });
    show('analysis', analysis.el);
    stopAnalysis = analysis.stop;
  }

  function goResult(): void {
    if (!assessment) return goWizard();
    show(
      'result',
      renderResult(assessment, { onRestart: goLanding, onEdit: goWizard }),
    );
  }

  /** Carga un caso de referencia y lo corre de punta a punta. */
  function loadScenario(id: string): void {
    const scenario = scenarioById(id);
    if (!scenario) return;
    answers = { ...scenario.answers };
    runEngine();
  }

  goLanding();
}
