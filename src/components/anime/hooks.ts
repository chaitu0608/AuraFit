import { useEffect, useRef } from 'react'
import anime from 'animejs'

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
