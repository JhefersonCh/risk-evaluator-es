import {
  REQUIRED_QUESTIONS,
  STEPS,
  optionLabel,
  type Answers,
  type Question,
  type Step,
} from '../data/questions.js';
import { clear, el, eyebrow, screen, wrap } from './components.js';

/**
 * Recorrido guiado.
 *
 * Mantiene su propio DOM y escribe directo sobre el objeto de respuestas.
 * El controlador sólo se entera cuando el usuario pide correr el motor.
 * Los pasos están numerados porque el orden acá es información real: cada
 * paso agrupa los hechos de una dimensión del proyecto.
 */

interface WizardHandlers {
  onRun: () => void;
  onExit: () => void;
}

export function renderWizard(answers: Answers, handlers: WizardHandlers): HTMLElement {
  let current = 0;

  const railSteps: HTMLButtonElement[] = [];
  const progressText = el('span', { text: '' });
  const progressBar = el('span', {
    class: 'block h-full bg-ink transition-[width] duration-[420ms] ease-emph',
  });
  const panel = el('div', {});

  const isStepComplete = (step: Step): boolean =>
    step.questions
      .filter((q) => q.kind === 'segmented')
      .every((q) => answers[q.id] !== undefined);

  const answeredCount = (): number =>
    REQUIRED_QUESTIONS.filter((q) => answers[q.id] !== undefined).length;

  const allAnswered = (): boolean => answeredCount() === REQUIRED_QUESTIONS.length;

  const refreshRail = (): void => {
    const answered = answeredCount();
    const total = REQUIRED_QUESTIONS.length;
    progressText.textContent = `${answered} de ${total} hechos`;
    progressBar.style.width = `${(answered / total) * 100}%`;

    railSteps.forEach((button, index) => {
      button.setAttribute('data-done', String(isStepComplete(STEPS[index])));
      if (index === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };

  /* ---------------------------------------------------------------- */
  /* Controles                                                         */
  /* ---------------------------------------------------------------- */

  const buildSegmented = (question: Question, onChange: () => void): HTMLElement => {
    const group = el('div', {
      class: 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3',
      role: 'radiogroup',
      'aria-labelledby': `label-${question.id}`,
    });

    for (const option of question.options ?? []) {
      const input = el('input', {
        type: 'radio',
        name: question.id,
        value: option.value,
        checked: answers[question.id] === option.value,
        onChange: () => {
          answers[question.id] = option.value;
          onChange();
        },
      });

      // La trama del indicador se densifica con la severidad: quien no
      // distingue los colores igual lee la diferencia.
      const gap = option.severity === 0 ? '14px' : option.severity === 1 ? '6px' : '3px';
      const tone =
        option.severity === 0 ? 'text-low' : option.severity === 1 ? 'text-mid' : 'text-high';

      group.appendChild(
        el(
          'label',
          { class: 'seg-opt' },
          input,
          el(
            'span',
            { class: 'flex items-center justify-between gap-2' },
            el('span', { class: 'text-sm font-semibold', text: option.label }),
            el('span', {
              class: `hatch h-3 w-6.5 shrink-0 rounded-[1px] border border-current ${tone}`,
              style: { '--hatch-gap': gap } as unknown as CSSStyleDeclaration,
              'aria-hidden': 'true',
            }),
          ),
          el('span', {
            class: 'seg-opt__hint mt-2 block text-xs leading-normal text-graphite',
            text: option.hint,
          }),
        ),
      );
    }

    return group;
  };

  const buildScale = (question: Question, onChange: () => void): HTMLElement => {
    const value = Number(answers[question.id] ?? question.defaultValue ?? question.min ?? 1);
    const readout = el('span', { text: String(value) });

    const input = el('input', {
      class: 'scale-input',
      type: 'range',
      id: `input-${question.id}`,
      min: String(question.min ?? 1),
      max: String(question.max ?? 24),
      step: '1',
      value: String(value),
      'aria-describedby': `fact-${question.id}`,
      onInput: (event: Event) => {
        const next = Number((event.target as HTMLInputElement).value);
        answers[question.id] = next;
        readout.textContent = String(next);
        onChange();
      },
    });

    return el(
      'div',
      { class: 'grid max-w-130 gap-3' },
      el(
        'p',
        { class: 'flex items-baseline gap-2 font-display text-3xl/none font-bold tabular' },
        readout,
        el('span', {
          class: 'font-mono text-xs font-normal tracking-[0.12em] uppercase text-graphite',
          text: question.unit ?? '',
        }),
      ),
      input,
      el(
        'div',
        { class: 'flex justify-between font-mono text-xs text-graphite' },
        el('span', { text: `${question.min} ${question.unit ?? ''}` }),
        el('span', { text: `${question.max} ${question.unit ?? ''}` }),
      ),
    );
  };

  const buildText = (question: Question, onChange: () => void): HTMLElement =>
    el('input', {
      class: 'field',
      type: 'text',
      id: `input-${question.id}`,
      value: String(answers[question.id] ?? ''),
      placeholder: 'Proyecto sin nombre',
      onInput: (event: Event) => {
        answers[question.id] = (event.target as HTMLInputElement).value;
        onChange();
      },
    });

  /* ---------------------------------------------------------------- */
  /* Pregunta                                                          */
  /* ---------------------------------------------------------------- */

  const buildQuestion = (question: Question, index: number): HTMLElement => {
    const factLine = el('p', {
      class: 'mt-3 font-mono text-xs tracking-[0.04em] text-graphite',
      id: `fact-${question.id}`,
    });

    // La línea de hecho hace visible la traducción respuesta → hecho.
    const refreshFact = (): void => {
      const value = answers[question.id];
      if (question.kind === 'text') {
        factLine.textContent = 'No genera un hecho: sólo identifica el informe.';
        return;
      }
      if (value === undefined || value === '') {
        factLine.textContent = 'Sin responder — todavía no genera un hecho.';
        return;
      }
      clear(factLine);
      factLine.append(
        document.createTextNode('Hecho → '),
        el('b', {
          class: 'font-medium text-signal-deep',
          text:
            question.kind === 'scale'
              ? `${question.factId} = ${value}`
              : `${question.factId} = ${optionLabel(question, value)}`,
        }),
      );
    };

    const onChange = (): void => {
      refreshFact();
      refreshRail();
      refreshFooter();
    };

    const control =
      question.kind === 'segmented'
        ? buildSegmented(question, onChange)
        : question.kind === 'scale'
          ? buildScale(question, onChange)
          : buildText(question, onChange);

    refreshFact();

    const labelClass =
      'block font-display text-[1.0625rem] font-semibold tracking-[-0.005em] font-stretch-[108%]';

    const labelNode =
      question.kind === 'segmented'
        ? el('span', { class: labelClass, id: `label-${question.id}`, text: question.label })
        : el('label', {
            class: labelClass,
            id: `label-${question.id}`,
            for: `input-${question.id}`,
            text: question.label,
          });

    return el(
      'div',
      {
        class: 'animate-rise',
        style: { animationDelay: `${index * 55}ms` },
      },
      labelNode,
      el('p', { class: 'mt-1 max-w-[58ch] text-sm text-graphite', text: question.help }),
      el('div', { class: 'mt-4' }, control),
      factLine,
    );
  };

  /* ---------------------------------------------------------------- */
  /* Pie del panel                                                     */
  /* ---------------------------------------------------------------- */

  const nextButton = el(
    'button',
    { class: 'btn', type: 'button', onClick: () => goTo(current + 1) },
    'Siguiente',
    el('span', { class: 'btn__arrow', text: '→', 'aria-hidden': 'true' }),
  );

  const runButton = el(
    'button',
    { class: 'btn', type: 'button', onClick: () => handlers.onRun() },
    'Ejecutar el motor',
    el('span', { class: 'btn__arrow', text: '→', 'aria-hidden': 'true' }),
  );

  const hint = el('p', { class: 'font-mono text-xs tracking-[0.06em] text-graphite' });
  const footActions = el('div', { class: 'flex flex-wrap gap-3' });
  const foot = el(
    'div',
    {
      class:
        'mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6',
    },
    hint,
    footActions,
  );

  function refreshFooter(): void {
    clear(footActions);
    const isLast = current === STEPS.length - 1;

    footActions.append(
      current === 0
        ? el('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Volver a la portada',
            onClick: handlers.onExit,
          })
        : el('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Anterior',
            onClick: () => goTo(current - 1),
          }),
      isLast ? runButton : nextButton,
    );

    const missing = REQUIRED_QUESTIONS.length - answeredCount();

    if (isLast) {
      runButton.disabled = !allAnswered();
      hint.className = `font-mono text-xs tracking-[0.06em] ${missing > 0 ? 'text-high' : 'text-graphite'}`;
      hint.textContent =
        missing > 0
          ? `Faltan ${missing} ${missing === 1 ? 'respuesta' : 'respuestas'} para poder ejecutar el motor.`
          : `Listo: ${REQUIRED_QUESTIONS.length} hechos cargados.`;
      return;
    }

    hint.className = 'font-mono text-xs tracking-[0.06em] text-graphite';
    hint.textContent = `Paso ${STEPS[current].index} de ${STEPS[STEPS.length - 1].index}`;
  }

  /* ---------------------------------------------------------------- */
  /* Navegación                                                        */
  /* ---------------------------------------------------------------- */

  function goTo(index: number): void {
    if (index < 0 || index >= STEPS.length) return;
    current = index;
    renderPanel();
    refreshRail();
    panel.querySelector<HTMLElement>('[data-panel-title]')?.focus();
  }

  function renderPanel(): void {
    const step = STEPS[current];
    clear(panel);

    panel.append(
      el(
        'header',
        { class: 'border-b border-line pb-6' },
        eyebrow(`Paso ${step.index} — ${step.title}`),
        el('h2', {
          class: 'mt-3 text-h1',
          tabindex: '-1',
          'data-panel-title': 'true',
          text: step.title,
        }),
        el('p', { class: 'mt-3 max-w-[52ch] text-ink-2', text: step.intent }),
      ),
      el(
        'div',
        { class: 'mt-8 grid gap-8' },
        step.questions.map((question, index) => buildQuestion(question, index)),
      ),
      foot,
    );

    refreshFooter();
  }

  /* ---------------------------------------------------------------- */
  /* Riel de progreso                                                  */
  /* ---------------------------------------------------------------- */

  const rail = el(
    'nav',
    { class: 'lg:sticky lg:top-[76px]', 'aria-label': 'Pasos de la evaluación' },
    el(
      'div',
      {
        class:
          'flex items-baseline justify-between gap-2 border-b border-line pb-3 font-mono text-xs tracking-[0.1em] uppercase text-graphite',
      },
      el('span', { text: 'Progreso' }),
      progressText,
    ),
    el('div', { class: 'mt-3 h-0.5 overflow-hidden bg-line-soft' }, progressBar),
    el(
      'div',
      { class: 'mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1' },
      STEPS.map((step, index) => {
        const button = el(
          'button',
          { class: 'rail-step', type: 'button', onClick: () => goTo(index) },
          el('span', {
            class: 'rail-step__index font-mono text-xs tracking-[0.08em]',
            text: step.index,
          }),
          el('span', { class: 'text-sm font-medium', text: step.title }),
        );
        railSteps.push(button);
        return button;
      }),
    ),
  );

  renderPanel();
  refreshRail();

  return screen(
    wrap(
      el(
        'div',
        {
          class:
            'grid items-start gap-10 py-10 pb-24 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:py-12',
        },
        rail,
        panel,
      ),
    ),
  );
}
