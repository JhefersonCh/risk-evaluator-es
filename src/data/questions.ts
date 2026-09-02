import { userFact } from '../expert-system/facts.js';
import type { Fact, RiskCategory } from '../expert-system/types.js';

/**
 * Cuestionario.
 *
 * Cada pregunta declara el hecho que produce. La UI no sabe nada del
 * dominio: recorre esta estructura y devuelve un mapa de respuestas que
 * `buildFacts` convierte en hechos con origen 'user'.
 */

export type QuestionKind = 'segmented' | 'scale' | 'text';

export interface Option {
  value: string;
  label: string;
  /** Peso indicativo, 0 = práctica sana, 2 = señal de alarma. Se dibuja como trama. */
  severity: 0 | 1 | 2;
  hint: string;
}

export interface Question {
  id: string;
  factId: string;
  kind: QuestionKind;
  label: string;
  help: string;
  category: RiskCategory;
  options?: Option[];
  /** Sólo para 'scale'. */
  min?: number;
  max?: number;
  unit?: string;
  defaultValue?: string | number;
}

export interface Step {
  id: string;
  /** Número de orden dentro del recorrido. El orden acá sí es información. */
  index: string;
  title: string;
  intent: string;
  questions: Question[];
}

export const STEPS: Step[] = [
  {
    id: 'info',
    index: '01',
    title: 'Información',
    intent: 'Identificá el proyecto y su horizonte temporal.',
    questions: [
      {
        id: 'nombre_proyecto',
        factId: 'nombre_proyecto',
        kind: 'text',
        label: 'Nombre del proyecto',
        help: 'Aparece en el informe final. Podés dejarlo vacío.',
        category: 'gestion',
        defaultValue: '',
      },
      {
        id: 'duracion_meses',
        factId: 'duracion_meses',
        kind: 'scale',
        label: 'Duración estimada',
        help: 'El motor deriva de acá el horizonte del proyecto: corto, medio o largo.',
        category: 'planificacion',
        min: 1,
        max: 24,
        unit: 'meses',
        defaultValue: 6,
      },
    ],
  },
  {
    id: 'requisitos',
    index: '02',
    title: 'Requisitos',
    intent: 'Cuánto se mueve el alcance y qué queda escrito.',
    questions: [
      {
        id: 'requisitos_cambiantes',
        factId: 'requisitos_cambiantes',
        kind: 'segmented',
        label: 'Requisitos cambiantes',
        help: 'Con qué frecuencia cambia el alcance una vez que la construcción arrancó.',
        category: 'requisitos',
        options: [
          { value: 'bajo', label: 'Bajo', severity: 0, hint: 'El alcance se mantiene estable.' },
          { value: 'medio', label: 'Medio', severity: 1, hint: 'Hay ajustes puntuales cada tanto.' },
          { value: 'alto', label: 'Alto', severity: 2, hint: 'El alcance cambia de forma constante.' },
        ],
      },
      {
        id: 'documentacion_requisitos',
        factId: 'documentacion_requisitos',
        kind: 'segmented',
        label: 'Documentación de requisitos',
        help: 'Qué tan verificable es lo que se acordó construir.',
        category: 'requisitos',
        options: [
          { value: 'completa', label: 'Completa', severity: 0, hint: 'Con criterios de aceptación escritos.' },
          { value: 'parcial', label: 'Parcial', severity: 1, hint: 'Algunas áreas quedaron sin escribir.' },
          { value: 'inexistente', label: 'Inexistente', severity: 2, hint: 'Los acuerdos son verbales.' },
        ],
      },
    ],
  },
  {
    id: 'equipo',
    index: '03',
    title: 'Equipo',
    intent: 'Quiénes construyen y qué tan estable es el grupo.',
    questions: [
      {
        id: 'tamano_equipo',
        factId: 'tamano_equipo',
        kind: 'segmented',
        label: 'Tamaño del equipo',
        help: 'Personas dedicadas a construir el producto.',
        category: 'gestion',
        options: [
          { value: 'pequeno', label: 'Pequeño', severity: 0, hint: 'Hasta 4 personas.' },
          { value: 'mediano', label: 'Mediano', severity: 0, hint: 'Entre 5 y 9 personas.' },
          { value: 'grande', label: 'Grande', severity: 1, hint: '10 personas o más.' },
        ],
      },
      {
        id: 'experiencia_equipo',
        factId: 'experiencia_equipo',
        kind: 'segmented',
        label: 'Experiencia del equipo',
        help: 'Experiencia en el dominio y en la tecnología del proyecto.',
        category: 'equipo',
        options: [
          { value: 'alta', label: 'Alta', severity: 0, hint: 'Ya construyó algo equivalente.' },
          { value: 'media', label: 'Media', severity: 1, hint: 'Domina la tecnología, no el dominio.' },
          { value: 'baja', label: 'Baja', severity: 2, hint: 'Aprende sobre el proyecto.' },
        ],
      },
      {
        id: 'rotacion_equipo',
        factId: 'rotacion_equipo',
        kind: 'segmented',
        label: 'Rotación del equipo',
        help: 'Cuánta gente entra y sale durante el proyecto.',
        category: 'equipo',
        options: [
          { value: 'baja', label: 'Baja', severity: 0, hint: 'El equipo se mantiene.' },
          { value: 'media', label: 'Media', severity: 1, hint: 'Algún cambio por trimestre.' },
          { value: 'alta', label: 'Alta', severity: 2, hint: 'Cambios frecuentes de personas.' },
        ],
      },
    ],
  },
  {
    id: 'calidad',
    index: '04',
    title: 'Calidad',
    intent: 'Qué red detiene los defectos antes de que lleguen al usuario.',
    questions: [
      {
        id: 'pruebas',
        factId: 'pruebas',
        kind: 'segmented',
        label: 'Pruebas',
        help: 'Cobertura real sobre los flujos que no pueden fallar.',
        category: 'calidad',
        options: [
          { value: 'buenas', label: 'Buenas', severity: 0, hint: 'Cubren los flujos críticos.' },
          { value: 'parciales', label: 'Parciales', severity: 1, hint: 'Cubren parte del producto.' },
          { value: 'insuficientes', label: 'Insuficientes', severity: 2, hint: 'Casi todo se prueba a mano.' },
        ],
      },
      {
        id: 'integracion_continua',
        factId: 'integracion_continua',
        kind: 'segmented',
        label: 'Integración continua',
        help: 'Si cada cambio se compila y se prueba de forma automática.',
        category: 'tecnico',
        options: [
          { value: 'si', label: 'Activa', severity: 0, hint: 'Build y pruebas en cada cambio.' },
          { value: 'parcial', label: 'Parcial', severity: 1, hint: 'Compila, pero no prueba.' },
          { value: 'no', label: 'Ausente', severity: 2, hint: 'Todo se integra a mano.' },
        ],
      },
      {
        id: 'control_versiones',
        factId: 'control_versiones',
        kind: 'segmented',
        label: 'Control de versiones',
        help: 'Flujo de ramas, revisión de cambios y trazabilidad del historial.',
        category: 'tecnico',
        options: [
          { value: 'bueno', label: 'Bueno', severity: 0, hint: 'Rama por cambio y revisión previa.' },
          { value: 'parcial', label: 'Parcial', severity: 1, hint: 'Se usa, pero sin un flujo común.' },
          { value: 'deficiente', label: 'Deficiente', severity: 2, hint: 'Sin flujo ni revisión.' },
        ],
      },
    ],
  },
  {
    id: 'planificacion',
    index: '05',
    title: 'Tiempo y planificación',
    intent: 'Si el plan sostiene el compromiso asumido.',
    questions: [
      {
        id: 'tiempo_disponible',
        factId: 'tiempo_disponible',
        kind: 'segmented',
        label: 'Tiempo disponible',
        help: 'Relación entre el plazo comprometido y el alcance acordado.',
        category: 'planificacion',
        options: [
          { value: 'holgado', label: 'Holgado', severity: 0, hint: 'El plazo tiene margen.' },
          { value: 'ajustado', label: 'Ajustado', severity: 1, hint: 'Cierra si nada sale mal.' },
          { value: 'bajo', label: 'Insuficiente', severity: 2, hint: 'El plazo no alcanza.' },
        ],
      },
      {
        id: 'planificacion',
        factId: 'planificacion',
        kind: 'segmented',
        label: 'Planificación',
        help: 'Hitos, entregables y dependencias declaradas.',
        category: 'planificacion',
        options: [
          { value: 'detallada', label: 'Detallada', severity: 0, hint: 'Con hitos y dependencias.' },
          { value: 'basica', label: 'Básica', severity: 1, hint: 'Sólo fechas generales.' },
          { value: 'inexistente', label: 'Inexistente', severity: 2, hint: 'Se avanza sin plan.' },
        ],
      },
      {
        id: 'dependencias_externas',
        factId: 'dependencias_externas',
        kind: 'segmented',
        label: 'Dependencias externas',
        help: 'Terceros de los que depende la entrega y que el equipo no controla.',
        category: 'tecnico',
        options: [
          { value: 'ninguna', label: 'Ninguna', severity: 0, hint: 'El equipo controla todo.' },
          { value: 'algunas', label: 'Algunas', severity: 1, hint: 'Existen, pero hay alternativa.' },
          { value: 'criticas', label: 'Críticas', severity: 2, hint: 'Sin ellas no hay entrega.' },
        ],
      },
    ],
  },
];

