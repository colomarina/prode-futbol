// Datos del torneo - separados de la UI para fácil mantenimiento
export const pointsSystemData = [
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

export const tiebreakCriteria = [
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

export const specialRule = {
  icon: '🚫',
  title: 'Regla especial:',
  description: 'Nadie puede ganar más de 3 fechas, después de eso solo se compite por el trofeo 🏆',
  note: 'Si pasa, el premio de la fecha se entrega al jugador que quedó en segunda posición.',
}

export const mundialTiebreakCriteria = [
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

export const mundialSpecialRule = {
  icon: '🚫',
  title: 'Regla especial:',
  description: 'Nadie puede ganar más de 2 fechas, después de eso solo se compite por el trofeo 🏆',
  note: 'Si pasa, el premio de la fecha se entrega al jugador que quedó en segunda posición.',
}

export const getTiebreakRules = tournamentSlug => {
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
