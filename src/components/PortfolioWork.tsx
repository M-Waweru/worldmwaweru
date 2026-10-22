import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react'
import { gardenIndex, essayBySlug } from '../game/essays'
import profile from '../../content/elsewhere.json'

export function PortfolioWork({ onReturn, onWriting }: { onReturn(): void; onWriting(): void }) {
  const avocado = gardenIndex.find(note => /avocado.*roi|avocado.*calculator/i.test(note.title))
  return <section className="work-content">
    <h1>Made, and<br />in the making.</h1>
    <p className="sheet-lead">Ideas become clearer when you build something with them.</p>
    <article className="project-entry">
      <img className="project-image" src={`${import.meta.env.BASE_URL}assets/world-project.png`} width="800" height="620" alt="Mwaweru’s native three-dimensional living garden" />
      <h2>The living garden</h2>
      <p>A connected, walkable world generated from published notes. Five territories, planted ideas, and Kijazo to keep you company.</p>
      <div className="project-entry__meta"><span>Three.js · React · TypeScript</span><button className="text-button" onClick={onReturn}>Keep wandering <ArrowRight size={14} /></button></div>
    </article>
    <article className="project-entry">
      <h2>The Mathnuscripts</h2>
      <blockquote className="project-excerpt">{essayBySlug('What are the Mathnuscripts')?.summary || 'A living system of mind: memory, meaning, and making.'}</blockquote>
      <div className="project-entry__meta"><span>{gardenIndex.length} complete notes</span><button className="text-button" onClick={onWriting}>Read here <BookOpen size={14} /></button></div>
    </article>
    <article className="project-entry project-entry--linked"><h2>Thenks</h2><p>Card and mobile-money tipping in Africa. One of the projects linked from my Linktree.</p><div className="project-entry__meta"><span>Digital tipping</span><a href="https://thenks.co" target="_blank" rel="noreferrer">Explore Thenks <ExternalLink size={13} /></a></div></article>
    {profile.projects.map(project => <article className="project-entry project-entry--linked" key={project.id}><h2>{project.name}</h2><p>{project.description}</p><div className="project-entry__meta"><span>From my published portfolio</span><a href={project.url} target="_blank" rel="noreferrer">Explore the project <ExternalLink size={13} /></a></div></article>)}
    {avocado && <article className="project-entry project-entry--note">
      <h2>{avocado.title}</h2>
      <p>{avocado.summary}</p>
      <div className="project-entry__meta"><span>From the project notes</span><a href={avocado.url} target="_blank" rel="noreferrer">Explore the note <ExternalLink size={13} /></a></div>
    </article>}
  </section>
}
