/**
 * Torneos de prueba.
 *
 * Sirven para probar cambios contra la base real sin tocar un torneo en curso:
 * el admin controla los `match_date` y puede fabricar cualquier escenario de
 * tiempos (fecha cerrada, cutoff a punto de vencer, resultado habilitado).
 *
 * Se distinguen por convención de slug y no por `status` a propósito: un torneo
 * `upcoming` sería invisible para el resto, pero también sería de solo lectura
 * (ver `isReadOnly` en TournamentContext), o sea inútil para probar escrituras.
 * Con esta convención el torneo queda `active` —escribible— y aun así no
 * aparece para los que no son admin.
 */
export const TEST_TOURNAMENT_SLUG_PREFIX = 'test-'

/** Lo mínimo que hace falta para decidir: el slug. */
type ConSlug = { slug?: string | null }

export const isTestTournament = (tournament: ConSlug | null | undefined): boolean =>
  typeof tournament?.slug === 'string' && tournament.slug.startsWith(TEST_TOURNAMENT_SLUG_PREFIX)

/**
 * Torneos que le corresponde ver a este usuario. Los de prueba se ocultan del
 * todo para los que no son admin, en vez de mostrarse deshabilitados.
 *
 * Genérico para devolver el mismo tipo que recibió: quien filtre una lista de
 * `Tournament` sigue teniendo `Tournament[]` y no una lista de `{ slug }`.
 */
export const filterVisibleTournaments = <T extends ConSlug>(
  tournaments: T[] | null | undefined,
  isUserAdmin: boolean
): T[] => (tournaments || []).filter(tournament => isUserAdmin || !isTestTournament(tournament))
