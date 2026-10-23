import { ArrowRight, BookOpen, ExternalLink, Github } from 'lucide-react'
import { gardenIndex } from '../game/essays'
import profile from '../../content/elsewhere.json'
import { site, workshop } from '../content'
import { ProjectPreview } from './ProjectPreview'

export function PortfolioWork({ onReturn, onWriting }: { onReturn(): void; onWriting(): void }) {
  const avocado = gardenIndex.find(note => /avocado.*roi|avocado.*calculator/i.test(note.title))
  return <section className="work-content">
    <h1>{site.workTitle}</h1>
    <p className="sheet-lead">{site.workIntro}</p>
    <a className="work-github" href={profile.links.find(link => link.id === 'github')!.url} target="_blank" rel="noreferrer"><Github size={20} /><span>Find my code on GitHub<small>M-Waweru · experiments, tools, and things in progress</small></span><ArrowRight size={17} /></a>
    <div className="work-projects">{workshop.projects.map(project => <article className={`project-entry${project.featured ? ' project-entry--featured' : ''}`} data-project={project.id} key={project.id}>
      <ProjectPreview project={project} /><h2>{project.name}</h2><p>{project.description}</p>
      {Boolean(project.stats?.length) && <><dl className="project-stats" aria-label={`${project.name} published results`}>{project.stats!.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl><div className="project-stats-source">{project.statsNote && <span>{project.statsNote}</span>}{project.statsSource && <a href={project.statsSource} target="_blank" rel="noreferrer">View published results <ExternalLink size={12} /></a>}</div></>}
      <div className="project-entry__meta"><span>{project.category}{project.id === 'mathnuscripts' ? ` · ${gardenIndex.length} complete notes` : ''}</span>{project.id === 'mathnuscripts' ? <button className="text-button" onClick={onWriting}>{project.action} <BookOpen size={14} /></button> : <a href={project.url} target="_blank" rel="noreferrer">{project.action} <ExternalLink size={13} /></a>}</div>
    </article>)}</div>
    <article className="project-entry">
      <img className="project-image" src={`${import.meta.env.BASE_URL}assets/world-project.png`} width="800" height="620" alt="Mwaweru’s native three-dimensional living garden" />
      <h2>The living garden</h2>
      <p>A connected world of published notes, open roads, interesting company, and five ways to get around. Built with Three.js, with Kijazo along for the journey.</p>
      <div className="project-entry__meta"><span>Three.js · React · TypeScript</span><button className="text-button" onClick={onReturn}>Keep wandering <ArrowRight size={14} /></button></div>
    </article>
    <h2>Earlier chapters.</h2>
    {profile.projects.map(project => <article className="project-entry project-entry--linked" key={project.id}><h2>{project.name}</h2><p>{project.description}</p><div className="project-entry__meta"><span>From my published portfolio</span><a href={project.url} target="_blank" rel="noreferrer">Explore the project <ExternalLink size={13} /></a></div></article>)}
    {avocado && <article className="project-entry project-entry--note">
      <h2>{avocado.title}</h2>
      <p>{avocado.summary}</p>
      <div className="project-entry__meta"><span>From the project notes</span><a href={avocado.url} target="_blank" rel="noreferrer">Explore the note <ExternalLink size={13} /></a></div>
    </article>}
  </section>
}
