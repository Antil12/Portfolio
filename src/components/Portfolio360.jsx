import { useEffect, useRef, useState } from 'react'
import './Portfolio360.css'

function Portfolio360({ isOpen, onClose }) {
  const containerRef = useRef(null)
  const batmanRef = useRef(null)
  const vampireRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!isOpen) return

    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e) => {
      setIsDragging(true)
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    const handleMouseMove = (e) => {
      if (!isDragging) return
      const newX = e.clientX - startPos.x
      const newY = e.clientY - startPos.y
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleWheel = (e) => {
      e.preventDefault()
      const sensitivity = 0.5
      setPosition(prev => ({
        x: prev.x - e.deltaX * sensitivity,
        y: prev.y - e.deltaY * sensitivity
      }))
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', handleMouseUp)
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseleave', handleMouseUp)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [isOpen, isDragging, startPos, position])

  if (!isOpen) return null

  return (
    <div className="portfolio-360-overlay">
      <div className="portfolio-360-container" ref={containerRef}>
        <div className="portfolio-360-header">
          <div className="portfolio-360-title">
            <span className="title-eyebrow">INTERACTIVE EXPERIENCE</span>
            <h2>360° <em>UNIVERSE</em></h2>
          </div>
          <button className="close-360" onClick={onClose} aria-label="Close 360 portfolio">
            <span>✕</span>
          </button>
        </div>
        
        <div className="viewport-360">
          <div className="corner-decoration corner-tl" />
          <div className="corner-decoration corner-tr" />
          <div className="corner-decoration corner-bl" />
          <div className="corner-decoration corner-br" />
          
          <div 
            className="world-360"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`
            }}
          >
            <div className="character-container batman-container" ref={batmanRef}>
              <img 
                src="/bat.png" 
                alt="Batman character" 
                className="character-image batman-image"
              />
              <div className="character-label">BATMAN</div>
            </div>

            <div className="character-container vampire-container" ref={vampireRef}>
              <img 
                src="/vam.png" 
                alt="Vampire character" 
                className="character-image vampire-image"
              />
              <div className="character-label">VAMPIRE</div>
            </div>

            <div className="space-decoration space-1" />
            <div className="space-decoration space-2" />
            <div className="space-decoration space-3" />
            <div className="space-decoration space-4" />
          </div>
        </div>

        <div className="controls-360">
          <div className="instruction">
            <span className="instruction-icon">🖱️</span>
            <span>Drag or scroll to explore the 360° space</span>
          </div>
          <button 
            className="reset-view" 
            onClick={() => setPosition({ x: 0, y: 0 })}
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  )
}

export default Portfolio360
