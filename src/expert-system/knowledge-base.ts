import { concludes, eq, evidence, gt, lte, oneOf, rule } from './rules.js';
import type { RiskCategory, Rule } from './types.js';

/**
 * Base de conocimiento.
 *
 * Reglas declaradas como datos, agrupadas por generación:
 *
 *  - Normalización (R-D*): traducen valores numéricos a categorías. No
 *    aportan riesgo; existen para que otras reglas puedan razonar sobre
 *    ellas. Demuestran inferencia sin evidencia.
 *  - Primer nivel (R-01..R-26): observan hechos del usuario.
 *  - Segundo nivel (R-30..R-33): observan hechos inferidos por el primer nivel.
 *  - Tercer nivel (R-34): observa hechos del segundo nivel.
 *
 * Esa escalera es lo que hace visible el encadenamiento hacia adelante:
 * un proyecto en mal estado recorre cuatro ciclos antes de estabilizarse.
 */

/** Categoría a la que pertenece cada hecho inferido, para agruparlo en la UI. */
export const DERIVED_FACT_CATEGORY: Record<string, RiskCategory> = {
  horizonte: 'planificacion',
  riesgo_requisitos: 'requisitos',
  deuda_especificacion: 'requisitos',
  alcance_no_controlado: 'requisitos',
  capacidad_tecnica: 'equipo',
  riesgo_coordinacion: 'gestion',
  perdida_conocimiento: 'equipo',
  sobrecarga_gestion: 'gestion',
  cobertura_pruebas: 'calidad',
  riesgo_calidad: 'calidad',
  validacion_manual: 'calidad',
  riesgo_tecnico: 'tecnico',
  automatizacion: 'tecnico',
  riesgo_integracion: 'tecnico',
  riesgo_dependencias: 'tecnico',
  presion_cronograma: 'planificacion',
  riesgo_planificacion: 'planificacion',
  volatilidad_prolongada: 'planificacion',
  riesgo_entrega: 'planificacion',
  fragilidad_entrega: 'calidad',
  colision_alcance_tiempo: 'planificacion',
  riesgo_defectos: 'calidad',
  continuidad_equipo: 'equipo',
  riesgo_sistemico: 'gestion',
};

/* ------------------------------------------------------------------ */
/* Normalización — sin puntaje                                         */
/* ------------------------------------------------------------------ */

const normalizacion: Rule[] = [
  rule({
    id: 'R-D1',
    name: 'Horizonte corto',
    statement: 'SI duración ≤ 3 meses ENTONCES horizonte = corto',
    priority: 100,
    conditions: [lte('duracion_meses', 3, 'duración ≤ 3 meses')],
    conclusion: concludes('horizonte', 'corto', 'Horizonte del proyecto: corto'),
  }),
  rule({
    id: 'R-D2',
    name: 'Horizonte medio',
    statement: 'SI duración > 3 meses Y duración ≤ 9 meses ENTONCES horizonte = medio',
    priority: 100,
    conditions: [
      gt('duracion_meses', 3, 'duración > 3 meses'),
      lte('duracion_meses', 9, 'duración ≤ 9 meses'),
    ],
    conclusion: concludes('horizonte', 'medio', 'Horizonte del proyecto: medio'),
  }),
  rule({
    id: 'R-D3',
    name: 'Horizonte largo',
    statement: 'SI duración > 9 meses ENTONCES horizonte = largo',
    priority: 100,
    conditions: [gt('duracion_meses', 9, 'duración > 9 meses')],
    conclusion: concludes('horizonte', 'largo', 'Horizonte del proyecto: largo'),
  }),
];

/* ------------------------------------------------------------------ */
/* Requisitos                                                          */
/* ------------------------------------------------------------------ */

