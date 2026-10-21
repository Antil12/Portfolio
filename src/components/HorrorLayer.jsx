import './HorrorLayer.css'

// top/duration/delay/size/direction are hand-tuned so the flock never feels synchronised.
const BATS = [
  { top: 12, duration: 14, delay: 0, size: 64, reverse: false },
  { top: 28, duration: 19, delay: 4, size: 42, reverse: true },
  { top: 8, duration: 23, delay: 9, size: 30, reverse: false },
  { top: 46, duration: 17, delay: 2, size: 52, reverse: true },
  { top: 62, duration: 21, delay: 12, size: 36, reverse: false },
  { top: 20, duration: 26, delay: 16, size: 26, reverse: true },
  { top: 72, duration: 18, delay: 7, size: 46, reverse: false },
  { top: 36, duration: 29, delay: 20, size: 22, reverse: true },
]

const SPIDERS = [
  { left: 7, drop: 34, duration: 9, delay: 0, size: 38 },
  { left: 31, drop: 18, duration: 12, delay: 3, size: 26 },
  { left: 68, drop: 26, duration: 10, delay: 6, size: 32 },
  { left: 91, drop: 44, duration: 13, delay: 1.5, size: 42 },
]

function Bat({ size }) {
  const wing = 'M50 24 C43 12 31 7 14 8 C19 12 19 17 17 21 C11 19 5 21 1 27 C9 27 13 31 15 36 C21 31 29 31 33 36 C37 30 43 27 50 29 Z'
  return (
    <svg className="bat-svg" width={size} height={size / 2} viewBox="0 0 100 50" aria-hidden="true">
      <path className="bat-wing" d={wing} />
      <g transform="translate(100 0) scale(-1 1)"><path className="bat-wing" d={wing} /></g>
      <ellipse cx="50" cy="27" rx="5.5" ry="9" />
      <path d="M45.5 20 L46.5 12.5 L49 19 Z M54.5 20 L53.5 12.5 L51 19 Z" />
      <circle className="bat-eye" cx="48" cy="23" r="1.1" />
      <circle className="bat-eye" cx="52" cy="23" r="1.1" />
    </svg>
  )
}

function Spider({ size }) {
  return (
    <svg className="spider-svg" width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <g className="spider-legs spider-legs-left">
        <path d="M26 26 Q14 14 6 18" /><path d="M25 30 Q12 24 3 30" />
        <path d="M25 34 Q12 36 5 44" /><path d="M27 37 Q18 46 14 56" />
      </g>
      <g className="spider-legs spider-legs-right">
        <path d="M34 26 Q46 14 54 18" /><path d="M35 30 Q48 24 57 30" />
        <path d="M35 34 Q48 36 55 44" /><path d="M33 37 Q42 46 46 56" />
      </g>
      <circle cx="30" cy="24" r="5.5" />
      <ellipse cx="30" cy="36" rx="8" ry="10" />
      <path className="spider-mark" d="M30 31 L32.5 36 L30 41 L27.5 36 Z" />
      <circle className="spider-eye" cx="28" cy="23" r="1.2" />
      <circle className="spider-eye" cx="32" cy="23" r="1.2" />
    </svg>
  )
}

function Cobweb({ className }) {
  return (
    <svg className={`cobweb ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <path d="M0 0 L200 40 M0 0 L170 110 M0 0 L110 170 M0 0 L40 200" />
      <path d="M40 8 Q34 26 34 34 Q26 34 8 40" />
      <path d="M80 16 Q66 50 68 68 Q50 66 16 80" />
      <path d="M125 25 Q100 76 102 102 Q76 100 25 125" />
      <path d="M170 34 Q134 102 136 136 Q102 134 34 170" />
    </svg>
  )
}

function HorrorLayer() {
  return (
    <div className="horror-layer" aria-hidden="true">
      <div className="blood-vignette" />
      <Cobweb className="cobweb-left" />
      <Cobweb className="cobweb-right" />
      {BATS.map((bat, index) => (
        <div
          key={`bat-${index}`}
          className={`bat${bat.reverse ? ' bat-reverse' : ''}`}
          style={{ top: `${bat.top}%`, animationDuration: `${bat.duration}s`, animationDelay: `-${bat.delay}s` }}
        >
          <div className="bat-bob" style={{ animationDelay: `-${bat.delay / 3}s` }}><Bat size={bat.size} /></div>
        </div>
      ))}
      {SPIDERS.map((spider, index) => (
        <div
          key={`spider-${index}`}
          className="spider"
          style={{ left: `${spider.left}%`, '--drop': `${spider.drop}vh`, animationDuration: `${spider.duration}s`, animationDelay: `-${spider.delay}s` }}
        >
          <span className="spider-thread" />
          <Spider size={spider.size} />
        </div>
      ))}
    </div>
  )
}

export default HorrorLayer
