import { describe, it, expect } from 'vitest'
import { resolveQualifier, getQualifierToSync } from './qualifier'

const LOCAL = 'team-local'
const VISITA = 'team-visita'

const partido = (extra = {}) => ({
  is_playoff: true,
  home_team_id: LOCAL,
  away_team_id: VISITA,
  ...extra,
})

const escribiendo = (home, away, qualifier) => ({ home, away, qualifier })

describe('resolveQualifier: cuándo se muestra el selector', () => {
  it('no se muestra si el partido no es de playoff', () => {
    const r = resolveQualifier({
      match: partido({ is_playoff: false }),
      predictionValue: escribiendo('1', '1'),
      canPredict: true,
    })
    expect(r.shouldShowPicker).toBe(false)
    expect(r.selectedTeamId).toBeNull()
  })

  it('se muestra solo con el marcador empatado', () => {
    const base = { match: partido(), canPredict: true }
    expect(
      resolveQualifier({ ...base, predictionValue: escribiendo('1', '1') }).shouldShowPicker
    ).toBe(true)
    expect(
      resolveQualifier({ ...base, predictionValue: escribiendo('0', '0') }).shouldShowPicker
    ).toBe(true)
    expect(
      resolveQualifier({ ...base, predictionValue: escribiendo('2', '1') }).shouldShowPicker
    ).toBe(false)
  })

  it('no se muestra con el marcador a medio cargar', () => {
    // Un campo vacío no es un cero: si lo fuera, el selector aparecería solo al
    // tipear el primer gol.
    const base = { match: partido(), canPredict: true }
    expect(
      resolveQualifier({ ...base, predictionValue: escribiendo('1', '') }).shouldShowPicker
    ).toBe(false)
    expect(resolveQualifier({ ...base, predictionValue: undefined }).shouldShowPicker).toBe(false)
  })
})

describe('resolveQualifier: cuándo está bloqueado', () => {
  it('queda bloqueado si el marcador define un ganador', () => {
    const r = resolveQualifier({
      match: partido(),
      predictionValue: escribiendo('2', '1'),
      canPredict: true,
    })
    expect(r.isLocked).toBe(true)
    expect(r.autoWinnerTeamId).toBe(LOCAL)
  })

  it('el empate no bloquea nada: es lo que el selector resuelve', () => {
    const r = resolveQualifier({
      match: partido(),
      predictionValue: escribiendo('1', '1'),
      canPredict: true,
    })
    expect(r.isLocked).toBe(false)
    expect(r.autoWinnerTeamId).toBeNull()
  })

  it('gana el visitante cuando corresponde', () => {
    expect(
      resolveQualifier({
        match: partido(),
        predictionValue: escribiendo('0', '3'),
        canPredict: true,
      }).autoWinnerTeamId
    ).toBe(VISITA)
  })
})

describe('resolveQualifier: quién queda elegido', () => {
  it('editando, el ganador del marcador manda sobre lo que el usuario eligió', () => {
    // El usuario había elegido al visitante y después cargó 2-1: clasifica el local.
    const r = resolveQualifier({
      match: partido(),
      predictionValue: escribiendo('2', '1', VISITA),
      canPredict: true,
    })
    expect(r.selectedTeamId).toBe(LOCAL)
  })

  it('editando un empate, manda lo que el usuario eligió', () => {
    const r = resolveQualifier({
      match: partido(),
      predictionValue: escribiendo('1', '1', VISITA),
      canPredict: true,
    })
    expect(r.selectedTeamId).toBe(VISITA)
  })

  it('editando un empate sin elección, cae en lo guardado y después en el local', () => {
    expect(
      resolveQualifier({
        match: partido(),
        existingPrediction: { qualifier_prediction_id: VISITA },
        predictionValue: escribiendo('1', '1'),
        canPredict: true,
      }).selectedTeamId
    ).toBe(VISITA)

    expect(
      resolveQualifier({
        match: partido(),
        predictionValue: escribiendo('1', '1'),
        canPredict: true,
      }).selectedTeamId
    ).toBe(LOCAL)
  })

  it('mirando, manda lo guardado y no lo que quedó tipeado', () => {
    // Es la diferencia clave entre las dos ramas: con el partido cerrado, lo que
    // haya quedado en el formulario no debe pisar el pronóstico real.
    const r = resolveQualifier({
      match: partido(),
      existingPrediction: {
        home_prediction: 1,
        away_prediction: 1,
        qualifier_prediction_id: VISITA,
      },
      predictionValue: escribiendo('3', '0', LOCAL),
      canPredict: false,
    })
    expect(r.selectedTeamId).toBe(VISITA)
    // Y el marcador leído es el guardado, así que sigue siendo un empate.
    expect(r.shouldShowPicker).toBe(true)
  })

  it('mirando un partido sin pronóstico, el marcador guardado no existe', () => {
    const r = resolveQualifier({
      match: partido(),
      existingPrediction: null,
      predictionValue: escribiendo('1', '1', VISITA),
      canPredict: false,
    })
    expect(r.homeScoreNumber).toBeNull()
    expect(r.shouldShowPicker).toBe(false)
    expect(r.selectedTeamId).toBe(LOCAL)
  })
})

describe('getQualifierToSync', () => {
  it('no toca nada si el partido no es de playoff o no se puede editar', () => {
    expect(
      getQualifierToSync({
        match: partido({ is_playoff: false }),
        predictionValue: escribiendo('2', '1'),
        canPredict: true,
      })
    ).toBeNull()

    expect(
      getQualifierToSync({
        match: partido(),
        predictionValue: escribiendo('2', '1'),
        canPredict: false,
      })
    ).toBeNull()
  })

  it('escribe el ganador del marcador cuando no coincide con lo elegido', () => {
    expect(
      getQualifierToSync({
        match: partido(),
        predictionValue: escribiendo('2', '1', VISITA),
        canPredict: true,
      })
    ).toBe(LOCAL)
  })

  it('no reescribe si ya coincide: es lo que corta el bucle del efecto', () => {
    expect(
      getQualifierToSync({
        match: partido(),
        predictionValue: escribiendo('2', '1', LOCAL),
        canPredict: true,
      })
    ).toBeNull()
  })

  it('con un empate sin elección propone el guardado, y si no hay, el local', () => {
    expect(
      getQualifierToSync({
        match: partido(),
        existingPrediction: { qualifier_prediction_id: VISITA },
        predictionValue: escribiendo('1', '1'),
        canPredict: true,
      })
    ).toBe(VISITA)

    expect(
      getQualifierToSync({
        match: partido(),
        predictionValue: escribiendo('1', '1'),
        canPredict: true,
      })
    ).toBe(LOCAL)
  })

  it('con un empate ya elegido no toca nada', () => {
    expect(
      getQualifierToSync({
        match: partido(),
        predictionValue: escribiendo('1', '1', VISITA),
        canPredict: true,
      })
    ).toBeNull()
  })

  it('con el marcador vacío propone un clasificado igual', () => {
    // El formulario arranca sin nada cargado y el campo `qualifier` tiene que
    // quedar con algo: si no, guardar un playoff sin tocar el selector mandaría
    // null a la base.
    expect(
      getQualifierToSync({ match: partido(), predictionValue: undefined, canPredict: true })
    ).toBe(LOCAL)
  })
})