const requisitos: Rule[] = [
  rule({
    id: 'R-01',
    name: 'Volatilidad alta de requisitos',
    statement: 'SI requisitos cambiantes = alto ENTONCES riesgo de requisitos = alto (+3)',
    priority: 90,
    conditions: [eq('requisitos_cambiantes', 'alto', 'requisitos cambiantes = alto')],
    conclusion: concludes('riesgo_requisitos', 'alto', 'Riesgo de requisitos: alto'),
    evidence: evidence(
      'E-REQ-VOLATIL',
      'Requisitos cambiantes',
      'El alcance se mueve durante la ejecución, así que toda estimación nace vencida.',
      'requisitos',
      3,
      ['REC-GESTION-CAMBIOS', 'REC-BASELINE-REQ'],
    ),
  }),
  rule({
    id: 'R-02',
    name: 'Volatilidad moderada de requisitos',
    statement: 'SI requisitos cambiantes = medio ENTONCES riesgo de requisitos = medio (+1)',
    priority: 89,
    conditions: [eq('requisitos_cambiantes', 'medio', 'requisitos cambiantes = medio')],
    conclusion: concludes('riesgo_requisitos', 'medio', 'Riesgo de requisitos: medio'),
    evidence: evidence(
      'E-REQ-MOVIL',
      'Requisitos con cambios frecuentes',
      'Los ajustes son manejables, pero sin un canal formal se acumulan sin control.',
      'requisitos',
      1,
      ['REC-GESTION-CAMBIOS'],
    ),
  }),
  rule({
    id: 'R-03',
    name: 'Requisitos sin documentar',
    statement: 'SI documentación de requisitos = inexistente ENTONCES deuda de especificación = alta (+3)',
    priority: 88,
    conditions: [eq('documentacion_requisitos', 'inexistente', 'documentación = inexistente')],
    conclusion: concludes('deuda_especificacion', 'alta', 'Deuda de especificación: alta'),
    evidence: evidence(
      'E-REQ-SIN-DOC',
      'Requisitos sin documentar',
      'Nadie puede verificar lo que no está escrito, así que "terminado" queda a interpretación.',
      'requisitos',
      3,
      ['REC-DOC-REQ', 'REC-DEFINICION-HECHO'],
    ),
  }),
  rule({
    id: 'R-04',
    name: 'Documentación parcial de requisitos',
    statement: 'SI documentación de requisitos = parcial ENTONCES deuda de especificación = media (+1)',
    priority: 87,
    conditions: [eq('documentacion_requisitos', 'parcial', 'documentación = parcial')],
    conclusion: concludes('deuda_especificacion', 'media', 'Deuda de especificación: media'),
    evidence: evidence(
      'E-REQ-DOC-PARCIAL',
      'Documentación de requisitos incompleta',
      'Las zonas sin documentar son donde más discute el equipo con el cliente.',
      'requisitos',
      1,
      ['REC-DOC-REQ'],
    ),
  }),
  rule({
    id: 'R-05',
    name: 'Alcance sin control',
    statement:
      'SI requisitos cambiantes = alto Y documentación ∈ {parcial, inexistente} ENTONCES alcance no controlado (+3)',
    priority: 86,
    conditions: [
      eq('requisitos_cambiantes', 'alto', 'requisitos cambiantes = alto'),
      oneOf('documentacion_requisitos', ['parcial', 'inexistente'], 'documentación ∈ {parcial, inexistente}'),
    ],
    conclusion: concludes('alcance_no_controlado', true, 'Alcance no controlado'),
    evidence: evidence(
      'E-REQ-ALCANCE',
      'Alcance sin control',
      'El alcance cambia y no queda registro de contra qué cambió: no hay línea base para negociar.',
      'requisitos',
      3,
      ['REC-ALCANCE', 'REC-BASELINE-REQ', 'REC-STAKEHOLDERS'],
    ),
  }),
];

/* ------------------------------------------------------------------ */
/* Equipo y gestión                                                    */
/* ------------------------------------------------------------------ */

