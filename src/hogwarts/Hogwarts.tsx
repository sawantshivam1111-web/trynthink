import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Menu, Moon, RefreshCw, X } from 'lucide-react'
import ClassicLayout from '../components/layout.classic'
import OfflineBanner from '../components/OfflineBanner'
import { DependencyChart } from '../components/charts'
import { getLevel } from '../lib/scoring'
import castleArt from './assets/castle-night.webp'
import libraryArt from './assets/library.webp'
import './hogwarts.css'

type Mode = 'normal' | 'harry-potter'
const HOUSES = ['Gryffindor', 'Ravenclaw', 'Hufflepuff', 'Slytherin'] as const
type House = typeof HOUSES[number]
type Preferences = { house: House; motion: boolean; remember: boolean }
const PREF_KEY = 'trynthink-experience-v2'
const validMode = (value: unknown): value is Mode => value === 'normal' || value === 'harry-potter'
function readPreferences(): Preferences & { mode: Mode | null } {
  try {
    const value = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}
    const remembered = value.remember === true && validMode(value.mode) ? value.mode : null
    return { house: HOUSES.includes(value.house) ? value.house : 'Gryffindor', motion: value.motion !== false, remember: value.remember === true, mode: remembered }
  } catch { return { house: 'Gryffindor', motion: true, remember: false, mode: null } }
}
const Context = createContext({
  enabled: false, house: 'Gryffindor' as House, motion: true, mode: null as Mode | null,
  openModeChooser: () => {}, setSettings: (_value: Partial<Preferences> & { enabled?: boolean }) => {},
})
export const useHogwarts = () => useContext(Context)

