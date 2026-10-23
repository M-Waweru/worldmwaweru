import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Bike, BookOpen, Check, ChevronRight, CloudRain, Code2, Compass, Github, Home, Leaf, Link as LinkIcon, Map, Minus, Moon, Plus, Search, Sprout, Sun, Sunset, Volume2, VolumeX, Waypoints, Wind, X } from 'lucide-react'
import { gardenIndex, essayBySlug, territoryNames, type Arc, type Territory } from './game/essays'
import { districts, districtById, arcs, trails, countryRoads, type DistrictId } from './world/map'
import type { WorldTarget } from './world/landscape'
import type { WorldScene } from './world/WorldScene'
import type { GardenLight, GardenWeather } from './world/environment'
import { PortfolioWork } from './components/PortfolioWork'
import { AboutContent } from './components/AboutContent'
import { ElsewhereLinks } from './components/ElsewhereLinks'
import { EssayArticle } from './components/EssayArticle'
import { TravelContent, vehicleIcons } from './components/TravelContent'
import { Conversation } from './components/Conversation'
import { mediaUrl, people, profile, site } from './content'
import elsewhere from '../content/elsewhere.json'
import { vehicleDefinitions, type VehicleId, type VehicleStatus } from './world/engine/vehicles'

type Panel = 'about' | 'work' | 'writing' | 'guide' | 'journeys' | 'links' | 'travel' | 'conversation' | null
type NavigationIntent = { kind: 'district'; id: DistrictId } | { kind: 'essay'; slug: string } | { kind: 'vehicle'; id: VehicleId } | { kind: 'person'; id: string }
const districtIcons = { trailhead: Home, computing: Code2, building: Waypoints, knowledge: BookOpen, africa: Sun, philosophy: Compass }
function route() {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('essay/')) {
    try { const slug = decodeURIComponent(hash.slice(6)); if (essayBySlug(slug)) return { reading: slug, panel: 'writing' as Panel, person: null } } catch { /* Invalid URLs open the garden. */ }
  }
  if (hash.startsWith('person/')) { const id = hash.slice(7); if (people.people.some(person => person.id === id)) return { reading: null, panel: 'conversation' as Panel, person: id } }
  return { reading: null, panel: ['about', 'work', 'writing', 'guide', 'journeys', 'links', 'travel'].includes(hash) ? hash as Panel : null, person: null }
}
function readHistory(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem('night-garden:read') ?? '[]'); return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === 'string' && Boolean(essayBySlug(slug))) : [] } catch { return [] }
}