const equipo: Rule[] = [
  rule({
    id: 'R-06',
    name: 'Experiencia baja del equipo',
    statement: 'SI experiencia = baja ENTONCES capacidad técnica = baja (+2)',
    priority: 85,
    conditions: [eq('experiencia_equipo', 'baja', 'experiencia = baja')],
    conclusion: concludes('capacidad_tecnica', 'baja', 'Capacidad técnica: baja'),
    evidence: evidence(
      'E-EQ-EXP-BAJA',
      'Experiencia baja del equipo',
      'El equipo aprende sobre el proyecto, y ese aprendizaje se paga en tiempo y en defectos.',
      'equipo',
      2,
      ['REC-MENTORIA'],
    ),
  }),
  rule({
    id: 'R-07',
    name: 'Experiencia intermedia del equipo',
    statement: 'SI experiencia = media ENTONCES capacidad técnica = media (+1)',
    priority: 84,
    conditions: [eq('experiencia_equipo', 'media', 'experiencia = media')],
    conclusion: concludes('capacidad_tecnica', 'media', 'Capacidad técnica: media'),
    evidence: evidence(
      'E-EQ-EXP-MEDIA',
      'Experiencia intermedia del equipo',
      'Resuelve lo conocido con solvencia; lo nuevo le va a costar más de lo estimado.',
      'equipo',
      1,
      ['REC-MENTORIA'],
    ),
  }),
  rule({
    id: 'R-08',
    name: 'Equipo grande con poca experiencia',
    statement: 'SI experiencia = baja Y tamaño = grande ENTONCES riesgo de coordinación = alto (+3)',
    priority: 83,
    conditions: [
      eq('experiencia_equipo', 'baja', 'experiencia = baja'),
      eq('tamano_equipo', 'grande', 'tamaño del equipo = grande'),
    ],
    conclusion: concludes('riesgo_coordinacion', 'alto', 'Riesgo de coordinación: alto'),
    evidence: evidence(
      'E-GES-COORD',
      'Equipo grande con poca experiencia',
      'Sumar personas sin criterio técnico multiplica los canales de comunicación, no la producción.',
      'gestion',
      3,
      ['REC-SUBEQUIPOS', 'REC-MENTORIA'],
    ),
  }),
  rule({
    id: 'R-09',
    name: 'Rotación alta',
    statement: 'SI rotación = alta ENTONCES pérdida de conocimiento = alta (+3)',
    priority: 82,
    conditions: [eq('rotacion_equipo', 'alta', 'rotación = alta')],
    conclusion: concludes('perdida_conocimiento', 'alta', 'Pérdida de conocimiento: alta'),
    evidence: evidence(
      'E-EQ-ROTACION',
      'Rotación alta del equipo',
      'Cada salida se lleva contexto que no está escrito y que el reemplazo tarda semanas en recuperar.',
      'equipo',
      3,
      ['REC-DOC-CONOCIMIENTO', 'REC-ONBOARDING'],
    ),
  }),
  rule({
    id: 'R-10',
    name: 'Rotación moderada',
    statement: 'SI rotación = media ENTONCES pérdida de conocimiento = media (+1)',
    priority: 81,
    conditions: [eq('rotacion_equipo', 'media', 'rotación = media')],
    conclusion: concludes('perdida_conocimiento', 'media', 'Pérdida de conocimiento: media'),
    evidence: evidence(
      'E-EQ-ROT-MEDIA',
      'Rotación moderada del equipo',
      'Los cambios de personas son absorbibles, siempre que el conocimiento no viva en una sola cabeza.',
      'equipo',
      1,
      ['REC-DOC-CONOCIMIENTO'],
    ),
  }),
  rule({
    id: 'R-11',
    name: 'Equipo grande sin planificación',
    statement:
      'SI tamaño = grande Y planificación ∈ {básica, inexistente} ENTONCES sobrecarga de gestión (+2)',
    priority: 80,
    conditions: [
      eq('tamano_equipo', 'grande', 'tamaño del equipo = grande'),
      oneOf('planificacion', ['basica', 'inexistente'], 'planificación ∈ {básica, inexistente}'),
    ],
    conclusion: concludes('sobrecarga_gestion', true, 'Sobrecarga de gestión'),
    evidence: evidence(
      'E-GES-SOBRECARGA',
      'Equipo grande sin plan que lo sostenga',
      'Con muchas personas y poco plan, la coordinación se resuelve en reuniones y el avance se frena.',
      'gestion',
      2,
      ['REC-PLAN', 'REC-SUBEQUIPOS'],
    ),
  }),
];

/* ------------------------------------------------------------------ */
/* Calidad                                                             */
/* ------------------------------------------------------------------ */

