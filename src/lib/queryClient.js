import { QueryClient } from '@tanstack/react-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Los datos del prode cambian poco: los partidos y las fechas los carga
        // el admin cada tanto. 30s alcanza para que moverse entre pantallas no
        // dispare una query por cada vuelta, sin llegar a mostrar algo viejo.
        staleTime: 30_000,

        // Al volver a la pestaña se revalida, que es lo que uno espera de una
        // tabla de posiciones. Con el staleTime de arriba no se vuelve agresivo.
        refetchOnWindowFocus: true,

        // Un reintento: cubre el corte de red momentáneo sin hacer esperar de
        // más cuando el error es real (una RPC que no existe, por ejemplo).
        retry: 1,
      },
      mutations: {
        // Las escrituras no se reintentan solas: duplicarían un pronóstico o un
        // resultado. El usuario decide si vuelve a intentar.
        retry: 0,
      },
    },
  })