export function Seal({ className = '' }: { className?: string }) {
  return <svg className={'hw-seal ' + className} viewBox="0 0 140 150" fill="none" aria-hidden="true">
    <defs><radialGradient id="hw-wax"><stop stopColor="#824031"/><stop offset=".7" stopColor="#61251f"/><stop offset="1" stopColor="#341916"/></radialGradient></defs>
    <path d="M70 9L80 14L91 12L99 20L110 23L113 34L122 42L120 54L126 65L121 76L122 88L112 96L109 107L97 110L89 119L77 116L66 123L55 118L44 119L36 110L25 107L22 95L13 87L16 75L10 64L16 53L15 41L25 34L28 22L40 20L48 11L60 14Z" fill="url(#hw-wax)" stroke="#a36e45" strokeWidth="1.2"/>
    <circle cx="68" cy="66" r="44" stroke="#b28657" strokeOpacity=".6"/>
    <circle cx="68" cy="66" r="39" stroke="#b28657" strokeOpacity=".3"/>
    <path d="M68 35L91 44V65C91 80 81 91 68 97C55 91 45 80 45 65V44Z" fill="#4a211c" stroke="#d2ab68" strokeWidth="1.2"/>
    <path d="M68 40V92M49 62H87" stroke="#d2ab68" strokeOpacity=".3"/>
    <path d="M55 48V78M81 48V78M52 48H62M75 48H84M52 78H62M75 78H84M57 62H79" stroke="#dfbd7e" strokeWidth="2.5"/>
    <path d="M30 111L21 137L42 132L51 144L60 119M79 119L88 144L98 131L118 136L107 110" fill="#391c19" stroke="#8f6244" strokeWidth=".7"/>
    <path d="M68 19L70 24L68 29L66 24ZM68 103L70 108L68 113L66 108Z" fill="#cfa368"/>
  </svg>
}
export function Engraving({ kind = 'book' }: { kind?: 'book' | 'time' | 'wands' | 'owl' }) {
  return <svg className={'hw-engraving hw-engraving-' + kind} viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'book' ? <><path d="M15 22Q38 13 60 29Q82 13 105 22L102 79Q79 72 60 86Q40 72 18 79Z"/><path d="M60 29V86M12 28L9 84Q34 77 60 91Q85 77 111 84L108 28M24 29Q40 25 52 34M23 38Q40 33 52 43M23 47Q40 42 52 52M22 56Q38 51 52 61M22 65Q38 60 52 70M68 35Q85 25 97 29M68 44Q85 34 97 38M68 53Q85 43 96 47M68 62Q85 52 96 56M68 71Q85 61 95 65"/><path d="M60 4V14M45 7L49 17M75 7L71 17" opacity=".5"/></> : kind === 'time' ? <><g className="hw-time-ring"><ellipse cx="60" cy="49" rx="44" ry="35"/><ellipse cx="60" cy="49" rx="35" ry="43" transform="rotate(-32 60 49)"/></g><circle cx="60" cy="49" r="27"/><path d="M48 29H72M48 70H72M51 29C51 40 69 48 69 59V70M69 29C69 40 51 48 51 59V70M53 65L60 55L67 65Z"/><path d="M56 7V2H64V7M60 84V96M15 49H5M105 49H115"/></> : kind === 'wands' ? <><path d="M25 80L87 19L94 26L32 87ZM29 76L36 83M84 22L91 29M29 18L90 80L83 87L22 25ZM25 22L32 29M79 77L86 84"/><path d="M60 9V22M54 15H66M101 46V56M96 51H106M15 52V62M10 57H20M58 80V91M53 85H63"/><path d="M78 7L80 12L85 14L80 16L78 21L76 16L71 14L76 12Z"/></> : <><path d="M37 26L30 13L50 23Q60 18 70 23L90 13L83 26Q101 44 89 69Q80 88 60 92Q40 88 31 69Q19 44 37 26Z"/><circle cx="46" cy="43" r="14"/><circle cx="74" cy="43" r="14"/><circle cx="46" cy="43" r="5"/><circle cx="74" cy="43" r="5"/><path d="M55 56L60 66L65 56M39 66Q60 85 81 66M41 75Q60 91 79 75M37 59L30 69M83 59L90 69M47 92L44 98M73 92L76 98"/></>}
  </svg>
}
function ModeGate({ remember, onRemember, onChoose, onClose }: { remember: boolean; onRemember: (value: boolean) => void; onChoose: (value: Mode) => void; onClose?: () => void }) {
  return <main className="tn-gate" aria-labelledby="tn-gate-title">
    <header className="tn-gate-header"><span className="tn-original-brand"><span>T</span> TryNThink</span><span>ONE APP. TWO EXPERIENCES.</span>{onClose && <button type="button" className="tn-gate-close" aria-label="Return to your current mode" onClick={onClose}><X size={20}/></button>}</header>
    <div className="tn-gate-heading"><p>MAKE YOURSELF AT HOME</p><h1 id="tn-gate-title">Choose your world.</h1><span>Your studies, your progress, your choice. You can switch any time.</span></div>
    <div className="tn-mode-options">
      <article className="tn-normal-option"><div className="tn-normal-window" aria-hidden="true"><div className="tn-preview-toolbar"><i/><i/><i/><span>TryNThink · Think First</span></div><div className="tn-preview-content"><span className="tn-preview-tag">A LITTLE CLARITY</span><p>Think for yourself.<br/><strong>Learn for life.</strong></p><div className="tn-preview-loop"><span>Think</span><ArrowRight size={13}/><span>Try</span><ArrowRight size={13}/><span>Understand</span></div><div className="tn-preview-paper"><span>01</span><div><b>One thought at a time.</b><small>A quiet place for a curious mind.</small></div><Check size={17}/></div></div></div>
        <div className="tn-option-copy"><span className="tn-option-number">01 / THE FAMILIAR</span><h2>Normal mode</h2><p>Your original TryNThink. Clean, focused, and exactly as you know it.</p><button type="button" className="tn-normal-button" onClick={() => onChoose('normal')}>Use normal mode <ArrowRight size={17}/></button></div>
      </article>
      <article className="tn-magic-option"><img src={castleArt} alt="A candlelit Hogwarts-inspired castle above a misty lake" fetchPriority="high"/><div className="tn-magic-vignette"/>
        <div className="tn-magic-insignia" aria-hidden="true"><Seal/><span>HOGWARTS AWAITS</span></div><div className="tn-option-copy"><span className="tn-option-number">02 / THE EXTRAORDINARY</span><h2>Harry Potter <span>mode</span></h2><p>Beyond the lake. Through the castle gates.<br/>A little closer to the magic.</p><button type="button" className="hw-gold-button" onClick={() => onChoose('harry-potter')}>Enter Harry Potter mode <ArrowRight size={17}/></button></div>
      </article>
    </div>
    <footer className="tn-gate-footer"><label><input type="checkbox" checked={remember} onChange={e => onRemember(e.target.checked)}/> Remember my choice on this device</label><p>Same account. Same saved progress. Two very different worlds.</p><small>The Harry Potter experience is an unofficial fan-made theme.</small></footer>
  </main>
}
export default function HogwartsWorld({ children }: { children: ReactNode }) {
  const [initial] = useState(readPreferences)
  const [mode, setMode] = useState<Mode | null>(initial.mode)
  const [preferences, setPreferences] = useState<Preferences>(() => ({ house: initial.house, motion: initial.motion, remember: initial.remember }))
  const [gateOpen, setGateOpen] = useState(false)
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [arrival, setArrival] = useState(false)
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([])
  const location = useLocation(), dialog = useRef<HTMLDialogElement>(null)
  const enabled = mode === 'harry-potter', motion = preferences.motion && !reduced
  const save = (next: Preferences, selected: Mode | null) => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...next, ...(next.remember && selected ? { mode: selected } : {}) })) } catch { /* Mode works without storage. */ }
  }
  const choose = (next: Mode) => {
    setMode(next); setGateOpen(false); save(preferences, next)
    if (next === 'harry-potter' && motion) setArrival(true)
  }
  const setSettings = (value: Partial<Preferences> & { enabled?: boolean }) => {
    const { enabled: requestedMode, ...changes } = value
    const next = { ...preferences, ...changes }; setPreferences(next); save(next, mode)
    if (typeof requestedMode === 'boolean') choose(requestedMode ? 'harry-potter' : 'normal')
  }
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)'), change = () => setReduced(query.matches)
    query.addEventListener('change', change); return () => query.removeEventListener('change', change)
  }, [])
  useLayoutEffect(() => { if (mode !== null) window.scrollTo(0, 0) }, [mode])
  useLayoutEffect(() => {
    const root = document.documentElement
    if (enabled) { root.dataset.hogwarts = 'true'; root.dataset.house = preferences.house; root.dataset.magicMotion = motion ? 'on' : 'off' }
    else { delete root.dataset.hogwarts; delete root.dataset.house; delete root.dataset.magicMotion }
    return () => { delete root.dataset.hogwarts; delete root.dataset.house; delete root.dataset.magicMotion }
  }, [enabled, preferences.house, motion])
  useEffect(() => {
    if (!gateOpen || !dialog.current) return
    const el = dialog.current; if (!el.open) el.showModal()
    return () => { if (el.open) el.close() }
  }, [gateOpen])
  useEffect(() => { if (!arrival) return; const timer = setTimeout(() => setArrival(false), 1000); return () => clearTimeout(timer) }, [arrival])
  useEffect(() => {
    if (!enabled || !motion) return
    let id = 0; const timers = new Set<ReturnType<typeof setTimeout>>()
    const spell = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element) || !event.target.closest('a,button:not(:disabled)')) return
      const key = ++id; setSparks(old => [...old.slice(-3), { id: key, x: event.clientX, y: event.clientY }])
      const timer = setTimeout(() => { setSparks(old => old.filter(s => s.id !== key)); timers.delete(timer) }, 700); timers.add(timer)
    }
    document.addEventListener('pointerdown', spell)
    return () => { document.removeEventListener('pointerdown', spell); timers.forEach(clearTimeout); setSparks([]) }
  }, [enabled, motion])
  const gate = <ModeGate remember={preferences.remember} onRemember={remember => setPreferences(old => ({ ...old, remember }))} onChoose={choose}/>
  return <Context.Provider value={{ enabled, mode, house: preferences.house, motion, openModeChooser: () => setGateOpen(true), setSettings }}>
    {mode === null ? gate : enabled ? <div className="hw-world"><div className="hw-library-backdrop" style={{ backgroundImage: `url(${libraryArt})` }} aria-hidden="true"/><a className="hw-skip" href="#hw-main">Skip to content</a>{['/auth','/forgot-password','/permissions','/onboarding'].includes(location.pathname) && <Link className="hw-auth-brand" to="/home"><Seal/><span>TryNThink<small>THE HOGWARTS EDITION</small></span></Link>}<div className="hw-content" id="hw-main">{children}</div>{motion && <div className="hw-spell-layer" aria-hidden="true">{sparks.map(s => <span key={s.id} className="hw-spell" style={{ left: s.x, top: s.y }}>{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</span>)}</div>}{arrival && motion && <div className="hw-arrival" aria-hidden="true"><span>Lumos.</span></div>}</div> : children}
    {mode !== null && <button type="button" className={'tn-mode-switch' + (enabled ? ' is-magical' : '')} onClick={() => setGateOpen(true)}><RefreshCw size={14}/><span>Switch mode</span></button>}
    {mode !== null && gateOpen && <dialog ref={dialog} className="tn-mode-dialog" aria-label="Choose normal mode or Harry Potter mode" onCancel={event => { event.preventDefault(); setGateOpen(false) }}><ModeGate remember={preferences.remember} onRemember={remember => setPreferences(old => ({ ...old, remember }))} onChoose={choose} onClose={() => setGateOpen(false)}/></dialog>}
  </Context.Provider>
}
const NAV = [{ to: '/home', label: 'Great Hall' }, { to: '/study', label: 'The Library' }, { to: '/challenges', label: 'Duelling Club' }, { to: '/timer', label: 'Time-Turner' }, { to: '/community', label: 'Common Room' }]
const MORE = [{ to: '/tutor', label: 'Professor’s Study · AI tutor' }, { to: '/progress', label: 'The Pensieve · Progress' }, { to: '/achievements', label: 'Trophy Room · Achievements' }, { to: '/leaderboard', label: 'Honour Board · Leaderboard' }, { to: '/profile', label: 'Your wizard profile' }, { to: '/study/god', label: 'Advanced studies' }, { to: '/test', label: 'Practice examination' }]
export function HogwartsLayout() {
  const { enabled, house, motion, setSettings } = useHogwarts(), location = useLocation()
  const [open, setOpen] = useState(false), more = useRef<HTMLDetailsElement>(null), menu = useRef<HTMLButtonElement>(null), navigation = useRef<HTMLElement>(null)
  useEffect(() => { setOpen(false); if (more.current) more.current.open = false }, [location.pathname])
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (event.target instanceof Node && more.current && !more.current.contains(event.target)) more.current.open = false }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); if (more.current?.open) { more.current.open = false; more.current.querySelector('summary')?.focus() } } }
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [])
  useEffect(() => {
    if (!open) return
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const items = () => Array.from(navigation.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),summary,select') || []).filter(el => el.getClientRects().length > 0)
    items()[0]?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menu.current?.focus() }
      if (event.key !== 'Tab') return
      const all = items(), first = all[0], last = all[all.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => { document.body.style.overflow = old; document.removeEventListener('keydown', trap) }
  }, [open])
  if (!enabled) return <ClassicLayout/>
  const home = location.pathname === '/home'
  return <div className="hw-shell"><header className="hw-topbar"><Link className="hw-brand" to="/home"><Seal/><span>TryNThink<small>THE HOGWARTS EDITION</small></span></Link><button type="button" ref={menu} className="hw-menu-toggle" aria-label="Open castle navigation" aria-expanded={open} aria-controls="hw-navigation" onClick={() => setOpen(v => !v)}><Menu size={22}/></button><nav ref={navigation} className={'hw-navigation' + (open ? ' is-open' : '')} id="hw-navigation" aria-label="Castle navigation"><button type="button" className="hw-close-navigation" onClick={() => { setOpen(false); menu.current?.focus() }} aria-label="Close castle navigation"><X size={22}/></button>{NAV.map(({ to, label }) => <NavLink key={to} to={to} end={to !== '/study'}>{label}</NavLink>)}<details ref={more} className="hw-more"><summary>More <ChevronDown size={12}/></summary><div className="hw-more-panel">{MORE.map(({ to, label }) => <Link to={to} key={to}>{label}</Link>)}<label htmlFor="hw-house">Your house<select id="hw-house" value={house} onChange={e => setSettings({ house: e.target.value as House })}>{HOUSES.map(h => <option key={h}>{h}</option>)}</select></label><button type="button" aria-pressed={motion} onClick={() => setSettings({ motion: !motion })}><Moon size={14}/> Ambient animation: {motion ? 'on' : 'off'}</button></div></details></nav></header>
    <main className={'hw-page' + (home ? ' hw-home-page' : ' hw-interior-page')} key={location.pathname}><OfflineBanner/>{home ? <Outlet/> : <div className="hw-interior-document"><div className="hw-document-top" aria-hidden="true"><span>HOGWARTS SCHOOL OF WITCHCRAFT & WIZARDRY</span><span>✦</span></div><Outlet/></div>}</main><footer className="hw-footer"><span>TryNThink · Hogwarts Edition</span><span>Same learning. A different kind of magic.</span><small>An unofficial fan-made experience.</small></footer>
  </div>
}
export function HogwartsHome({ email, stars, dep }: { email: string | null; stars: number; dep: { independent: number; assisted: number; dependent: number } }) {
  const { house, motion } = useHogwarts(), level = getLevel(stars), scene = useRef<HTMLElement>(null)
  const hasData = dep.independent + dep.assisted + dep.dependent > 0
  useEffect(() => {
    const el = scene.current; if (!el || !motion || !matchMedia('(pointer: fine)').matches) return
    const move = (event: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty('--px', `${((event.clientX - r.left) / r.width - .5) * 16}px`); el.style.setProperty('--py', `${((event.clientY - r.top) / r.height - .5) * 9}px`) }
    const reset = () => { el.style.setProperty('--px','0px'); el.style.setProperty('--py','0px') }
    el.addEventListener('pointermove',move); el.addEventListener('pointerleave',reset)
    return () => { el.removeEventListener('pointermove',move); el.removeEventListener('pointerleave',reset); reset() }
  }, [motion])
  return <div className="hw-dashboard"><section ref={scene} className="hw-cinematic-hero" aria-labelledby="hw-welcome"><img className="hw-castle-art" src={castleArt} alt="" fetchPriority="high"/><div className="hw-castle-vignette"/><div className="hw-lake-mist" aria-hidden="true"/>{motion && <div className="hw-embers" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</div>}
    <div className="hw-hero-copy"><p className="hw-overline">HOGWARTS SCHOOL OF WITCHCRAFT & WIZARDRY</p><span className="hw-welcome-line">Welcome {email ? 'back' : 'to'}</span><h1 id="hw-welcome">Hogwarts<span>.</span></h1><div className="hw-title-rule" aria-hidden="true"><i/><span>✦</span><i/></div><p className="hw-hero-description">The library is open. The candles are lit.<br/>Your next chapter is waiting.</p><Link className="hw-gold-button" to="/study">Enter the library <ArrowRight size={17}/></Link><Link className="hw-quiet-link" to="/challenges">Or, a little practice at the Duelling Club <ArrowRight size={14}/></Link></div>
    <div className="hw-castle-coordinate" aria-hidden="true"><span>THE BLACK LAKE</span><i/> HOGWARTS, SCOTLAND</div><div className="hw-house-ribbon"><span className="hw-house-ribbon-pin"/><span>{house}</span><small>YOUR HOUSE</small></div><div className="hw-hero-bottom"><span>Scroll to begin your studies</span><span className="hw-scroll-line"/><span>01 — THE GREAT HALL</span></div>
    </section>
    <section className="hw-parchment"><div className="hw-parchment-edge"/><div className="hw-parchment-inner"><div className="hw-letter-heading"><span className="hw-overline">A NOTE FROM THE GREAT HALL</span><span className="hw-ink-ornament">❧</span></div><div className="hw-letter-intro"><div><h2>A little less ordinary.<br/><em>A little more you.</em></h2><p>Your material. Your thinking. Your own first attempt.<br/>All the familiar tools, with a little Hogwarts around them.</p></div><div className="hw-record"><Seal/><div><span>YOUR STUDENT RECORD</span><strong>{stars.toLocaleString()} <small>stars earned</small></strong><p>{level.level}</p><div className="hw-record-progress" role="progressbar" aria-label="Progress to next level" aria-valuenow={level.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${level.progress}%` }}/></div><small>{level.progress}% to the next chapter</small></div></div></div>
      <div className="hw-chapters"><Link className="hw-chapter" to="/study"><span className="hw-chapter-roman">I.</span><Engraving kind="book"/><h3>The Restricted Section</h3><p>Bring your notes, PDFs, and questions.<br/>There is always another page to turn.</p><span className="hw-chapter-action">Upload & study <ArrowRight size={15}/></span></Link><Link className="hw-chapter" to="/timer"><span className="hw-chapter-roman">II.</span><Engraving kind="time"/><h3>A turn of the hourglass</h3><p>Close the noise outside.<br/>Make a little time for your own mind.</p><span className="hw-chapter-action">Set your focus timer <ArrowRight size={15}/></span></Link><Link className="hw-chapter" to="/challenges"><span className="hw-chapter-roman">III.</span><Engraving kind="wands"/><h3>The Duelling Club</h3><p>No borrowed answers.<br/>Just you, a challenge, and a first attempt.</p><span className="hw-chapter-action">Practise a challenge <ArrowRight size={15}/></span></Link></div>
      <p className="hw-paper-footnote"><span>✦</span> Your house changes the atmosphere. Your effort earns the stars. <span>✦</span></p></div></section>
    <section className="hw-library-chapter"><img src={libraryArt} alt="An old candlelit library with an open book and quill" loading="lazy"/><div className="hw-library-shade"/><div className="hw-library-copy"><span className="hw-overline">SOME ANSWERS ARE WORTH THINKING ABOUT.</span><h2>Even a wizard<br/>has to <em>begin.</em></h2><p>One Thinking Break. One Challenge.<br/>Try it yourself before asking for help.</p><div><Link className="hw-gold-button" to="/break">Take a thinking break <ArrowRight size={16}/></Link><Link className="hw-quiet-link" to="/tutor">Visit your AI tutor <ArrowRight size={14}/></Link></div></div></section>
    <section className="hw-pensieve"><div><Engraving kind="owl"/><span className="hw-overline">YOUR PENSIEVE</span><h2>A look at how<br/>you think.</h2><p>{hasData ? `${dep.independent}% independent thinking in your submitted challenges.` : 'Your first submitted challenge will begin your record.'}</p><Link to="/progress">View your progress <ArrowRight size={15}/></Link></div><div className="hw-pensieve-record">{hasData ? <DependencyChart ind={dep.independent} ast={dep.assisted} dep={dep.dependent}/> : <><span className="hw-ink-ornament">✧</span><h3>Your story is still unwritten.</h3><p>No invented scores. No borrowed achievements.<br/>Just room for your first step.</p><Link to="/challenges">Begin a challenge <ArrowRight size={15}/></Link></>}</div></section>
  </div>
}