const calidad: Rule[] = [
  rule({
    id: 'R-12',
    name: 'Pruebas insuficientes',
    statement: 'SI pruebas = insuficientes ENTONCES cobertura de pruebas = crítica (+3)',
    priority: 79,
    conditions: [eq('pruebas', 'insuficientes', 'pruebas = insuficientes')],
    conclusion: concludes('cobertura_pruebas', 'critica', 'Cobertura de pruebas: crítica'),
    evidence: evidence(
      'E-CAL-COBERTURA',
      'Pruebas insuficientes',
      'Los defectos llegan al usuario porque no hay red que los detenga antes.',
      'calidad',
      3,
      ['REC-COBERTURA', 'REC-AUTOMATIZAR'],
    ),
  }),
  rule({
    id: 'R-13',
    name: 'Pruebas parciales',
    statement: 'SI pruebas = parciales ENTONCES cobertura de pruebas = parcial (+1)',
    priority: 78,
    conditions: [eq('pruebas', 'parciales', 'pruebas = parciales')],
    conclusion: concludes('cobertura_pruebas', 'parcial', 'Cobertura de pruebas: parcial'),
    evidence: evidence(
      'E-CAL-PARCIAL',
      'Cobertura de pruebas parcial',
      'Hay pruebas, pero no sobre todo lo que el negocio no puede permitirse perder.',
      'calidad',
      1,
      ['REC-COBERTURA'],
    ),
  }),
  rule({
    id: 'R-14',
    name: 'Calidad comprimida por el cronograma',
    statement: 'SI pruebas = insuficientes Y tiempo disponible = bajo ENTONCES riesgo de calidad = alto (+3)',
    priority: 77,
    conditions: [
      eq('pruebas', 'insuficientes', 'pruebas = insuficientes'),
      eq('tiempo_disponible', 'bajo', 'tiempo disponible = bajo'),
    ],
    conclusion: concludes('riesgo_calidad', 'alto', 'Riesgo de calidad: alto'),
    evidence: evidence(
      'E-CAL-PRESION',
      'Pruebas insuficientes con el tiempo encima',
      'Cuando falta tiempo se recorta lo que no se ve, y lo primero que no se ve son las pruebas.',
      'calidad',
      3,
      ['REC-COBERTURA', 'REC-AUTOMATIZAR', 'REC-REPRIORIZAR'],
    ),
  }),
  rule({
    id: 'R-15',
    name: 'Validación puramente manual',
    statement:
      'SI pruebas ∈ {insuficientes, parciales} Y integración continua = no ENTONCES validación manual (+2)',
    priority: 76,
    conditions: [
      oneOf('pruebas', ['insuficientes', 'parciales'], 'pruebas ∈ {insuficientes, parciales}'),
      eq('integracion_continua', 'no', 'integración continua = no'),
    ],
    conclusion: concludes('validacion_manual', true, 'Validación manual'),
    evidence: evidence(
      'E-CAL-MANUAL',
      'Validación manual sin automatización',
      'Verificar a mano en cada entrega es lento y se abandona justo cuando más falta hace.',
      'calidad',
      2,
      ['REC-AUTOMATIZAR', 'REC-CI'],
    ),
  }),
];

/* ------------------------------------------------------------------ */
/* Técnico                                                             */
/* ------------------------------------------------------------------ */

