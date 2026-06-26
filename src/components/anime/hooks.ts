import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import anime from 'animejs'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Single element entrance — replaces framer-motion initial/animate */
export function useEnter<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) {
      if (el) {
        el.style.opacity = '1'
        el.style.transform = 'none'
      }
      return
    }
    anime.set(el, { opacity: 0, translateY: 16 })
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 420,
      easing: 'easeOutCubic',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/** Mount/unmount with exit animation (replaces AnimatePresence) */
export function useExitableMount(visible: boolean, duration = 280) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(visible)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      return
    }
    const el = ref.current
    if (!el || prefersReducedMotion()) {
      setShouldRender(false)
      return
    }
    anime({
      targets: el,
      opacity: [1, 0],
      translateY: [0, -8],
      duration,
      easing: 'easeInCubic',
      complete: () => setShouldRender(false),
    })
  }, [visible, duration])

  useEffect(() => {
    if (!visible || !shouldRender) return
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    anime.set(el, { opacity: 0, translateY: 12 })
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 360,
      easing: 'easeOutCubic',
    })
  }, [visible, shouldRender])

  return { ref, shouldRender }
}

/** Sliding pill for tab bars */
export function useSlidingPill(activeIndex: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const pill = pillRef.current
    if (!container || !pill) return
    const tabs = container.querySelectorAll<HTMLElement>('[data-tab]')
    const tab = tabs[activeIndex]
    if (!tab) return

    const cRect = container.getBoundingClientRect()
    const tRect = tab.getBoundingClientRect()
    const left = tRect.left - cRect.left
    const width = tRect.width

    if (prefersReducedMotion()) {
      pill.style.width = `${width}px`
      pill.style.transform = `translateX(${left}px)`
      return
    }

    anime({
      targets: pill,
      translateX: left,
      width,
      duration: 320,
      easing: 'easeOutCubic',
    })
  }, [activeIndex])

  return { containerRef, pillRef }
}

/** Tap feedback handler */
export function useTapBurst() {
  return useCallback((e: PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return
    pressScale(e.currentTarget)
  }, [])
}

/** Pulse sync indicator when busy */
export function useSyncPulse<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!ref.current || !active || prefersReducedMotion()) return
    const anim = anime({
      targets: ref.current,
      scale: [1, 1.35, 1],
      opacity: [1, 0.6, 1],
      duration: 900,
      easing: 'easeInOutSine',
      loop: true,
    })
    return () => anim.pause()
  }, [active])
  return ref
}

/** Light fade-up — default list entrance */
export function useStaggerIn<T extends HTMLElement>(
  deps: unknown[] = [],
  selector = '[data-stagger]',
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current) return
    const items = ref.current.querySelectorAll(selector)
    if (!items.length) return
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [10, 0],
      delay: anime.stagger(35, { start: 40 }),
      duration: 420,
      easing: 'easeOutCubic',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

/** Single element gentle entrance */
export function useFadeIn<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!ref.current) return
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 380,
      easing: 'easeOutCubic',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

export function useAnimatedNumber(value: number, duration = 500) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef(value)

  useEffect(() => {
    if (!ref.current) return
    const obj = { n: prev.current }
    anime({
      targets: obj,
      n: value,
      duration,
      easing: 'easeOutCubic',
      round: 1,
      update: () => {
        if (ref.current) ref.current.textContent = String(obj.n)
      },
    })
    prev.current = value
  }, [value, duration])

  return ref
}

export function animatePR(el: HTMLElement | null) {
  if (!el) return
  anime({
    targets: el,
    scale: [0.92, 1.04, 1],
    duration: 480,
    easing: 'easeOutCubic',
  })
}

export function animateStreakFire(el: HTMLElement | null) {
  if (!el) return
  anime({
    targets: el,
    translateY: [0, -2, 0],
    duration: 2200,
    easing: 'easeInOutSine',
    loop: true,
  })
}

export function confettiBurst(container: HTMLElement) {
  for (let i = 0; i < 8; i++) {
    const dot = document.createElement('span')
    dot.style.cssText =
      'position:absolute;width:5px;height:5px;border-radius:50%;background:var(--accent);pointer-events:none;'
    container.appendChild(dot)
    anime({
      targets: dot,
      translateX: anime.random(-50, 50),
      translateY: anime.random(-60, -12),
      opacity: [0.9, 0],
      duration: anime.random(500, 700),
      easing: 'easeOutQuad',
      complete: () => dot.remove(),
    })
  }
}

export function pressScale(el: HTMLElement) {
  anime({
    targets: el,
    scale: [1, 0.96, 1],
    duration: 180,
    easing: 'easeOutQuad',
  })
}

/** Route / section entrance */
export function usePageEnter<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!ref.current) return
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 480,
      easing: 'easeOutCubic',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/** Animate SVG ring stroke */
export function animateRingProgress(
  el: SVGElement | null,
  from: number,
  to: number,
  duration = 600,
) {
  if (!el) return
  const obj = { p: from }
  anime({
    targets: obj,
    p: to,
    duration,
    easing: 'easeOutCubic',
    update: () => {
      el.style.setProperty('--ring-progress', String(obj.p))
    },
  })
}

export function useListStagger<T extends HTMLElement>(deps: unknown[] = []) {
  return useStaggerIn<T>(deps, '[data-stagger]')
}
