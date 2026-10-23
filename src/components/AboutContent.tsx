import { ArrowRight, BookOpen, Code2 } from 'lucide-react'
import { ContactLinks } from './ElsewhereLinks'
import { mediaUrl, profile, site, workshop } from '../content'

export function AboutContent({ onWorkshop, onWriting }: { onWorkshop(): void; onWriting(): void }) {
  return <section className="about-content">
    <div className="homestead-heading"><h1>{site.aboutTitle}</h1><img src={mediaUrl(profile.portrait)} alt={profile.portraitAlt} width="128" height="160" /></div>
    <p className="sheet-lead">{profile.role}</p>
    <p>{profile.summary}</p>
    <section className="homestead-now" aria-label="What I’m doing now"><h2>Right now</h2><p>{profile.currentFocus}</p><a href={workshop.projects.find(project => project.id === 'thenks')!.url} target="_blank" rel="noreferrer" className="text-button">Meet Thenks <ArrowRight size={14} /></a></section>
    {profile.biography.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    <blockquote className="personal-mantra">{profile.mantra}</blockquote>
    <p>{profile.outsideWork}</p>
    <h2>There’s more down the path.</h2>
    <div className="path-links"><button onClick={onWorkshop}><Code2 size={19} /><span>Visit the workshop<small>Things in the making</small></span><ArrowRight size={17} /></button><button onClick={onWriting}><BookOpen size={19} /><span>Explore the writing<small>Read the complete Mathnuscripts here</small></span><ArrowRight size={17} /></button></div>
    <h2>A conversation can be a beginning.</h2>
    <ContactLinks />
    <h2>Beyond the workbench.</h2>
    <div className="homestead-album">{profile.gallery.map(photo => <figure key={photo.image}><a href={mediaUrl(photo.image)} target="_blank" rel="noreferrer" aria-label={`Open photograph: ${photo.caption}`}><img src={mediaUrl(photo.image)} alt={photo.alt} loading="lazy" width="480" height="360" /></a><figcaption>{photo.caption}</figcaption></figure>)}</div>
  </section>
}