const tecnico: Rule[] = [
  rule({
    id: 'R-16',
    name: 'Control de versiones deficiente',
    statement: 'SI control de versiones = deficiente ENTONCES riesgo técnico = alto (+3)',
    priority: 75,
    conditions: [eq('control_versiones', 'deficiente', 'control de versiones = deficiente')],
    conclusion: concludes('riesgo_tecnico', 'alto', 'Riesgo técnico: alto'),
    evidence: evidence(
      'E-TEC-VCS',
      'Control de versiones deficiente',
      'Sin historial confiable no se puede volver atrás, y cada integración es una apuesta.',
      'tecnico',
      3,
      ['REC-VCS', 'REC-INTEGRACION-TEMPRANA'],
    ),
  }),
  rule({
    id: 'R-17',
    name: 'Control de versiones parcial',
    statement: 'SI control de versiones = parcial ENTONCES riesgo técnico = medio (+1)',
    priority: 74,
    conditions: [eq('control_versiones', 'parcial', 'control de versiones = parcial')],
    conclusion: concludes('riesgo_tecnico', 'medio', 'Riesgo técnico: medio'),
    evidence: evidence(
      'E-TEC-VCS-PARCIAL',
      'Uso desparejo del control de versiones',
      'Parte del equipo sigue el flujo y parte no: la trazabilidad se corta donde menos se espera.',
      'tecnico',
      1,
      ['REC-VCS-BASICO'],
    ),
  }),
  rule({
    id: 'R-18',
    name: 'Sin integración continua',
    statement: 'SI integración continua = no ENTONCES automatización = ausente (+2)',
    priority: 73,
    conditions: [eq('integracion_continua', 'no', 'integración continua = no')],
    conclusion: concludes('automatizacion', 'ausente', 'Automatización: ausente'),
    evidence: evidence(
      'E-TEC-CI',
      'Sin integración continua',
      'Los errores de integración aparecen tarde, cuando corregirlos cuesta varias veces más.',
      'tecnico',
      2,
      ['REC-CI', 'REC-INTEGRACION-TEMPRANA'],
    ),
  }),
  rule({
    id: 'R-19',
    name: 'Integración frágil en equipo grande',
    statement: 'SI control de versiones = deficiente Y tamaño = grande ENTONCES riesgo de integración = alto (+3)',
    priority: 72,
    conditions: [
      eq('control_versiones', 'deficiente', 'control de versiones = deficiente'),
      eq('tamano_equipo', 'grande', 'tamaño del equipo = grande'),
    ],
    conclusion: concludes('riesgo_integracion', 'alto', 'Riesgo de integración: alto'),
    evidence: evidence(
      'E-TEC-INTEGRACION',
      'Integración frágil con muchas manos en el código',
      'Muchas personas tocando el mismo código sin un flujo sólido garantiza conflictos y trabajo perdido.',
      'tecnico',
      3,
      ['REC-VCS', 'REC-INTEGRACION-TEMPRANA', 'REC-SUBEQUIPOS'],
    ),
  }),
  rule({
    id: 'R-20',
    name: 'Dependencias externas críticas',
    statement: 'SI dependencias externas = críticas ENTONCES riesgo de dependencias = alto (+2)',
    priority: 71,
    conditions: [eq('dependencias_externas', 'criticas', 'dependencias externas = críticas')],
    conclusion: concludes('riesgo_dependencias', 'alto', 'Riesgo de dependencias: alto'),
    evidence: evidence(
      'E-TEC-DEPENDENCIAS',
      'Dependencias externas críticas',
      'Parte del avance depende de terceros que el proyecto no controla ni puede apurar.',
      'tecnico',
      2,
      ['REC-DEPENDENCIAS'],
    ),
  }),
];

/* ------------------------------------------------------------------ */
/* Planificación                                                       */
/* ------------------------------------------------------------------ */

