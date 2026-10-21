import { useEffect, useRef, useState } from 'react'
import { FRAME_COUNT, FRAME_START, getFrameLoader } from './utils/frameLoader'
import HorrorLayer from './components/HorrorLayer'
import SoundtrackToggle from './components/SoundtrackToggle'
import Portfolio360 from './components/Portfolio360'
import './App.css'

const LAST_FRAME = FRAME_START + FRAME_COUNT - 1
const LOOP_FRAMES = Math.min(30, FRAME_COUNT)
const LOOP_INTERVAL = 1000 / 24

function App() {
  const canvasRef = useRef(null)
  const sequenceRef = useRef(null)
  const progressRef = useRef(null)
  const frameLabelRef = useRef(null)
  const sceneRefs = useRef([])
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerTone, setHeaderTone] = useState('cinematic')
  const [portfolio360Open, setPortfolio360Open] = useState(false)

  useEffect(() => {
    let animationFrame = 0
    const updateTone = () => {
      animationFrame = 0
      const sequence = sequenceRef.current
      const contact = document.getElementById('contact')
      if (!sequence || !contact) return
      const sequenceBottom = sequence.getBoundingClientRect().bottom
      const contactBounds = contact.getBoundingClientRect()
      const nextTone = contactBounds.top < 100 && contactBounds.bottom > 80
        ? 'header-dark'
        : sequenceBottom > 80 ? 'cinematic' : 'header-light'
      setHeaderTone((tone) => tone === nextTone ? tone : nextTone)
    }
    const requestToneUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateTone)
    }
    window.addEventListener('scroll', requestToneUpdate, { passive: true })
    requestToneUpdate()
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', requestToneUpdate)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const section = sequenceRef.current
    if (!canvas || !section) return undefined

    const context = canvas.getContext('2d', { alpha: false, desynchronized: true })
    const loader = getFrameLoader()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let currentFrame = -1
    let lastProgress = -1
    let animationFrame = 0
    let mounted = true
    let drawCanvasWidth = 0
    let drawCanvasHeight = 0
    let loopFrame = 0
    let loopStep = 0
    let loopLast = 0

    const drawFrame = (frameIndex) => {
      const image = loader.getFrame(frameIndex)
      if (!image || !context) return
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.round(bounds.width * dpr)
      const height = Math.round(bounds.height * dpr)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      if (drawCanvasWidth !== width || drawCanvasHeight !== height) {
        drawCanvasWidth = width
        drawCanvasHeight = height
      }
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
      const drawWidth = image.naturalWidth * scale
      const drawHeight = image.naturalHeight * scale
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
      currentFrame = frameIndex
      if (frameLabelRef.current) frameLabelRef.current.textContent = String(frameIndex + 1).padStart(3, '0')
    }

    // Ping-pong through the final frames so the ending keeps moving like live video.
    const tickLoop = (time) => {
      loopFrame = window.requestAnimationFrame(tickLoop)
      if (time - loopLast < LOOP_INTERVAL) return
      const cycle = 2 * (LOOP_FRAMES - 1)
      const next = (loopStep + 1) % cycle
      const index = LAST_FRAME - (next < LOOP_FRAMES ? next : cycle - next)
      if (!loader.getFrame(index)) return
      loopLast = time
      loopStep = next
      drawFrame(index)
    }

    const startLoop = () => {
      if (loopFrame) return
      for (let index = LAST_FRAME - LOOP_FRAMES + 1; index <= LAST_FRAME; index += 1) loader.loadFrame(index)
      loopStep = 0
      loopLast = 0
      loopFrame = window.requestAnimationFrame(tickLoop)
    }

    const stopLoop = () => {
      window.cancelAnimationFrame(loopFrame)
      loopFrame = 0
    }

    const update = () => {
      animationFrame = 0
      if (!mounted) return
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = reducedMotion ? 0 : Math.max(0, Math.min(1, -rect.top / travel))
      const frameIndex = FRAME_START + Math.floor(progress * (FRAME_COUNT - 1))

      loader.setTargetFrame(frameIndex)
      if (!reducedMotion && progress >= 1 && rect.bottom > 0) startLoop()
      else stopLoop()
      if (!loopFrame && frameIndex !== currentFrame) {
        loader.loadFrame(frameIndex).then((image) => {
          const latest = FRAME_START + Math.floor(lastProgress * (FRAME_COUNT - 1))
          if (mounted && image && frameIndex === latest && !loopFrame) drawFrame(frameIndex)
        })
        // Hold the last decoded frame while a fast seek fetches its new target.
        if (currentFrame < 0) drawFrame(FRAME_START)
      }

      if (progressRef.current) progressRef.current.style.transform = `scaleY(${progress})`
      if (lastProgress !== progress) {
        lastProgress = progress
        const centers = [0.04, 0.25, 0.5, 0.75, 0.96]
        sceneRefs.current.forEach((scene, index) => {
          if (!scene) return
          const opacity = Math.max(0, 1 - Math.abs(progress - centers[index]) / 0.15)
          scene.style.opacity = String(opacity)
          scene.style.transform = `translate3d(0, ${(1 - opacity) * 18}px, 0)`
          scene.setAttribute('aria-hidden', opacity < 0.08 ? 'true' : 'false')
          scene.inert = opacity < 0.08
        })
      }
    }

    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update)
    }
    const onProgress = (loaded, total) => {
      if (mounted) setLoadProgress(Math.round((loaded / Math.min(total, 12)) * 100))
    }
    loader.onProgress(onProgress)

    loader.preloadInitial(12).then(() => {
      if (!mounted) return
      setLoading(false)
      requestUpdate()
    })

    const resizeObserver = new ResizeObserver(requestUpdate)
    resizeObserver.observe(canvas)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate, { passive: true })
    requestUpdate()

    return () => {
      mounted = false
      stopLoop()
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      resizeObserver.disconnect()
      loader.onProgress(null)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <main>
      <a className="skip-link" href="#work">Skip to selected work</a>
      <HorrorLayer />
      <SoundtrackToggle />
      <header className={`site-header ${headerTone}${menuOpen ? ' menu-open' : ''}`}>
        <a className="wordmark" href="#top" aria-label="Antil, back to top" onClick={closeMenu}>A<span>.</span></a>
        <span className="header-caption">INDEPENDENT CREATIVE DEVELOPER</span>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <span>{menuOpen ? 'CLOSE' : 'MENU'}</span><i aria-hidden="true" />
        </button>
        <nav id="primary-navigation" className="navigation" aria-label="Main navigation">
          <a href="#work" onClick={closeMenu}>WORK</a>
          <a href="#about" onClick={closeMenu}>ABOUT</a>
          <button className="portfolio-360-btn" onClick={() => { setPortfolio360Open(true); closeMenu(); }}>
            360° PORTFOLIO
          </button>
          <a href="#contact" onClick={closeMenu}>CONTACT <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section id="top" className="sequence" ref={sequenceRef} aria-label="Scroll-controlled cinematic story">
        <div className="sequence-sticky">
          <canvas ref={canvasRef} className="sequence-canvas" role="img" aria-label="A cinematic sequence of an aircraft in flight and at an airport, controlled by scrolling" />
          <div className="image-shade" aria-hidden="true" />
          <div className="film-grain" aria-hidden="true" />
          <div className="scene-copy scene-intro" ref={(node) => { sceneRefs.current[0] = node }}>
            <p className="eyebrow"><span className="eyebrow-mark" /> CREATIVE DEVELOPER <span className="eyebrow-divider">—</span> PORTFOLIO 2026</p>
            <h1>Make it<br /><em>move you.</em></h1>
            <p className="hero-description">I build digital experiences where technology meets cinematic storytelling.</p>
            <a className="text-link hero-link" href="#work">EXPLORE SELECTED WORK <span aria-hidden="true">↘</span></a>
          </div>
          <div className="scene-copy scene-beat scene-left" ref={(node) => { sceneRefs.current[1] = node }} aria-hidden="true">
            <p className="eyebrow">01 / THE OPENING</p><h2>Every frame<br />has a <em>feeling.</em></h2>
          </div>
          <div className="scene-copy scene-beat scene-center" ref={(node) => { sceneRefs.current[2] = node }} aria-hidden="true">
            <p className="eyebrow">02 / THE MOMENT</p><h2>Built for<br /><em>the in-between.</em></h2>
          </div>
          <div className="scene-copy scene-beat scene-left" ref={(node) => { sceneRefs.current[3] = node }} aria-hidden="true">
            <p className="eyebrow">03 / THE SHIFT</p><h2>Technology<br />with <em>intention.</em></h2>
          </div>
          <div className="scene-copy scene-beat scene-center scene-final" ref={(node) => { sceneRefs.current[4] = node }} aria-hidden="true">
            <p className="eyebrow">04 / THE AFTERGLOW</p><h2>Leave them<br />with <em>something.</em></h2>
            <a className="text-link" href="#work">DISCOVER THE WORK <span aria-hidden="true">↘</span></a>
          </div>
          <a className="scroll-cue" href="#work"><span className="scroll-cue-line" /> SCROLL TO EXPLORE</a>
          <div className="frame-readout" aria-hidden="true">SEQ. <span ref={frameLabelRef}>001</span> <b>/ {FRAME_COUNT}</b></div>
          <div className="story-progress" aria-hidden="true"><span ref={progressRef} /></div>
          <span className="sequence-note" aria-hidden="true">A STORY IN {FRAME_COUNT} FRAMES</span>
        </div>
      </section>

      <section id="work" className="work-section section-shell">
        <div className="section-heading"><p className="eyebrow">A FEW THINGS MADE WITH INTENTION</p><span className="section-index">01 — 04</span></div>
        <h2 className="section-title">Selected<br /><em>work.</em></h2>
        <div className="project-list">
          <a className="project-row" href="mailto:hello@antil.dev?subject=QR%20Utility" aria-label="Discuss QR Utility project"><span className="project-number">01</span><span className="project-name">QR Utility</span><span className="project-description">A small tool, thoughtfully made useful.</span><span className="project-meta">2025 · REACT / WEB APP</span><span className="project-arrow" aria-hidden="true">↗</span></a>
          <a className="project-row" href="mailto:hello@antil.dev?subject=Pulse%20Monitoring" aria-label="Discuss Pulse Monitoring project"><span className="project-number">02</span><span className="project-name">Pulse Monitoring</span><span className="project-description">Clarity from a stream of live signals.</span><span className="project-meta">2024 · REAL-TIME / DATA</span><span className="project-arrow" aria-hidden="true">↗</span></a>
          <a className="project-row" href="mailto:hello@antil.dev?subject=Web%20Applications" aria-label="Discuss web applications"><span className="project-number">03</span><span className="project-name">Web Applications</span><span className="project-description">Purpose-built products for the everyday.</span><span className="project-meta">2023 · FULL-STACK</span><span className="project-arrow" aria-hidden="true">↗</span></a>
          <a className="project-row" href="mailto:hello@antil.dev?subject=Digital%20Experiences" aria-label="Discuss digital experiences"><span className="project-number">04</span><span className="project-name">Digital Experiences</span><span className="project-description">Distinctive interfaces that stay with you.</span><span className="project-meta">2022 · INTERACTION</span><span className="project-arrow" aria-hidden="true">↗</span></a>
        </div>
        <p className="section-footnote">SELECTED PRACTICE, 2022 — 2026 <span>↗</span></p>
      </section>

      <section id="about" className="about-section section-shell">
        <div className="section-heading"><p className="eyebrow">A LITTLE ABOUT HOW I WORK</p><span className="section-index">02 — THE APPROACH</span></div>
        <p className="about-statement">I BUILD DIGITAL EXPERIENCES THAT TURN COMPLEX IDEAS INTO <em>SIMPLE INTERACTIONS.</em></p>
        <div className="about-lower">
          <p className="about-note">Good technology should feel considered, intuitive, and a little bit magical. I bring design thinking and engineering craft together to make products people enjoy using.</p>
          <div className="skills-block">
            <p className="eyebrow">THE TOOLS ARE ONLY THE BEGINNING</p>
            <div className="skill-grid">
              <div><span className="skill-category">01 / FRONTEND</span><p>React<br />JavaScript<br />HTML & CSS</p></div>
              <div><span className="skill-category">02 / BACKEND</span><p>Python<br />Django<br />Node.js</p></div>
              <div><span className="skill-category">03 / DATA</span><p>PostgreSQL<br />MongoDB<br />Redis</p></div>
              <div><span className="skill-category">04 / PRACTICE</span><p>Docker<br />Git<br />Cloud platforms</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section section-shell">
        <div className="section-heading"><p className="eyebrow">HAVE A GOOD ONE IN MIND?</p><span className="section-index">03 — NEXT CHAPTER</span></div>
        <p className="eyebrow contact-overline">AVAILABLE FOR SELECT PROJECTS</p>
        <h2>Let’s make<br /><em>something matter.</em></h2>
        <a className="contact-cta" href="mailto:hello@antil.dev">START A CONVERSATION <span aria-hidden="true">↗</span></a>
        <div className="contact-footer"><a href="mailto:hello@antil.dev">HELLO@ANTIL.DEV</a><div className="social-links"><a href="https://github.com/" target="_blank" rel="noreferrer">GITHUB ↗</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LINKEDIN ↗</a></div><span>© 2026 ANTIL · MADE WITH INTENTION</span></div>
      </section>

      {loading && <div className="loading-screen" role="status" aria-live="polite"><div className="loading-brand">A<span>.</span></div><p className="eyebrow">AWAKENING THE NIGHT</p><div className="loading-track"><span style={{ width: `${Math.max(loadProgress, 2)}%` }} /></div><div className="loading-meta"><span>SUMMONING THE SEQUENCE</span><span>{String(loadProgress).padStart(2, '0')}%</span></div></div>}
      <Portfolio360 isOpen={portfolio360Open} onClose={() => setPortfolio360Open(false)} />
    </main>
  )
}

export default App
