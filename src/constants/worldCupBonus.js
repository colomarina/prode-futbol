export const WORLD_CUP_BONUS_QUESTIONS = [
  { key: 'champion_team_id', label: 'Campeon del Mundial', points: 8, type: 'team' },
  { key: 'runner_up_team_id', label: 'Subcampeon', points: 5, type: 'team' },
  { key: 'third_place_team_id', label: 'Tercer puesto', points: 3, type: 'team' },
  { key: 'top_scorer_text', label: 'Maximo goleador', points: 5, type: 'text' },
  { key: 'best_player_text', label: 'Mejor jugador del torneo', points: 4, type: 'text' },
  { key: 'best_goalkeeper_text', label: 'Mejor arquero', points: 4, type: 'text' },
  {
    key: 'least_goals_conceded_team_id',
    label: 'Seleccion con menos goles recibidos',
    points: 3,
    type: 'team',
  },
  { key: 'revelation_team_id', label: 'Equipo revelacion', points: 3, type: 'team' },
  { key: 'most_assists_text', label: 'Jugador con mas asistencias', points: 3, type: 'text' },
  { key: 'most_cards_team_id', label: 'Seleccion con mas tarjetas', points: 2, type: 'team' },
  {
    key: 'will_there_be_hat_trick',
    label: 'Habra algun hat-trick en el torneo?',
    points: 2,
    type: 'boolean',
  },
  { key: 'argentina_stage', label: 'Hasta que instancia llega Argentina?', points: 4, type: 'stage' },
  { key: 'final_goals', label: 'Cuantos goles tendra la final?', points: 2, type: 'number' },
  {
    key: 'best_debutant_team_id',
    label: 'Que seleccion debutante llegara mas lejos?',
    points: 2,
    type: 'team',
  },
]

export const ARGENTINA_STAGE_OPTIONS = [
  { id: 'fase_de_grupos', label: 'Fase de grupos' },
  { id: 'dieciseisavos', label: 'Dieciseisavos' },
  { id: 'octavos', label: 'Octavos' },
  { id: 'cuartos', label: 'Cuartos' },
  { id: 'semifinal', label: 'Semifinal' },
  { id: 'tercer_puesto', label: 'Tercer puesto' },
  { id: 'subcampeon', label: 'Subcampeon' },
  { id: 'campeon', label: 'Campeon' },
]

export const HAT_TRICK_OPTIONS = [
  { id: true, label: 'Si' },
  { id: false, label: 'No' },
]

export const FINAL_GOALS_OPTIONS = Array.from({ length: 11 }, (_, goals) => ({
  id: goals,
  label: `${goals} gol${goals === 1 ? '' : 'es'}`,
}))

export const DEBUTANT_TEAM_SLUGS = ['cabo-verde', 'curazao', 'jordania', 'uzbekistan']

export const WORLD_CUP_BONUS_MAX_POINTS = 50

const TEAM_COUNTRY_CODE_BY_SLUG = {
  mexico: 'mx',
  sudafrica: 'za',
  'corea-del-sur': 'kr',
  'republica-checa': 'cz',
  canada: 'ca',
  'bosnia-y-herzegovina': 'ba',
  catar: 'qa',
  suiza: 'ch',
  brasil: 'br',
  marruecos: 'ma',
  haiti: 'ht',
  escocia: 'gb',
  'estados-unidos': 'us',
  paraguay: 'py',
  australia: 'au',
  turquia: 'tr',
  alemania: 'de',
  curazao: 'cw',
  'costa-de-marfil': 'ci',
  ecuador: 'ec',
  'paises-bajos': 'nl',
  japon: 'jp',
  suecia: 'se',
  tunez: 'tn',
  belgica: 'be',
  egipto: 'eg',
  iran: 'ir',
  'nueva-zelanda': 'nz',
  espana: 'es',
  'cabo-verde': 'cv',
  'arabia-saudi': 'sa',
  uruguay: 'uy',
  francia: 'fr',
  senegal: 'sn',
  irak: 'iq',
  noruega: 'no',
  argentina: 'ar',
  argelia: 'dz',
  austria: 'at',
  jordania: 'jo',
  portugal: 'pt',
  'rd-congo': 'cd',
  uzbekistan: 'uz',
  colombia: 'co',
  inglaterra: 'gb',
  croacia: 'hr',
  ghana: 'gh',
  panama: 'pa',
}

export const getTeamCountryCode = slug => TEAM_COUNTRY_CODE_BY_SLUG[slug] || null

export const getTeamFlagImageUrl = slug => {
  const code = getTeamCountryCode(slug)
  if (!code) return null
  return `https://flagcdn.com/w40/${code}.png`
}