const planificacion: Rule[] = [
  rule({
    id: 'R-21',
    name: 'Tiempo insuficiente',
    statement: 'SI tiempo disponible = bajo ENTONCES presión de cronograma = alta (+3)',
    priority: 70,
    conditions: [eq('tiempo_disponible', 'bajo', 'tiempo disponible = bajo')],
    conclusion: concludes('presion_cronograma', 'alta', 'Presión de cronograma: alta'),
    evidence: evidence(
      'E-PLA-TIEMPO',
      'Tiempo disponible insuficiente',
      'El plazo no alcanza para el alcance comprometido, y esa diferencia se paga en calidad.',
      'planificacion',
      3,
      ['REC-REPRIORIZAR', 'REC-BUFFER'],
    ),
  }),
  rule({
    id: 'R-22',
    name: 'Cronograma ajustado',
    statement: 'SI tiempo disponible = ajustado ENTONCES presión de cronograma = media (+1)',
    priority: 69,
    conditions: [eq('tiempo_disponible', 'ajustado', 'tiempo disponible = ajustado')],
    conclusion: concludes('presion_cronograma', 'media', 'Presión de cronograma: media'),
    evidence: evidence(
      'E-PLA-AJUSTADO',
      'Cronograma ajustado',
      'El plan cierra sólo si nada sale mal, y siempre sale algo mal.',
      'planificacion',
      1,
      ['REC-BUFFER'],
    ),
  }),
  rule({
    id: 'R-23',
    name: 'Sin planificación',
    statement: 'SI planificación = inexistente ENTONCES riesgo de planificación = alto (+3)',
    priority: 68,
    conditions: [eq('planificacion', 'inexistente', 'planificación = inexistente')],
    conclusion: concludes('riesgo_planificacion', 'alto', 'Riesgo de planificación: alto'),
    evidence: evidence(
      'E-PLA-SIN-PLAN',
      'Proyecto sin planificación',
      'Sin hitos ni dependencias no hay contra qué comparar el avance: la desviación se descubre al final.',
      'planificacion',
      3,
      ['REC-PLAN', 'REC-STAKEHOLDERS'],
    ),
  }),
  rule({
    id: 'R-24',
    name: 'Planificación básica',
    statement: 'SI planificación = básica ENTONCES riesgo de planificación = medio (+1)',
    priority: 67,
    conditions: [eq('planificacion', 'basica', 'planificación = básica')],
    conclusion: concludes('riesgo_planificacion', 'medio', 'Riesgo de planificación: medio'),
    evidence: evidence(
      'E-PLA-BASICA',
      'Planificación básica',
      'Hay un plan general, pero sin dependencias explícitas los bloqueos aparecen sin aviso.',
      'planificacion',
      1,
      ['REC-PLAN'],
    ),
  }),
  rule({
    id: 'R-25',
    name: 'Volatilidad sostenida en el tiempo',
    statement: 'SI horizonte = largo Y requisitos cambiantes = alto ENTONCES volatilidad prolongada (+2)',
    priority: 66,
    conditions: [
      eq('horizonte', 'largo', 'horizonte = largo'),
      eq('requisitos_cambiantes', 'alto', 'requisitos cambiantes = alto'),
    ],
    conclusion: concludes('volatilidad_prolongada', true, 'Volatilidad prolongada'),
    evidence: evidence(
      'E-PLA-VOLATIL-LARGO',
      'Requisitos volátiles en un proyecto largo',
      'Cuanto más dura el proyecto, más veces cambia el alcance y más lejos queda el plan original.',
      'planificacion',
      2,
      ['REC-BASELINE-REQ', 'REC-STAKEHOLDERS'],
    ),
  }),
  rule({
    id: 'R-26',
    name: 'Entrega expuesta a terceros',
    statement: 'SI tiempo disponible = bajo Y dependencias externas = críticas ENTONCES riesgo de entrega = alto (+2)',
    priority: 65,
    conditions: [
      eq('tiempo_disponible', 'bajo', 'tiempo disponible = bajo'),
      eq('dependencias_externas', 'criticas', 'dependencias externas = críticas'),
    ],
    conclusion: concludes('riesgo_entrega', 'alto', 'Riesgo de entrega: alto'),
    evidence: evidence(
      'E-PLA-ENTREGA',
      'Entrega ajustada dependiendo de terceros',
      'No hay margen para absorber una demora que el equipo no puede resolver por su cuenta.',
      'planificacion',
      2,
      ['REC-DEPENDENCIAS', 'REC-BUFFER'],
    ),
  }),
];

/* ------------------------------------------------------------------ */
/* Reglas de segundo y tercer nivel — razonan sobre hechos inferidos   */
/* ------------------------------------------------------------------ */

