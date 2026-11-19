import { createContext, lazy, Suspense, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, BarChart3, BookOpen, ChevronRight, Clock, Home, Menu, Shield, Sparkles, Target, Trophy, User, Users, Wand2, X } from 'lucide-react'
import ClassicLayout from '../components/layout.classic'
import OfflineBanner from '../components/OfflineBanner'
import { DependencyChart } from '../components/charts'
import { getLevel } from '../lib/scoring'
import './hogwarts.css'

const Castle = lazy(() => import('./Castle'))
const KEY = 'trynthink-hogwarts-v1'
const HOUSES = ['Gryffindor','Ravenclaw','Hufflepuff','Slytherin'] as const
type House = typeof HOUSES[number]
type Settings = { enabled: boolean; house: House; motion: boolean }
const DEFAULT: Settings = { enabled: true, house: 'Gryffindor', motion: true }
const Context = createContext({ ...DEFAULT, setSettings: (_value: Partial<Settings>) => {} })
export const useHogwarts = () => useContext(Context)
function readSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { enabled: typeof s.enabled==='boolean'?s.enabled:true, house: HOUSES.includes(s.house)?s.house:'Gryffindor', motion: typeof s.motion==='boolean'?s.motion:true }
  } catch { return DEFAULT }
}
export function Crest({ small = false }: { small?: boolean }) {
  return <svg className={small?'hw-crest hw-crest-small':'hw-crest'} viewBox="0 0 80 92" fill="none" aria-hidden="true"><path d="M40 3L73 15V48C73 68 57 82 40 89C23 82 7 68 7 48V15Z" fill="#131b25" stroke="currentColor" strokeWidth="1.5"/><path d="M40 10L66 20V48C66 64 54 76 40 82C26 76 14 64 14 48V20Z" stroke="currentColor" strokeOpacity=".35"/><path d="M40 18V72M20 43H60" stroke="currentColor" strokeOpacity=".2"/><path d="M25 30V61M55 30V61M22 30H33M47 30H58M22 61H33M47 61H58M27 44H53" stroke="currentColor" strokeWidth="2.5"/><path d="M40 0L42 5L40 10L38 5ZM40 79L42 84L40 89L38 84Z" fill="currentColor"/></svg>
}
function CastleScene() {
  const { motion } = useHogwarts()
  return <Suspense fallback={<div className="hw-scene-loading" role="status"><Wand2 size={24}/><span>Summoning the castle...</span></div>}><Castle motion={motion}/></Suspense>
}
export default function HogwartsWorld({ children }: { children: ReactNode }) {
  const [settings,update] = useState<Settings>(readSettings)
  const [reduced,setReduced] = useState(() => typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [intro,setIntro] = useState(() => {try{return sessionStorage.getItem(KEY+'-intro')!=='seen'}catch{return false}})
  const [sparks,setSparks] = useState<{id:number;x:number;y:number}[]>([])
  const dialog = useRef<HTMLDialogElement>(null)
  const preferences = useRef<HTMLDetailsElement>(null)
  const location = useLocation()
  const motion = settings.motion&&!reduced
  const setSettings = (value: Partial<Settings>) => update(old => {const next={...old,...value};try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}return next})
  const dismiss = () => {setIntro(false);try{sessionStorage.setItem(KEY+'-intro','seen')}catch{}}
  useEffect(() => {
    const mq=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(mq.matches)
    mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change)
  },[])
  useEffect(() => {
    const close = (event: PointerEvent) => { if(event.target instanceof Node && !preferences.current?.contains(event.target) && preferences.current) preferences.current.open=false }
    const escape = (event: KeyboardEvent) => { if(event.key==='Escape'&&preferences.current?.open){preferences.current.open=false;preferences.current.querySelector('summary')?.focus()} }
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)}
  },[])
  useEffect(()=>{if(preferences.current)preferences.current.open=false},[location.pathname])
  useLayoutEffect(() => {
    const root=document.documentElement
    if(settings.enabled){root.dataset.hogwarts='true';root.dataset.house=settings.house;root.dataset.magicMotion=motion?'on':'off'}
    else {delete root.dataset.hogwarts;delete root.dataset.house;delete root.dataset.magicMotion}
    return()=>{delete root.dataset.hogwarts;delete root.dataset.house;delete root.dataset.magicMotion}
  },[settings.enabled,settings.house,motion])
  useEffect(() => {
    const el=dialog.current
    if(!settings.enabled||!intro||!el)return
    if(typeof el.showModal==='function'&&!el.open)el.showModal()
    return()=>{if(el.open)el.close()}
  },[intro,settings.enabled])
  useEffect(() => {
    if(!settings.enabled||!motion)return
    let counter=0
    const timers=new Set<ReturnType<typeof setTimeout>>()
    const spell=(event:PointerEvent) => {
      if(event.button!==0||!(event.target instanceof Element)||!event.target.closest('button:not(:disabled),a'))return
      const id=++counter
      setSparks(old=>[...old.slice(-3),{id,x:event.clientX,y:event.clientY}])
      const timer=setTimeout(()=>{setSparks(old=>old.filter(s=>s.id!==id));timers.delete(timer)},650);timers.add(timer)
    }
    document.addEventListener('pointerdown',spell)
    return()=>{document.removeEventListener('pointerdown',spell);timers.forEach(clearTimeout);setSparks([])}
  },[settings.enabled,motion])
  return <Context.Provider value={{...settings,motion,setSettings}}>
    {settings.enabled?<div className="hw-world">
      <div className="hw-night" aria-hidden="true"/><a className="hw-skip" href="#hw-main">Skip to content</a>
      <details ref={preferences} className="hw-settings"><summary><Wand2 size={17}/><span>Appearance</span></summary><div className="hw-settings-panel">
        <span className="hw-eyebrow">MAKE YOURSELF AT HOME</span>
        <label htmlFor="hw-house">Your Hogwarts house</label><select id="hw-house" value={settings.house} onChange={e=>setSettings({house:e.target.value as House})}>{HOUSES.map(h=><option key={h}>{h}</option>)}</select>
        <button type="button" aria-pressed={motion} onClick={()=>setSettings({motion:!settings.motion})}>Ambient motion <span>{motion?'On':'Off'}</span></button>
        {reduced&&<p>Your device requests reduced motion.</p>}
        <button type="button" onClick={()=>setIntro(true)}>Replay the entrance <Sparkles size={15}/></button>
        <button type="button" onClick={()=>setSettings({enabled:false})}>Use original appearance <ArrowUpRight size={15}/></button>
        <p>House selection changes your look, not your scores.</p>
      </div></details>
      <div className="hw-content" id="hw-main">{children}</div>
      {motion&&<div className="hw-spell-layer" aria-hidden="true">{sparks.map(s=><span key={s.id} className="hw-spell" style={{left:s.x,top:s.y}}>{Array.from({length:8},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}/>)}</span>)}</div>}
      {intro&&<dialog ref={dialog} className="hw-intro" aria-labelledby="hw-intro-title" onCancel={event=>{event.preventDefault();dismiss()}}><div className="hw-intro-inner"><div className="hw-intro-orbit"><Crest/></div><p className="hw-eyebrow">TRY N THINK · A HOGWARTS EXPERIMENT</p><h1 id="hw-intro-title">Extraordinary things<br/>begin with <em>curiosity.</em></h1><p>Your invitation to a more magical way of learning.</p><button type="button" className="hw-button" onClick={dismiss} autoFocus>Enter the castle <ChevronRight size={17}/></button><small>Original fan-made visuals. Unofficial and unaffiliated.</small></div></dialog>}
    </div>:<>{children}<button className="hw-reenable" type="button" onClick={()=>setSettings({enabled:true})}><Wand2 size={17}/> Enter Hogwarts</button></>}
  </Context.Provider>
}
const LINKS=[
  {to:'/home',name:'Great Hall',detail:'Home',Icon:Home},
  {to:'/study',name:'The Spellbook',detail:'Study tools',Icon:BookOpen},
  {to:'/challenges',name:'Duelling Club',detail:'Challenges',Icon:Target},
  {to:'/timer',name:'Time-Turner',detail:'Focus timer',Icon:Clock},
  {to:'/tutor',name:'Professor\'s Study',detail:'AI tutor',Icon:Wand2},
  {to:'/community',name:'Common Room',detail:'Community',Icon:Users},
  {to:'/progress',name:'The Pensieve',detail:'Progress',Icon:BarChart3},
  {to:'/achievements',name:'Trophy Room',detail:'Achievements',Icon:Trophy},
  {to:'/leaderboard',name:'Honour Board',detail:'Leaderboard',Icon:Shield},
  {to:'/profile',name:'Wizard Profile',detail:'Account',Icon:User},
]
export function HogwartsLayout() {
  const {enabled,house}=useHogwarts(),location=useLocation()
  const [open,setOpen]=useState(false)
  const menu=useRef<HTMLButtonElement>(null)
  const sidebar=useRef<HTMLElement>(null)
  useEffect(()=>setOpen(false),[location.pathname])
  useEffect(()=>{
    if(!open||!matchMedia('(max-width: 1023px)').matches)return
    const previous=document.body.style.overflow;document.body.style.overflow='hidden'
    const items=()=>Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')||[])
    items()[0]?.focus()
    const close=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){setOpen(false);menu.current?.focus()}
      if(e.key==='Tab'){const all=items(),first=all[0],last=all[all.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
    }
    document.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close)}
  },[open])
  if(!enabled)return <ClassicLayout/>
  const current=LINKS.find(l=>location.pathname===l.to)||LINKS.find(l=>location.pathname.startsWith(l.to+'/'))
  return <div className="hw-shell">
    {open&&<button type="button" className="hw-sidebar-scrim" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <aside ref={sidebar} className={'hw-sidebar'+(open?' is-open':'')} id="hw-sidebar" aria-label="Castle navigation"><button type="button" className="hw-nav-close" aria-label="Close castle navigation" onClick={()=>{setOpen(false);menu.current?.focus()}}><X size={18}/></button><Link className="hw-brand" to="/home"><Crest small/><span>TryNThink<small>THE HOGWARTS EDITION</small></span></Link>
      <p className="hw-nav-label">YOUR WORLD OF WONDER</p><nav aria-label="Main navigation">{LINKS.map(({to,name,detail,Icon})=><NavLink key={to} to={to} end={to!=='/study'} onClick={()=>setOpen(false)}><Icon size={18}/><span>{name}<small>{detail}</small></span><ChevronRight className="hw-nav-chevron" size={13}/></NavLink>)}</nav>
      <div className="hw-house-card"><Shield size={19}/><div><strong>{house}</strong><p>Your common room awaits.</p></div><i/></div>
      <div className="hw-sidebar-note"><Sparkles size={13}/> Think first. Then make magic.<small>Unofficial fan-made theme</small></div>
    </aside>
    <div className="hw-main-shell"><header className="hw-topbar"><button ref={menu} type="button" className="hw-menu" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="hw-sidebar" onClick={()=>setOpen(v=>!v)}>{open?<X size={20}/>:<Menu size={20}/>}</button><div className="hw-breadcrumb">Hogwarts <ChevronRight size={12}/><span>{current?.name||'Your next chapter'}</span></div><span className="hw-top-note"><i/> A good day for a little magic</span></header>
      <main className="hw-page" key={location.pathname}><OfflineBanner/><Outlet/></main><footer className="hw-footer"><span>TRY N THINK <b>✦</b> HOGWARTS EDITION</span><span>Your mind is your most powerful wand.</span></footer>
    </div>
  </div>
}
export function HogwartsHome({email,stars,dep}:{email:string|null;stars:number;dep:{independent:number;assisted:number;dependent:number}}) {
  const {house}=useHogwarts(),level=getLevel(stars)
  const titles=['First-year scholar','Curious spellcaster','Independent wizard','Creative conjurer','Critical enchanter','Master of thought']
  const hasData=dep.independent+dep.assisted+dep.dependent>0
  const tools=[
    {to:'/study',Icon:BookOpen,number:'01',name:'The Restricted Section',detail:'Your notes, made extraordinary.',label:'Upload & study',cls:'book'},
    {to:'/timer',Icon:Clock,number:'02',name:'Room of Requirement',detail:'A little space. A lot of focus.',label:'Set a focus timer',cls:'time'},
    {to:'/challenges',Icon:Target,number:'03',name:'The Duelling Club',detail:'Put your thinking to the test.',label:'Explore challenges',cls:'quest'},
    {to:'/tutor',Icon:Wand2,number:'04',name:'A Professor\'s Guidance',detail:'A nudge, never a shortcut.',label:'Meet your AI tutor',cls:'tutor'},
  ]
  return <div className="hw-dashboard"><div className="hw-page-heading"><div><span className="hw-eyebrow">THE GREAT HALL</span><h2>Welcome back, <em>{email?'wizard':'curious mind'}.</em></h2></div><span className="hw-term"><span/> {house.toUpperCase()} COMMON ROOM</span></div>
    <section className="hw-hero"><div className="hw-hero-stars" aria-hidden="true"/><div className="hw-hero-copy"><span className="hw-eyebrow"><Sparkles size={14}/> YOUR NEXT CHAPTER STARTS HERE</span><h1>Great minds<br/>make their own<br/><em>magic.</em></h1><p>Think bravely. Explore deeply. Turn a little curiosity into something extraordinary.</p><div className="hw-hero-actions"><Link className="hw-button" to="/study">Open your spellbook <ArrowUpRight size={17}/></Link><Link className="hw-text-link" to="/challenges">Find your next quest <ChevronRight size={15}/></Link></div><div className="hw-hero-caption"><span/> No shortcuts. Just your own kind of brilliant.</div></div><div className="hw-hero-scene"><CastleScene/></div><span className="hw-hero-corner" aria-hidden="true">✦</span></section>
    <section className="hw-stats" aria-label="Your real learning progress"><div><span className="hw-stat-icon"><Sparkles size={20}/></span><div><span className="hw-eyebrow">STARLIGHT EARNED</span><strong>{stars.toLocaleString()} <small>stars</small></strong></div></div><div><span className="hw-stat-icon"><Shield size={20}/></span><div><span className="hw-eyebrow">YOUR WIZARDING CHAPTER</span><strong className="hw-stat-level">{titles[level.index]}</strong><small>{level.level} · {level.progress}% to next tier</small></div></div><div><span className="hw-stat-icon"><Wand2 size={20}/></span><div><span className="hw-eyebrow">INDEPENDENT THINKING</span><strong>{hasData?dep.independent+'%':'—'}</strong><small>{hasData?'From your submitted challenges':'Your story is just beginning'}</small></div></div></section>
    <div className="hw-section-heading"><div><span className="hw-eyebrow">A CASTLE FULL OF POSSIBILITIES</span><h2>Where will curiosity take you?</h2></div><Link to="/study">All study tools <ArrowUpRight size={15}/></Link></div>
    <div className="hw-tools">{tools.map(({to,Icon,number,name,detail,label,cls})=><Link to={to} key={to} className={'hw-tool hw-tool-'+cls}><div className="hw-tool-top"><span className="hw-tool-icon"><Icon size={26}/></span><span>{number} /</span></div><h3>{name}</h3><p>{detail}</p><span className="hw-tool-action">{label}<ArrowUpRight size={17}/></span></Link>)}</div>
    <div className="hw-lower-grid"><section className="hw-daily"><span className="hw-eyebrow"><Target size={13}/> YOUR DAILY QUEST</span><h2>First, a little room<br/>for your own <em>thoughts.</em></h2><p>Complete one Thinking Break and one Challenge before asking AI. Every great spell begins with a first attempt.</p><div><Link className="hw-button" to="/break">Begin a thinking break <ChevronRight size={16}/></Link><Link className="hw-text-link" to="/challenges">Open challenges <ArrowUpRight size={15}/></Link></div><span className="hw-daily-seal" aria-hidden="true"><Crest/></span></section><section className="hw-insight"><div className="hw-insight-heading"><span className="hw-eyebrow">A GLIMPSE INTO YOUR PENSIEVE</span><Link to="/progress" aria-label="See your thinking progress"><ArrowUpRight size={18}/></Link></div><h3>Your thinking, in perspective.</h3>{hasData?<DependencyChart ind={dep.independent} ast={dep.assisted} dep={dep.dependent}/>:<div className="hw-empty-insight"><BarChart3 size={38}/><p>Your first challenge will light up this space.</p><Link to="/challenges">Start your story <ChevronRight size={14}/></Link></div>}</section></div>
  </div>
}