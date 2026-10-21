import { useEffect, useRef, useState } from 'react'
import soundtrack from '../assets/This_Is_Our_World.mp4'

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart']

function SoundtrackToggle() {
  const audioRef = useRef(null)
  const buttonRef = useRef(null)
  const mutedByUserRef = useRef(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    audio.volume = 0.6

    // Browsers block autoplay with sound, so retry on the first user gesture.
    const unlock = (event) => {
      if (buttonRef.current?.contains(event.target)) return
      if (!mutedByUserRef.current && audio.paused) audio.play().catch(() => {})
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock))
    }
    audio.play().catch(() => UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlock)))

    return () => {
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock))
      audio.pause()
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      mutedByUserRef.current = false
      audio.play().catch(() => {})
    } else {
      mutedByUserRef.current = true
      audio.pause()
    }
  }

  return (
    <>
      <audio ref={audioRef} src={soundtrack} loop preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button ref={buttonRef} type="button" className={`sound-toggle${playing ? ' is-playing' : ''}`} onClick={toggle} aria-pressed={playing} aria-label={playing ? 'Mute soundtrack' : 'Play soundtrack'}>
        <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        {playing ? 'SOUND ON' : 'SOUND OFF'}
      </button>
    </>
  )
}

export default SoundtrackToggle