const compuestas: Rule[] = [
  rule({
    id: 'R-30',
    name: 'Entrega frágil',
    statement: 'SI riesgo de calidad = alto Y riesgo técnico = alto ENTONCES fragilidad de entrega = crítica (+3)',
    priority: 40,
    conditions: [
      eq('riesgo_calidad', 'alto', 'riesgo de calidad = alto'),
      eq('riesgo_tecnico', 'alto', 'riesgo técnico = alto'),
    ],
    conclusion: concludes('fragilidad_entrega', 'critica', 'Fragilidad de entrega: crítica'),
    evidence: evidence(
      'E-CAL-FRAGIL',
      'Entrega frágil',
      'Sin pruebas que detecten el error ni historial que permita volver atrás, cada entrega es irreversible.',
      'calidad',
      3,
      ['REC-CI', 'REC-COBERTURA', 'REC-VCS'],
    ),
  }),
  rule({
    id: 'R-31',
    name: 'Colisión entre alcance y tiempo',
    statement:
      'SI alcance no controlado Y presión de cronograma = alta ENTONCES colisión alcance–tiempo (+3)',
    priority: 39,
    conditions: [
      eq('alcance_no_controlado', true, 'alcance no controlado'),
      eq('presion_cronograma', 'alta', 'presión de cronograma = alta'),
    ],
    conclusion: concludes('colision_alcance_tiempo', true, 'Colisión alcance–tiempo'),
    evidence: evidence(
      'E-PLA-COLISION',
      'Alcance que crece contra un plazo que no se mueve',
      'Las dos variables empujan en sentidos opuestos: una de las dos va a ceder, y no se eligió cuál.',
      'planificacion',
      3,
      ['REC-ALCANCE', 'REC-REPRIORIZAR', 'REC-STAKEHOLDERS'],
    ),
  }),
  rule({
    id: 'R-32',
    name: 'Defectos probables',
    statement:
      'SI capacidad técnica = baja Y cobertura de pruebas = crítica ENTONCES riesgo de defectos = alto (+2)',
    priority: 38,
    conditions: [
      eq('capacidad_tecnica', 'baja', 'capacidad técnica = baja'),
      eq('cobertura_pruebas', 'critica', 'cobertura de pruebas = crítica'),
    ],
    conclusion: concludes('riesgo_defectos', 'alto', 'Riesgo de defectos: alto'),
    evidence: evidence(
      'E-CAL-DEFECTOS',
      'Equipo sin experiencia y sin red de pruebas',
      'Quien más errores va a cometer es quien menos apoyo automático tiene para detectarlos.',
      'calidad',
      2,
      ['REC-MENTORIA', 'REC-COBERTURA', 'REC-DEFINICION-HECHO'],
    ),
  }),
  rule({
    id: 'R-33',
    name: 'Continuidad del equipo comprometida',
    statement:
      'SI riesgo de coordinación = alto Y pérdida de conocimiento = alta ENTONCES continuidad del equipo = crítica (+2)',
    priority: 37,
    conditions: [
      eq('riesgo_coordinacion', 'alto', 'riesgo de coordinación = alto'),
      eq('perdida_conocimiento', 'alta', 'pérdida de conocimiento = alta'),
    ],
    conclusion: concludes('continuidad_equipo', 'critica', 'Continuidad del equipo: crítica'),
    evidence: evidence(
      'E-EQ-CONTINUIDAD',
      'Continuidad del equipo comprometida',
      'Un equipo grande, sin experiencia y con salidas frecuentes pierde contexto más rápido de lo que lo construye.',
      'equipo',
      2,
      ['REC-DOC-CONOCIMIENTO', 'REC-SUBEQUIPOS', 'REC-ONBOARDING'],
    ),
  }),
  rule({
    id: 'R-34',
    name: 'Riesgo sistémico',
    statement:
      'SI fragilidad de entrega = crítica Y colisión alcance–tiempo ENTONCES riesgo sistémico (+3)',
    priority: 20,
    conditions: [
      eq('fragilidad_entrega', 'critica', 'fragilidad de entrega = crítica'),
      eq('colision_alcance_tiempo', true, 'colisión alcance–tiempo'),
    ],
    conclusion: concludes('riesgo_sistemico', true, 'Riesgo sistémico'),
    evidence: evidence(
      'E-GES-SISTEMICO',
      'Riesgo sistémico',
      'Los problemas dejaron de ser independientes: se alimentan entre sí y el equipo solo no puede cortarlos.',
      'gestion',
      3,
      ['REC-ESCALAR', 'REC-REPRIORIZAR'],
    ),
  }),
];

/** La base completa, ordenada por prioridad descendente. */
export const KNOWLEDGE_BASE: Rule[] = [
  ...normalizacion,
  ...requisitos,
  ...equipo,
  ...calidad,
  ...tecnico,
  ...planificacion,
  ...compuestas,
].sort((a, b) => b.priority - a.priority);

export function ruleById(id: string): Rule | undefined {
  return KNOWLEDGE_BASE.find((r) => r.id === id);
}