/** Todas las preguntas, en orden de recorrido. */
export const QUESTIONS: Question[] = STEPS.flatMap((s) => s.questions);

/** Preguntas que el usuario debe responder para poder correr el motor. */
export const REQUIRED_QUESTIONS: Question[] = QUESTIONS.filter(
  (q) => q.kind === 'segmented',
);

export type Answers = Record<string, string | number>;

export function defaultAnswers(): Answers {
  const answers: Answers = {};
  for (const question of QUESTIONS) {
    if (question.defaultValue !== undefined) answers[question.id] = question.defaultValue;
  }
  return answers;
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function optionLabel(question: Question, value: string | number): string {
  const option = question.options?.find((o) => o.value === value);
  return option ? option.label : String(value);
}

/**
 * Traduce las respuestas del formulario a hechos.
 * Todo lo que sale de acá lleva source 'user' y ciclo 0: es la entrada
 * cruda del sistema, nunca una deducción.
 */
export function buildFacts(answers: Answers): Fact[] {
  const facts: Fact[] = [];

  for (const question of QUESTIONS) {
    if (question.kind === 'text') continue;
    const value = answers[question.id];
    if (value === undefined || value === '') continue;

    if (question.kind === 'scale') {
      facts.push(
        userFact(
          question.factId,
          Number(value),
          question.category,
          `${question.label}: ${value} ${question.unit ?? ''}`.trim(),
        ),
      );
      continue;
    }

    facts.push(
      userFact(
        question.factId,
        String(value),
        question.category,
        `${question.label}: ${optionLabel(question, value)}`,
      ),
    );
  }

  return facts;
}

export function projectNameFrom(answers: Answers): string {
  const raw = String(answers['nombre_proyecto'] ?? '').trim();
  return raw.length > 0 ? raw : 'Proyecto sin nombre';
}
