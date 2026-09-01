/// <reference types="vite/client" />

/**
 * Las variables de entorno del proyecto, declaradas para que dejen de ser `any`.
 *
 * Van **opcionales** a propósito: pueden faltar, y de hecho todo el mecanismo de
 * `lib/supabase.ts` + `Common/ConfigError` existe para avisarlo en pantalla en vez
 * de dejar un blanco. Con el `?` el chequeo de faltantes tiene sentido también para
 * el compilador.
 *
 * `import.meta.env.DEV` y compañía ya vienen de `vite/client`.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Ojo: **no** es `VITE_SUPABASE_ANON_KEY`. */
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string
  /** Si es `'true'`, los admins también entran a torneos con status `upcoming`. */
  readonly VITE_ALLOW_UPCOMING_TOURNAMENTS_FOR_ADMINS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
