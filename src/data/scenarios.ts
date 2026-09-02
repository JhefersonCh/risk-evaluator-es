import { buildFacts, type Answers } from './questions.js';
import { evaluateProject } from '../expert-system/risk-engine.js';
import type { RiskAssessment, RiskLevel } from '../expert-system/types.js';

/**
 * Escenarios de referencia.
 *
 * Son las tres configuraciones que la aplicación tiene que resolver bien:
 * un proyecto sano, uno a medio camino y uno con todos los factores en
 * rojo. La suite de pruebas los verifica y la portada los ofrece como
 * casos cargables, así que ambos usan exactamente los mismos datos.
 */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  expectedLevel: RiskLevel;
  /** Reglas que este escenario debe activar sí o sí. */
  mustFire: string[];
  /** Reglas que este escenario no puede activar. */
  mustNotFire: string[];
  answers: Answers;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'bajo',
    name: 'Equipo consolidado, alcance estable',
    description:
      'Requisitos estables, equipo con experiencia, buen control de versiones, buenas pruebas y tiempo suficiente.',
    expectedLevel: 'bajo',
    mustFire: ['R-D2'],
    mustNotFire: ['R-01', 'R-12', 'R-16', 'R-21', 'R-34'],
    answers: {
      nombre_proyecto: 'Portal de autogestión',
      duracion_meses: 6,
      requisitos_cambiantes: 'bajo',
      documentacion_requisitos: 'completa',
      tamano_equipo: 'mediano',
      experiencia_equipo: 'media',
      rotacion_equipo: 'baja',
      pruebas: 'buenas',
      integracion_continua: 'si',
      control_versiones: 'bueno',
      tiempo_disponible: 'ajustado',
      planificacion: 'detallada',
      dependencias_externas: 'ninguna',
    },
  },
  {
    id: 'medio',
    name: 'Varios frentes flojos, ninguno crítico',
    description:
      'Prácticas a medio camino en casi todos los factores: nada está roto, pero nada está resuelto.',
    expectedLevel: 'medio',
    mustFire: ['R-02', 'R-04', 'R-07', 'R-10', 'R-13', 'R-17', 'R-22', 'R-24', 'R-11'],
    mustNotFire: ['R-01', 'R-14', 'R-34'],
    answers: {
      nombre_proyecto: 'Migración de facturación',
      duracion_meses: 8,
      requisitos_cambiantes: 'medio',
      documentacion_requisitos: 'parcial',
      tamano_equipo: 'grande',
      experiencia_equipo: 'media',
      rotacion_equipo: 'media',
      pruebas: 'parciales',
      integracion_continua: 'parcial',
      control_versiones: 'parcial',
      tiempo_disponible: 'ajustado',
      planificacion: 'basica',
      dependencias_externas: 'algunas',
    },
  },
  {
    id: 'alto',
    name: 'Todos los factores en rojo',
    description:
      'Requisitos cambiantes, poco tiempo, pruebas insuficientes, baja experiencia y control de versiones deficiente.',
    expectedLevel: 'alto',
    mustFire: [
      'R-01', 'R-03', 'R-05', 'R-06', 'R-08', 'R-09', 'R-12', 'R-14',
      'R-16', 'R-19', 'R-21', 'R-23', 'R-30', 'R-31', 'R-32', 'R-33', 'R-34',
    ],
    mustNotFire: ['R-02', 'R-13', 'R-17', 'R-22'],
    answers: {
      nombre_proyecto: 'Reemplazo del core',
      duracion_meses: 12,
      requisitos_cambiantes: 'alto',
      documentacion_requisitos: 'inexistente',
      tamano_equipo: 'grande',
      experiencia_equipo: 'baja',
      rotacion_equipo: 'alta',
      pruebas: 'insuficientes',
      integracion_continua: 'no',
      control_versiones: 'deficiente',
      tiempo_disponible: 'bajo',
      planificacion: 'inexistente',
      dependencias_externas: 'criticas',
    },
  },
];

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

export function runScenario(scenario: Scenario): RiskAssessment {
  return evaluateProject(
    buildFacts(scenario.answers),
    String(scenario.answers['nombre_proyecto'] ?? ''),
  );
}