export default function App() {
  const initial = useRef(route())
  const [panel, setPanel] = useState<Panel>(initial.current.panel)
  const [reading, setReading] = useState<string | null>(initial.current.reading)
  const [location, setLocation] = useState<DistrictId>('trailhead')
  const [near, setNear] = useState<WorldTarget | null>(null)
  const [vehicle, setVehicle] = useState<VehicleStatus | null>(null)
  const [personId, setPersonId] = useState<string | null>(initial.current.person)
  const [exploring, setExploring] = useState(Boolean(window.location.hash))
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [worldRequested, setWorldRequested] = useState(!initial.current.reading)
  const [mapOpen, setMapOpen] = useState(false)
  const [light, setLight] = useState<GardenLight>('day')
  const [weather, setWeather] = useState<GardenWeather>('clear')
  const [atmosphereOpen, setAtmosphereOpen] = useState(false)
  const night = light === 'night'
  const [help, setHelp] = useState(false)
  const [query, setQuery] = useState('')
  const [territory, setTerritory] = useState<Territory | 'all'>('all')
  const [visited, setVisited] = useState(readHistory)
  const [journey, setJourney] = useState<Arc | null>(null)
  const [journeyStop, setJourneyStop] = useState(0)
  const [walking, setWalking] = useState<{ title: string; moving: boolean } | null>(null)
  const [sound, setSound] = useState(false)
  const [soundError, setSoundError] = useState(false)
  const [stick, setStick] = useState({ x: 0, y: 0 })
  const mountRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<WorldScene | null>(null)
  const pendingNavigation = useRef<NavigationIntent | null>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const mapDotRef = useRef<SVGCircleElement>(null)
  const panelRef = useRef(panel)
  const openRef = useRef<(target: WorldTarget) => void>(() => {})
  const skipFocusRef = useRef(false)
  const atmosphereCloseRef = useRef<HTMLButtonElement>(null)
  const atmosphereToggleRef = useRef<HTMLButtonElement>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const audioTimerRef = useRef<number | null>(null)
  panelRef.current = panel
  openRef.current = interact

  // A shared article opens as a reader first. Build the larger native world
  // when the visitor closes the reading sheet, rather than blocking its text
  // with WebGL startup. Reading from an already-open world still pauses it.
  useEffect(() => { if (!panel) setWorldRequested(true) }, [panel])

  useEffect(() => {
    if (!worldRequested) return
    let cancelled = false
    const mount = mountRef.current
    if (!mount) return
    setReady(false); setFailed(false); setVehicle(null)
    void import('./world/WorldScene').then(({ WorldScene }) => {
      if (cancelled) return
      try {
        const world = new WorldScene(mount, {
          onReady: () => setReady(true), onError: () => setFailed(true), onLocation: setLocation, onNear: setNear,
          onOpen: (target) => openRef.current(target), onWalking: () => { setExploring(true); setMapOpen(false) }, onRoute: setWalking,
          onVehicle: setVehicle,
        })
        worldRef.current = world
        world.setPanelOpen(Boolean(panelRef.current))
        if (import.meta.env.DEV) (window as Window & { __gardenEngine?: WorldScene }).__gardenEngine = world
      } catch { setFailed(true) }
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; worldRef.current?.dispose(); worldRef.current = null; mount.replaceChildren(); if (import.meta.env.DEV) delete (window as Window & { __gardenEngine?: WorldScene }).__gardenEngine }
  }, [retry, worldRequested])

  useEffect(() => {
    worldRef.current?.setPanelOpen(Boolean(panel))
    if (panel) { (skipFocusRef.current ? sheetRef.current : closeRef.current)?.focus({ preventScroll: true }); skipFocusRef.current = false }
  }, [panel])
  useEffect(() => { if (ready && !panel) flushNavigation() }, [ready, panel])
  useEffect(() => { worldRef.current?.setOverview(mapOpen) }, [ready, mapOpen])
  useEffect(() => { worldRef.current?.setEnvironment(light, weather) }, [ready, light, weather])
  useEffect(() => { if (atmosphereOpen) atmosphereCloseRef.current?.focus({ preventScroll: true }) }, [atmosphereOpen])
  useEffect(() => { sheetRef.current?.scrollTo({ top: 0 }) }, [reading, panel])
  useEffect(() => {
    const timer = window.setInterval(() => {
      const position = worldRef.current?.getSnapshot().position
      if (position && mapDotRef.current) { mapDotRef.current.setAttribute('cx', String(position.x)); mapDotRef.current.setAttribute('cy', String(position.z)) }
    }, 250)
    return () => window.clearInterval(timer)
  }, [ready, mapOpen])
  useEffect(() => {
    const onPop = () => { const current = route(); setPanel(current.panel); setReading(current.reading); setPersonId(current.person) }
    window.addEventListener('popstate', onPop); window.addEventListener('hashchange', onPop)
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onPop) }
  }, [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (atmosphereOpen) closeAtmosphere(); else if (reading) backToShelf(); else if (panel) closePanel(); else if (mapOpen) setMapOpen(false); else setHelp(false) }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openPanel('writing'); window.setTimeout(() => searchRef.current?.focus(), 80) }
      if (!(event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) && !event.ctrlKey && !event.metaKey) {
        if (event.key.toLowerCase() === 'm') setMapOpen((value) => !value)
        if (event.key.toLowerCase() === 'k') openPanel('guide')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => () => { if (audioTimerRef.current !== null) window.clearInterval(audioTimerRef.current); void audioRef.current?.close() }, [])

  function hash(value: string) { window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#${value}`) }
  function closeAtmosphere() { setAtmosphereOpen(false); atmosphereToggleRef.current?.focus({ preventScroll: true }) }
  function openPanel(next: Exclude<Panel, null>, subject?: Territory) {
    setPanel(next); setReading(null); setPersonId(null); setHelp(false); setMapOpen(false); setAtmosphereOpen(false)
    if (next === 'writing') { setTerritory(subject ?? 'all'); setQuery('') }
    hash(next)
  }
  function closePanel() { setPanel(null); setReading(null); hash('garden'); mountRef.current?.focus({ preventScroll: true }) }
  function interact(target: WorldTarget) {
    setExploring(true)
    if (target.kind === 'essay' && target.slug) { openEssay(target.slug); return }
    if (target.kind === 'guide') { openPanel('guide'); return }
    if (target.kind === 'person' && target.personId) { setPersonId(target.personId); setReading(null); setPanel('conversation'); hash(`person/${target.personId}`); return }
    if (target.district === 'trailhead') openPanel('about')
    else if (target.district === 'building') openPanel('work')
    else openPanel('writing', target.district)
  }
  function openEssay(slug: string) {
    if (!essayBySlug(slug)) return
    setReading(slug); setPanel('writing')
    setVisited((current) => {
      if (current.includes(slug)) return current
      const next = [...current, slug]
      try { localStorage.setItem('night-garden:read', JSON.stringify(next)) } catch { /* Optional storage. */ }
      return next
    })
    hash(`essay/${encodeURIComponent(slug)}`)
  }
  function backToShelf() { setReading(null); hash('writing') }
  function walkDistrict(id: DistrictId) {
    setExploring(true); setPanel(null); setReading(null); setMapOpen(false); setHelp(false)
    requestNavigation({ kind: 'district', id }); mountRef.current?.focus({ preventScroll: true })
  }
  function walkVehicle(id: VehicleId) {
    closePanel(); setExploring(true); setMapOpen(false); requestNavigation({ kind: 'vehicle', id })
  }
  function walkPerson(id: string) {
    closePanel(); setExploring(true); setMapOpen(false); requestNavigation({ kind: 'person', id })
  }
  function requestNavigation(intent: NavigationIntent) {
    pendingNavigation.current = intent
    setWorldRequested(true); setExploring(true)
    flushNavigation()
  }
  function flushNavigation() {
    const world = worldRef.current, intent = pendingNavigation.current
    if (!world || !intent) return
    world.setPanelOpen(false); world.setOverview(false)
    pendingNavigation.current = null
    if (intent.kind === 'district') world.navigateToDistrict(intent.id)
    else if (intent.kind === 'essay') world.navigateToEssay(intent.slug)
    else if (intent.kind === 'vehicle') world.navigateToVehicle(intent.id)
    else world.navigateToPerson(intent.id)
  }
  const journeyEntries = journey ? gardenIndex.filter((entry) => entry.arc === journey) : []
  function startJourney(arc: Arc) {
    const entries = gardenIndex.filter((entry) => entry.arc === arc)
    const start = Math.max(0, entries.findIndex((entry) => !visited.includes(entry.slug)))
    setJourney(arc); setJourneyStop(start); closePanel(); setExploring(true)
    if (entries[start]) requestNavigation({ kind: 'essay', slug: entries[start].slug })
  }
  function nextStop() {
    const next = (journeyStop + 1) % Math.max(1, journeyEntries.length)
    setJourneyStop(next); setPanel(null); setReading(null); worldRef.current?.setPanelOpen(false)
    if (journeyEntries[next]) requestNavigation({ kind: 'essay', slug: journeyEntries[next].slug })
  }
  async function toggleSound() {
    if (audioRef.current) { if (audioTimerRef.current !== null) window.clearInterval(audioTimerRef.current); audioTimerRef.current = null; await audioRef.current.close().catch(() => {}); audioRef.current = null; setSound(false); return }
    try {
      const context = new AudioContext(); audioRef.current = context; await context.resume()
      const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate), channel = buffer.getChannelData(0)
      let last = 0
      for (let i = 0; i < channel.length; i++) { last = (last + .015 * (Math.random() * 2 - 1)) / 1.015; channel[i] = last * 2 }
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650
      const gain = context.createGain(); gain.gain.value = .16
      source.connect(filter).connect(gain).connect(context.destination); source.start(); setSound(true); setSoundError(false)
      audioTimerRef.current = window.setInterval(() => {
        if (audioRef.current !== context || context.state !== 'running') return
        const start = context.currentTime
        for (let i = 0; i < 2; i++) {
          const bird = context.createOscillator(), envelope = context.createGain(), t = start + i * .17
          bird.type = 'sine'; bird.frequency.setValueAtTime(1900 + Math.random() * 500, t); bird.frequency.exponentialRampToValueAtTime(2900, t + .06); bird.frequency.exponentialRampToValueAtTime(1700, t + .13)
          envelope.gain.setValueAtTime(0, t); envelope.gain.linearRampToValueAtTime(.014, t + .025); envelope.gain.exponentialRampToValueAtTime(.0001, t + .16)
          bird.connect(envelope).connect(context.destination); bird.start(t); bird.stop(t + .17)
        }
      }, 11000)
    } catch { void audioRef.current?.close(); audioRef.current = null; setSoundError(true) }
  }
  function moveStick(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) / 34, y = (event.clientY - rect.top - rect.height / 2) / 34
    const length = Math.max(1, Math.hypot(x, y)), vector = { x: x / length, y: y / length }
    setStick(vector); worldRef.current?.setTouch(vector.x, -vector.y)
  }
  function endStick() { setStick({ x: 0, y: 0 }); worldRef.current?.setTouch(0, 0) }
  const entry = reading ? essayBySlug(reading) : null
  const notes = gardenIndex.filter((note) => (territory === 'all' || note.territory === territory) && `${note.title} ${note.summary}`.toLowerCase().includes(query.toLowerCase().trim()))
  const district = districtById(location), DistrictIcon = districtIcons[location]
  const VehicleIcon = vehicle ? vehicleIcons[vehicle.id] : Bike
  const githubUrl = elsewhere.links.find(link => link.id === 'github')!.url
  const vehiclePhase = vehicle?.phase === 'launching' ? vehicle.id === 'rocket' ? 'Climbing above the garden' : 'Taking off' : vehicle?.phase === 'returning' ? 'Returning to the airstrip' : vehicle?.phase === 'landing' ? 'Coming in to land' : vehicle?.phase === 'hovering' ? 'A moment above it all' : vehicle?.phase === 'flying' ? 'Over the open country' : vehicle?.id === 'rocket' ? 'Ready for a vertical hop' : '↑/↓ speed · ←/→ steer (or WASD)'

  return (
    <main className={`little-world native-garden mwaweru-garden${panel ? ' has-sheet' : ''}${reading ? ' is-reading' : ''}${panel === 'work' ? ' is-work' : ''}${vehicle ? ' has-vehicle' : ''}${exploring ? ' is-exploring' : ''}${journey ? ' has-journey' : ''}${night ? ' is-night' : ''}`} data-district={location}>
      <a className="skip-link" href="#writing" onClick={(event) => { event.preventDefault(); skipFocusRef.current = true; openPanel('writing'); if (panel) sheetRef.current?.focus() }}>Skip to the essay index</a>
      <div className="world-canvas" ref={mountRef} role="region" tabIndex={0} aria-label="Explore the continuous Mathnuscripts garden" />
      <div className="world-wash" aria-hidden="true" />
      <header className="world-header">
        <button className="wordmark" onClick={() => { if (exploring) walkDistrict('trailhead'); else openPanel('about') }} aria-label="Mwaweru, return to the Trailhead"><span className="wordmark__mark" aria-hidden="true">m.</span><span className="wordmark__name">mwaweru.<small>Mathenge Waweru</small></span></button>
        <nav className="header-nav" aria-label="Portfolio"><button onClick={() => openPanel('about')} aria-current={panel === 'about' ? 'page' : undefined}>About</button><button onClick={() => openPanel('work')} aria-current={panel === 'work' ? 'page' : undefined}>Work</button><button onClick={() => openPanel('writing')} aria-current={panel === 'writing' ? 'page' : undefined}>Writing</button><a className="header-github icon-button" href={githubUrl} target="_blank" rel="noreferrer" aria-label="Mathenge on GitHub"><Github size={18} /></a><span className="header-nav__rule" /><button className="icon-button" onClick={() => void toggleSound()} aria-label={sound ? 'Turn ambient sound off' : 'Turn ambient sound on'} aria-pressed={sound}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button></nav>
      </header>
      {!ready && !failed && !panel && <div className="world-loading" role="status"><span className="loading-house"><Sprout size={27} /></span><p>The garden is coming to life…</p></div>}
      {failed && !panel && <section className="world-unavailable"><Compass size={30} /><h2>The garden needs a moment.</h2><p>The 3D world couldn’t open. Your writing and portfolio are still available above.</p><button className="primary-button" onClick={() => setRetry((value) => value + 1)}>Try again <ArrowRight size={16} /></button></section>}
      {!panel && !exploring && <section className="welcome"><div className="welcome-identity"><img src={mediaUrl(profile.portrait)} alt={profile.portraitAlt} width="45" height="56" /><span>{profile.name}<small>{profile.role}</small></span></div><h1>{site.welcomeTitle}</h1><p>{site.welcomeIntro}</p><button className="primary-button" onClick={() => { setExploring(true); worldRef.current?.begin(); mountRef.current?.focus({ preventScroll: true }) }}>{site.welcomeAction} <ArrowRight size={17} /></button><div className="welcome__links"><button className="welcome__link" onClick={() => openPanel('writing')}>Read the Mathnuscripts <ArrowRight size={14} /></button><button className="welcome__link" onClick={() => openPanel('travel')}>Take the long way <Bike size={15} /></button></div></section>}

      {!panel && exploring && !vehicle && <div className="location-note"><DistrictIcon size={15} /><span>{district.name}<small>{district.description}</small></span></div>}
      {!panel && exploring && !vehicle && near && !mapOpen && <button className="interaction-prompt" onClick={() => { worldRef.current?.interact(); mountRef.current?.focus({ preventScroll: true }) }}><kbd>E</kbd><span><small>{near.kind === 'essay' ? 'Sit & read' : near.kind === 'guide' ? 'Your garden guide' : near.kind === 'vehicle' ? 'Get in & explore' : near.kind === 'person' ? 'Say hello' : 'Step inside'}</small>{near.title}</span><ArrowRight size={16} /></button>}
      {vehicle && !panel && !mapOpen && <section className="vehicle-hud" aria-label="Vehicle controls"><VehicleIcon size={26} strokeWidth={1.5} /><div className="vehicle-hud__identity"><strong>{vehicle.name}</strong><small>{vehicle.id !== 'rocket' && (vehicle.phase === 'parked' || vehicle.phase === 'driving') ? <><span className="vehicle-hud__keys">{vehiclePhase}</span><span className="vehicle-hud__touch">Thumbstick to move & steer</span></> : vehiclePhase}</small></div><output aria-label={vehicle.altitude > 2 ? 'Altitude in metres' : 'Speed in kilometres per hour'}>{vehicle.altitude > 2 ? vehicle.altitude : vehicle.speed}<small>{vehicle.altitude > 2 ? 'm up' : 'km/h'}</small></output><div className="vehicle-hud__actions">{vehicle.action && <button onClick={() => { worldRef.current?.vehicleAction(); mountRef.current?.focus({ preventScroll: true }) }}>{vehicle.action}</button>}<button disabled={!vehicle.canExit} title={vehicle.canExit ? 'Brake and step out (E)' : vehicle.id === 'boat' ? 'Return close to shore to step out' : 'Land before stepping out'} onClick={() => { worldRef.current?.exitVehicle(); mountRef.current?.focus({ preventScroll: true }) }}>Park & exit</button></div>{!vehicle.canExit && <small className="vehicle-hud__hint">{vehicle.id === 'boat' ? 'Come back close to the coast to step ashore.' : 'Stay aboard until you’ve landed.'}</small>}</section>}
      {!panel && <div className="world-tools"><button className="icon-button" onClick={() => worldRef.current?.setZoom(1)} aria-label="Zoom in" disabled={!ready || failed}><Plus size={17} /></button><button className="icon-button" onClick={() => worldRef.current?.setZoom(-1)} aria-label="Zoom out" disabled={!ready || failed}><Minus size={17} /></button><span className="world-tools__rule" /><button ref={atmosphereToggleRef} className="icon-button" onClick={() => atmosphereOpen ? closeAtmosphere() : setAtmosphereOpen(true)} aria-label="Change the garden atmosphere" aria-expanded={atmosphereOpen} aria-controls="garden-atmosphere">{weather === 'rain' ? <CloudRain size={19} /> : weather === 'breeze' ? <Wind size={19} /> : light === 'golden' ? <Sunset size={19} /> : <Sun size={19} />}</button><button className="icon-button" onClick={() => setLight(night ? 'day' : 'night')} aria-label={night ? 'Bring back daylight' : 'Watch the garden after dark'} aria-pressed={night}>{night ? <Moon size={17} /> : <Sunset size={17} />}</button><button className="icon-button" onClick={() => { setHelp(!help); setAtmosphereOpen(false) }} aria-label="How to explore"><Compass size={18} /></button></div>}
      {atmosphereOpen && !panel && <section className="garden-atmosphere" id="garden-atmosphere" aria-label="Garden atmosphere"><div className="atmosphere-heading"><h2>A different light.</h2><button ref={atmosphereCloseRef} className="icon-button" onClick={closeAtmosphere} aria-label="Close atmosphere settings"><X size={18} /></button></div><p>Let the garden meet your moment.</p><div className="atmosphere-options" role="group" aria-label="Garden lighting"><button aria-pressed={light === 'day'} onClick={() => setLight('day')}><Sun size={21} /><span>Sunlight</span></button><button aria-pressed={light === 'golden'} onClick={() => setLight('golden')}><Sunset size={21} /><span>Golden hour</span></button><button aria-pressed={light === 'night'} onClick={() => setLight('night')}><Moon size={21} /><span>Moonlight</span></button></div><div className="atmosphere-options atmosphere-options--weather" role="group" aria-label="Garden weather"><button aria-pressed={weather === 'clear'} onClick={() => setWeather('clear')}><Leaf size={18} /><span>Still</span></button><button aria-pressed={weather === 'breeze'} onClick={() => setWeather('breeze')}><Wind size={18} /><span>Breeze</span></button><button aria-pressed={weather === 'rain'} onClick={() => setWeather('rain')}><CloudRain size={18} /><span>Rain</span></button></div><small>The paths stay open, whatever the weather.</small></section>}
      {help && !panel && <section className="explore-help"><button className="icon-button" onClick={() => setHelp(false)} aria-label="Close exploration instructions"><X size={16} /></button><h2>There’s a path through it.</h2><p>Click or tap the ground to walk there. The camera follows you, all the way across the garden.</p><dl><div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Walk · drive · steer</dd></div><div><dt><kbd>E</kbd></dt><dd>Read · talk · board · exit</dd></div><div><dt><kbd>Space</kbd></dt><dd>Jump · take off · land</dd></div><div><dt><kbd>Shift</kbd></dt><dd>Run · ride faster</dd></div><div><dt><kbd>M</kbd><kbd>K</kbd></dt><dd>Map · Kijazo</dd></div></dl><p>Vehicles opens a route to each vehicle. The plane’s Return & land control flies back to the runway. The rocket rises, hovers, and lands vertically on its pad.</p><p className="explore-help__touch">Use the thumbstick to wander or steer. Release it to stop driving. The vehicle controls handle takeoff, landing, and getting out.</p></section>}

      {!panel && (mapOpen || exploring) && <section className={`garden-map${mapOpen ? ' is-expanded' : ''}`} aria-label="Garden map"><button className="garden-map__toggle" onClick={() => setMapOpen(!mapOpen)} aria-label={mapOpen ? 'Close map overview' : 'Open map overview'}><Map size={15} /><span>{mapOpen ? 'The wider world' : 'Where you are'}</span>{mapOpen && <X size={15} />}</button><svg viewBox="-140 -135 280 275" role="img" aria-label="The garden, country roads, airstrip, and launch field"><path d="M-125 36 Q0 30 125 36 L125 125 -125 125Z" fill="#c6dad0" /><path d="M -9 -34 Q -3 -15 -9 2 T -9 34" fill="none" stroke="#77a99c" strokeWidth="3" />{[...trails, ...countryRoads].map((path, index) => <polyline key={index} points={path.map((point) => point.join(',')).join(' ')} fill="none" stroke="#b4a989" strokeWidth="2" strokeDasharray={index >= trails.length ? '4 3' : undefined} />)}{districts.map((item) => <g key={item.id}><circle cx={item.entrance[0]} cy={item.entrance[1]} r="3.5" fill={item.color} /><title>{item.name}</title></g>)}{vehicleDefinitions.filter(item => item.id === 'plane' || item.id === 'rocket').map(item => <g key={item.id}><circle cx={item.x} cy={item.z} r="4" fill="#6e7d70" />{mapOpen && <text x={item.x} y={item.z - 8} textAnchor="middle">{item.id === 'plane' ? 'Airstrip' : 'Launch field'}</text>}</g>)}<circle ref={mapDotRef} cx="2" cy="12" r="4" fill="#be653c" stroke="#fff9e8" strokeWidth="1.5" /></svg>{mapOpen && <><p className="garden-map__legend"><span />You are here · choose a place to walk there</p><div className="garden-map__destinations">{districts.map((item) => <button key={item.id} onClick={() => walkDistrict(item.id)}><span style={{ background: item.color }} />{item.name}<ArrowRight size={14} /></button>)}<button onClick={() => walkVehicle('plane')}>The western airstrip <ArrowRight size={14} /></button><button onClick={() => walkVehicle('rocket')}>The launch field <ArrowRight size={14} /></button></div></>}</section>}

      {walking && !panel && exploring && !mapOpen && <div className="walk-status" role="status"><span>{walking.moving ? 'Walking to ' : 'Reached '}{walking.title}</span><button onClick={() => worldRef.current?.cancelRoute()} aria-label={walking.moving ? 'Stop walking' : 'Dismiss arrival message'}>{walking.moving ? 'Stop' : <X size={13} />}</button></div>}
      {journey && !panel && <div className="journey-status"><Waypoints size={16} /><span>{arcs.find((arc) => arc.id === journey)?.name}<small>{journeyStop + 1}/{journeyEntries.length} · {journeyEntries[journeyStop]?.title}</small></span><button onClick={nextStop} aria-label="Walk to the next note"><ArrowRight size={17} /></button><button onClick={() => setJourney(null)} aria-label="Leave the narrative path"><X size={16} /></button></div>}

      {panel && <aside className="portfolio-sheet" ref={sheetRef} tabIndex={-1} aria-label={entry?.title ?? (panel === 'guide' ? 'Kijazo, your garden guide' : panel === 'journeys' ? 'Narrative paths' : panel === 'links' ? 'Find Mathenge elsewhere' : `${panel} in the garden`)}><div className="sheet-toolbar">{entry ? <button className="text-button" onClick={backToShelf}><ArrowLeft size={15} /> Back to the index</button> : <span>{panel === 'guide' ? <Compass size={16} /> : panel === 'links' ? <LinkIcon size={16} /> : <Leaf size={16} />}{panel === 'guide' ? 'Kijazo' : panel === 'journeys' ? 'The paths are the story' : panel === 'writing' ? 'Mathnuscripts' : 'Mwaweru'}</span>}<button ref={closeRef} className="icon-button" onClick={closePanel} aria-label="Close portfolio panel"><X size={19} /></button></div>
        {entry ? <EssayArticle key={entry.slug} entry={entry} onOpenEssay={openEssay} onIndex={backToShelf} onWalk={() => { closePanel(); requestNavigation({ kind: 'essay', slug: entry.slug }) }} />
          : panel === 'guide' ? <section className="guide-content"><h1>{site.guideGreeting}</h1><p className="sheet-lead">{site.guideIntro}</p><p>{site.guideDescription}</p><p>The paths are the story: Origins, Wanderer, Maker, Sovereign. But you can always step off the path.</p><h2>What calls to you?</h2><div className="path-links"><button onClick={() => openPanel('travel')}><Bike size={19} /><span>Vehicles & good company<small>Take the long way around</small></span><ArrowRight size={17} /></button><button onClick={() => openPanel('journeys')}><Waypoints size={19} /><span>Follow a narrative path<small>A journey through connected ideas</small></span><ArrowRight size={17} /></button><button onClick={() => { closePanel(); walkDistrict('knowledge') }}><BookOpen size={19} /><span>Walk to Knowledge & Writing<small>Follow a link. Chase a question.</small></span><ArrowRight size={17} /></button><button onClick={() => openPanel('writing')}><Search size={19} /><span>Find a thought<small>{gardenIndex.length} published notes</small></span><ArrowRight size={17} /></button></div><h2>A thread worth following</h2>{gardenIndex.filter((note) => note.status === 'evergreen' && note.links.length > 0).slice(0, 3).map((note) => <button className="guide-recommendation" key={note.slug} onClick={() => openEssay(note.slug)}>{note.title}<small>{note.links.length} connected ideas</small><ArrowRight size={15} /></button>)}</section>
            : panel === 'journeys' ? <section><h1>The paths<br />are the story.</h1><p className="sheet-lead">A way in, not a rule for where to go.</p><div className="narrative-paths">{arcs.map((arc) => { const entries = gardenIndex.filter((note) => note.arc === arc.id); return <article key={arc.id}><h2>{arc.name}</h2><p>{arc.description}</p><small>{entries.filter((note) => visited.includes(note.slug)).length}/{entries.length} notes explored</small><button className="text-button" onClick={() => startJourney(arc.id)} disabled={!entries.length}>Walk this path <ArrowRight size={15} /></button></article> })}</div></section>
              : panel === 'travel' ? <TravelContent ready={ready && !failed} onVehicle={walkVehicle} onPerson={walkPerson} />
                : panel === 'conversation' && personId ? <Conversation personId={personId} onRead={openEssay} onReturn={closePanel} />
              : panel === 'about' ? <AboutContent onWorkshop={() => { closePanel(); walkDistrict('building') }} onWriting={() => openPanel('writing')} />
                : panel === 'work' ? <PortfolioWork onReturn={closePanel} onWriting={() => openPanel('writing')} />
                  : panel === 'links' ? <ElsewhereLinks onWriting={() => openPanel('writing')} onAbout={() => openPanel('about')} />
                  : <section className="library-content"><h1>Ideas, with room<br />to grow.</h1><p className="sheet-lead">An accessible index of the same notes planted in the garden.</p><label className="library-search"><Search size={17} /><input ref={searchRef} type="search" aria-label="Search notes" placeholder="Find a thought…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>Ctrl / ⌘ K</kbd></label><label className="library-filter">Explore by subject<select value={territory} onChange={(event) => setTerritory(event.target.value as Territory | 'all')}><option value="all">All subjects</option>{Object.entries(territoryNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><div className="library-count" aria-live="polite"><span>{notes.length} notes</span><span><BookOpen size={13} />{visited.length} explored</span></div><div className="note-list">{notes.map((note) => <button className="note-entry" key={note.slug} onClick={() => openEssay(note.slug)}><span className="note-entry__status" data-status={note.status}>{visited.includes(note.slug) ? <Check size={13} /> : <Leaf size={13} />}</span><span><strong>{note.title}</strong><small>{territoryNames[note.territory]} · {note.readingTime} min</small></span><ArrowRight size={15} /></button>)}{notes.length === 0 && <div className="empty-notes"><Search size={24} /><h2>No thoughts found here.</h2><p>Try a different word or explore all the notes.</p><button className="text-button" onClick={() => { setQuery(''); setTerritory('all') }}>Clear the search <ArrowRight size={15} /></button></div>}</div></section>}
      </aside>}

      {ready && !failed && exploring && !panel && !mapOpen && <div className="touch-wander"><button className="thumbstick" aria-label={vehicle ? 'Drag to drive and steer' : 'Drag to walk around the world'} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveStick(event) }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveStick(event) }} onPointerUp={endStick} onPointerCancel={endStick} onLostPointerCapture={endStick}><span style={{ transform: `translate(${stick.x * 29}px, ${stick.y * 29}px)` }} /></button><div className="touch-actions">{!vehicle && <button onClick={() => worldRef.current?.jump()} aria-label="Jump"><ArrowUp size={20} /></button>}<button onClick={() => { worldRef.current?.interact(); mountRef.current?.focus({ preventScroll: true }) }} disabled={vehicle ? !vehicle.canExit : !near} aria-label={vehicle ? 'Park and exit vehicle' : near ? near.title : 'No object nearby'}>{vehicle ? <VehicleIcon size={21} /> : <Leaf size={21} />}<small>{vehicle ? 'Exit' : near?.kind === 'guide' || near?.kind === 'person' ? 'Talk' : near?.kind === 'essay' ? 'Read' : near?.kind === 'vehicle' ? 'Ride' : 'Enter'}</small></button></div></div>}
      <footer className="garden-dock"><nav className="territory-navigation" aria-label="Walk to a territory">{districts.map((item) => <button key={item.id} onClick={() => walkDistrict(item.id)} aria-current={location === item.id ? 'location' : undefined} disabled={!ready || failed}>{item.short}</button>)}</nav><nav className="garden-actions" aria-label="Garden tools"><button onClick={() => { closePanel(); setMapOpen(!mapOpen); setExploring(true) }} aria-pressed={mapOpen}><Map size={17} /><span>Map</span></button><button onClick={() => openPanel('travel')} aria-pressed={panel === 'travel'}><Bike size={17} /><span>Vehicles</span></button><button onClick={() => openPanel('guide')}><Compass size={17} /><span>Kijazo</span></button><button onClick={() => openPanel('journeys')}><Waypoints size={17} /><span>Paths</span></button><button onClick={() => openPanel('writing')}><BookOpen size={17} /><span>Index</span></button><button onClick={() => openPanel('links')} aria-pressed={panel === 'links'}><LinkIcon size={17} /><span>Links</span></button></nav></footer>
      {soundError && <p className="sound-error" role="status">Sound couldn’t start. Try the sound button again.</p>}
      <span className="sr-only" role="status">{ready ? `You are in ${district.name}.` : panel ? 'The portfolio is open.' : 'Loading the native garden.'}</span>
    </main>
  )
}
