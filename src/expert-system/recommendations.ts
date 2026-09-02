import type { Recommendation, RiskAssessment, RiskEvidence } from './types.js';

/**
 * Catálogo de recomendaciones.
 *
 * Cada evidencia declara qué recomendaciones dispara. Nada se genera en la
 * interfaz: si una recomendación aparece en pantalla es porque una regla se
 * activó y su evidencia la nombró.
 */
export const RECOMMENDATIONS: Record<string, Recommendation> = {
  'REC-GESTION-CAMBIOS': {
    id: 'REC-GESTION-CAMBIOS',
    title: 'Abrir un proceso formal de gestión de cambios',
    action:
      'Toda solicitud nueva entra por un único canal, se estima y se aprueba antes de tocar el plan. Sin ese paso, el alcance crece sin que nadie lo mida.',
    category: 'requisitos',
    priority: 1,
  },
  'REC-BASELINE-REQ': {
    id: 'REC-BASELINE-REQ',
    title: 'Congelar una línea base de requisitos por iteración',
    action:
      'Fijá el alcance de cada iteración al empezarla. Lo que llegue después entra en la siguiente, no en la actual.',
    category: 'requisitos',
    priority: 2,
  },
  'REC-DOC-REQ': {
    id: 'REC-DOC-REQ',
    title: 'Escribir criterios de aceptación verificables',
    action:
      'Cada requisito necesita una condición que se pueda probar. Un requisito que no se puede verificar no se puede dar por terminado.',
    category: 'requisitos',
    priority: 2,
  },
  'REC-ALCANCE': {
    id: 'REC-ALCANCE',
    title: 'Definir un alcance mínimo entregable',
    action:
      'Separá lo imprescindible de lo deseable y comprometé sólo lo primero. El resto queda como candidato para versiones siguientes.',
    category: 'requisitos',
    priority: 1,
  },
  'REC-COBERTURA': {
    id: 'REC-COBERTURA',
    title: 'Cubrir con pruebas los flujos críticos',
    action:
      'Identificá los tres o cuatro recorridos que no pueden fallar y escribí pruebas para ellos antes de sumar funcionalidad nueva.',
    category: 'calidad',
    priority: 1,
  },
  'REC-AUTOMATIZAR': {
    id: 'REC-AUTOMATIZAR',
    title: 'Automatizar las pruebas repetitivas',
    action:
      'Lo que se prueba a mano en cada entrega es lo primero que se deja de probar cuando aprieta el tiempo. Automatizalo.',
    category: 'calidad',
    priority: 2,
  },
  'REC-DEFINICION-HECHO': {
    id: 'REC-DEFINICION-HECHO',
    title: 'Acordar una definición de terminado',
    action:
      'Una tarea está terminada cuando pasa sus pruebas, está revisada e integrada. Escribilo y aplicalo sin excepciones.',
    category: 'calidad',
    priority: 2,
  },
  'REC-CI': {
    id: 'REC-CI',
    title: 'Montar integración continua',
    action:
      'Compilá y ejecutá las pruebas en cada cambio subido. Un fallo detectado en minutos cuesta una fracción de uno detectado en la entrega.',
    category: 'tecnico',
    priority: 1,
  },
  'REC-VCS': {
    id: 'REC-VCS',
    title: 'Adoptar un flujo de ramas con revisión obligatoria',
    action:
      'Rama por cambio, revisión antes de integrar, historial legible. Sin esto no hay forma de volver atrás con confianza.',
    category: 'tecnico',
    priority: 1,
  },
  'REC-VCS-BASICO': {
    id: 'REC-VCS-BASICO',
    title: 'Unificar el uso del control de versiones',
    action:
      'Todo el equipo, el mismo flujo, el mismo repositorio. Las prácticas parciales generan la falsa sensación de estar cubiertos.',
    category: 'tecnico',
    priority: 2,
  },
  'REC-INTEGRACION-TEMPRANA': {
    id: 'REC-INTEGRACION-TEMPRANA',
    title: 'Integrar temprano y seguido',
    action:
      'Juntá el trabajo de todos varias veces por semana. Cuanto más tarde se integra, más caro sale el conflicto.',
    category: 'tecnico',
    priority: 1,
  },
  'REC-MENTORIA': {
    id: 'REC-MENTORIA',
    title: 'Emparejar a quienes tienen menos experiencia',
    action:
      'Asigná mentoría y revisión por pares en las áreas sensibles. La experiencia se transfiere trabajando, no leyendo documentación.',
    category: 'equipo',
    priority: 1,
  },
  'REC-SUBEQUIPOS': {
    id: 'REC-SUBEQUIPOS',
    title: 'Dividir el equipo en células con responsable técnico',
    action:
      'Grupos de cuatro a seis personas con un referente por área. Un equipo grande sin estructura gasta más en coordinarse que en construir.',
    category: 'gestion',
    priority: 1,
  },
  'REC-DOC-CONOCIMIENTO': {
    id: 'REC-DOC-CONOCIMIENTO',
    title: 'Documentar decisiones y rotar responsabilidades',
    action:
      'Registrá por qué se tomó cada decisión importante y evitá que un área dependa de una sola persona.',
    category: 'equipo',
    priority: 1,
  },
  'REC-ONBOARDING': {
    id: 'REC-ONBOARDING',
    title: 'Formalizar la incorporación de nuevas personas',
    action:
      'Un recorrido de entrada de una semana, con acompañante asignado, reduce el costo de cada reemplazo.',
    category: 'equipo',
    priority: 2,
  },
  'REC-PLAN': {
    id: 'REC-PLAN',
    title: 'Construir un plan con hitos y dependencias explícitas',
    action:
      'Hitos con fecha, entregable y responsable. Sin plan no hay forma de detectar una desviación a tiempo.',
    category: 'planificacion',
    priority: 1,
  },
  'REC-REPRIORIZAR': {
    id: 'REC-REPRIORIZAR',
    title: 'Renegociar alcance o plazo antes de comprometer la fecha',
    action:
      'Poné sobre la mesa la relación entre alcance, tiempo y equipo. Comprometer una fecha que el plan no sostiene traslada el problema, no lo resuelve.',
    category: 'planificacion',
    priority: 1,
  },
  'REC-BUFFER': {
    id: 'REC-BUFFER',
    title: 'Reservar holgura para integración y corrección',
    action:
      'Guardá entre el 15 % y el 20 % del cronograma para estabilizar. Un plan sin holgura falla con el primer imprevisto.',
    category: 'planificacion',
    priority: 2,
  },
  'REC-DEPENDENCIAS': {
    id: 'REC-DEPENDENCIAS',
    title: 'Acordar interfaces y fechas con los proveedores externos',
    action:
      'Contrato de interfaz por escrito y fecha de disponibilidad confirmada. Además, definí qué hace el equipo si la dependencia no llega.',
    category: 'tecnico',
    priority: 1,
  },
  'REC-STAKEHOLDERS': {
    id: 'REC-STAKEHOLDERS',
    title: 'Revisar el avance con el cliente en ciclos cortos',
    action:
      'Demostración cada dos semanas con el producto funcionando. Corrige el rumbo antes de que la desviación sea cara.',
    category: 'gestion',
    priority: 2,
  },
  'REC-ESCALAR': {
    id: 'REC-ESCALAR',
    title: 'Escalar el riesgo a dirección y activar contingencia',
    action:
      'Varios frentes críticos se refuerzan entre sí. Presentá el cuadro completo a quien pueda cambiar alcance, plazo o presupuesto.',
    category: 'gestion',
    priority: 1,
  },
};

/**
 * Arma el plan de mitigación a partir de las evidencias que el motor
 * realmente acumuló. Sin evidencias no hay recomendaciones.
 *
 * Orden: primero la prioridad declarada en el catálogo; a igual prioridad,
 * la categoría donde el proyecto acumuló más puntos.
 */
export function buildRecommendations(
  evidences: RiskEvidence[],
  categoryPoints: Map<string, number>,
): Recommendation[] {
  const selected = new Map<string, Recommendation>();
  for (const evidence of evidences) {
    for (const id of evidence.recommendations) {
      const recommendation = RECOMMENDATIONS[id];
      if (recommendation) selected.set(id, recommendation);
    }
  }
  return [...selected.values()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const weight =
      (categoryPoints.get(b.category) ?? 0) - (categoryPoints.get(a.category) ?? 0);
    if (weight !== 0) return weight;
    return a.title.localeCompare(b.title, 'es');
  });
}

/** Evidencias que sustentan una recomendación. Usado por la vista de resultado. */
export function evidencesFor(
  recommendationId: string,
  assessment: RiskAssessment,
): RiskEvidence[] {
  return assessment.evidences.filter((e) =>
    e.recommendations.includes(recommendationId),
  );
}
