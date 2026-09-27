import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './style.css'

gsap.registerPlugin(ScrollTrigger)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!reduceMotion) {
  const context = gsap.context(() => {
    gsap.from('.hero [data-reveal]', {
      y: 18,
      opacity: 0,
      duration: 0.75,
      stagger: 0.14,
      ease: 'power2.out',
      clearProps: 'all',
    })

    gsap.fromTo('[data-workflow-step]:not(.is-active)', {
      opacity: 0.62,
    }, {
      opacity: 1,
      duration: 0.45,
      stagger: 0.18,
      ease: 'power1.out',
      scrollTrigger: { trigger: '.workflow-visual', start: 'top 68%', once: true },
    })

    gsap.from('.process-item', {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.12,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: '.process',
        start: 'top 78%',
      },
    })

    gsap.from('.intro [data-reveal], .closing[data-reveal]', {
      y: 18,
      opacity: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: '.intro',
        start: 'top 82%',
        once: true,
      },
    })
  })

  window.addEventListener('pagehide', () => context.revert(), { once: true })
}
