// Datos del torneo - separados de la UI para fácil mantenimiento

/** Una sub-regla del PLENO: bajo qué condición y cuántos puntos da. */
export interface PointRule {
  condition: string
  points: string
}

/**
 * Una entrada del sistema de puntos.
 *
 * `rules` y `points` son excluyentes en la práctica: el PLENO tiene sub-reglas y
 * las otras dos un puntaje suelto. `PointSystemItem` decide cuál mostrar con
 * `!!item.rules`.
 */
export interface PointSystemEntry {
  id: string
  icon: string
  title: string
  rules?: PointRule[]
  points?: string
}

export const pointsSystemData: PointSystemEntry[] = [
  {
    id: 'pleno',
    icon: '🎯',
    title: 'PLENO (resultado exacto):',
    rules: [
      {
        condition: 'Más de 2 goles:',
        points: 'puntos = cantidad de goles',
      },
      {
        condition: '2 o menos goles:',
        points: '2 puntos',
      },
    ],
  },
  {
    id: 'low-goals',
    icon: '✅',
    title: 'Partidos de hasta 2 goles (acertar ganador/empate):',
    points: '1 punto',
  },
  {
    id: 'high-goals',
    icon: '📈',
    title: 'Más de 3 goles predichos ( acertar cantidad total de goles ) :',
    points: '1 punto',
  },
]

/** Un criterio de desempate, en orden. */
export interface TiebreakCriterion {
  order: string
  title: string
  description?: string
}

export const tiebreakCriteria: TiebreakCriterion[] = [
  {
    order: '1️⃣',
    title: 'Partido de la fecha',
    description: 'Ej: en la fecha 5, se toma el partido 5',
  },
  {
    order: '2️⃣',
    title: 'Comparativa partido donde hayan sacado más Puntos',
  },
  {
    order: '3️⃣',
    title: 'Partido Interzonal',
  },
  {
    order: '4️⃣',
    title: 'Sorteo',
  },
]

/** La regla especial de premios, que cambia entre el Mundial y los torneos locales. */
export interface SpecialRule {
  icon: string
  title: string
  description: string
  note?: string
}

export const specialRule: SpecialRule = {
  icon: '🚫',
  title: 'Regla especial:',
  description: 'Nadie puede ganar más de 3 fechas, después de eso solo se compite por el trofeo 🏆',
  note: 'Si pasa, el premio de la fecha se entrega al jugador que quedó en segunda posición.',
}

export const mundialTiebreakCriteria: TiebreakCriterion[] = [
  {
    order: '1️⃣',
    title: 'Primer partido de cada fecha',
    description: 'En cada fecha se toma como referencia el primer partido de la jornada.',
  },
  {
    order: '2️⃣',
    title: 'Comparativa partido donde hayan sacado más Puntos',
  },
  {
    order: '3️⃣',
    title: 'Mayor cantidad de resultados exactos',
    description: 'Si persiste el empate, gana quien tenga más plenos.',
  },
  {
    order: '4️⃣',
    title: 'Sorteo',
  },
]

export const mundialSpecialRule: SpecialRule = {
  icon: '🚫',
  title: 'Regla especial:',
  description: 'Nadie puede ganar más de 2 fechas, después de eso solo se compite por el trofeo 🏆',
  note: 'Si pasa, el premio de la fecha se entrega al jugador que quedó en segunda posición.',
}

export const getTiebreakRules = (
  tournamentSlug: string | null | undefined
): { tiebreakCriteria: TiebreakCriterion[]; specialRule: SpecialRule } => {
  if (tournamentSlug === 'mundial-2026') {
    return {
      tiebreakCriteria: mundialTiebreakCriteria,
      specialRule: mundialSpecialRule,
    }
  }

  return {
    tiebreakCriteria,
    specialRule,
  }
}
