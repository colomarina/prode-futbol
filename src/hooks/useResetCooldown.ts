import { useCallback, useEffect, useMemo, useState } from 'react'

/** Cinco minutos entre dos pedidos de enlace de recuperación. */
export const RESET_COOLDOWN_MS = 5 * 60 * 1000

/**
 * Se persiste para que el cooldown sobreviva un refresh. Si no, recargar la
 * página lo salteaba y el usuario mandaba otro pedido que Supabase rechazaba con
 * su propio límite, en inglés y sin decir cuánto falta.
 */
export const RESET_COOLDOWN_STORAGE_KEY = 'auth_reset_cooldown_until'

const readStoredDeadline = (): number => {
  if (typeof window === 'undefined') return 0

  const saved = Number(window.localStorage.getItem(RESET_COOLDOWN_STORAGE_KEY) || 0)
  return Number.isFinite(saved) ? saved : 0
}

/**
 * La espera entre dos pedidos de enlace de recuperación de contraseña.
 *
 * Devuelve los segundos que faltan, ya contando hacia atrás: el hook mantiene un
 * intervalo de un segundo mientras el cooldown corre y lo limpia al vencer, así
 * que el consumidor solo lee un número.
 *
 */
export const useResetCooldown = (): {
  remainingSeconds: number
  isOnCooldown: boolean
  start: () => void
} => {
  const [deadline, setDeadline] = useState(readStoredDeadline)
  const [now, setNow] = useState(() => Date.now())

  const remainingSeconds = useMemo(() => {
    const remainingMs = deadline - now
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
  }, [deadline, now])

  useEffect(() => {
    if (!deadline) return

    const clear = () => {
      setDeadline(0)
      window.localStorage.removeItem(RESET_COOLDOWN_STORAGE_KEY)
    }

    const msUntilExpiry = deadline - Date.now()

    // Un deadline vencido puede venir de localStorage: se limpia sin montar nada.
    if (msUntilExpiry <= 0) {
      clear()
      setNow(Date.now())
      return
    }

    // El intervalo actualiza el contador; el timeout lo apaga al vencer, para no
    // depender de que un tick caiga justo en el borde.
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    const timeoutId = window.setTimeout(() => {
      setNow(Date.now())
      clear()
    }, msUntilExpiry)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [deadline])

  const start = useCallback((): void => {
    const nextDeadline = Date.now() + RESET_COOLDOWN_MS
    setNow(Date.now())
    setDeadline(nextDeadline)
    window.localStorage.setItem(RESET_COOLDOWN_STORAGE_KEY, String(nextDeadline))
  }, [])

  return { remainingSeconds, isOnCooldown: remainingSeconds > 0, start }
}
