import { useEffect } from 'react'

type UseIOParams = {
  target: React.RefObject<Element | null>
  onIntersect: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  enabled?: boolean
}

export default function useIntersectionObserver({
  target,
  onIntersect,
  root = null,
  rootMargin = '0px',
  threshold = 0,
  enabled = true,
}: UseIOParams) {
  useEffect(() => {
    if (!enabled) return
    const el = target?.current
    if (!el) return

    const observer = new IntersectionObserver((entries, obs) => onIntersect(entries, obs), {
      root,
      rootMargin,
      threshold,
    })

    observer.observe(el)

  return () => observer.disconnect()
  // intentionally not adding `target.current` to deps (ref identity stable)
  }, [target, onIntersect, root, rootMargin, threshold, enabled])
}
