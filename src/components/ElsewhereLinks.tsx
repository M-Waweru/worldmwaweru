import { ArrowRight, BookOpen, ExternalLink, Github, Linkedin, Mail, MessageCircle, Link as LinkIcon } from 'lucide-react'
import profile from '../../content/elsewhere.json'

const icons = { linkedin: Linkedin, github: Github, email: Mail, x: MessageCircle, mathnuscripts: BookOpen }
export function ElsewhereLinks({ onWriting, onAbout }: { onWriting(): void; onAbout(): void }) {
  return <section className="elsewhere-content">
    <h1>A few more<br />paths to follow.</h1>
    <p className="sheet-lead">{profile.statement}</p>
    <p>Some of the places where my work, conversations, and curiosity continue.</p>
    <nav className="elsewhere-list" aria-label="Find Mathenge elsewhere">
      {profile.links.map(link => {
        const Icon = icons[link.id as keyof typeof icons] || LinkIcon
        const content = <><Icon size={21} /><span><strong>{link.label}</strong><small>{link.description}</small></span>{link.kind === 'writing' || link.kind === 'about' ? <ArrowRight size={15} /> : <ExternalLink size={15} />}</>
        return link.kind === 'writing' ? <button key={link.id} onClick={onWriting}>{content}</button>
          : link.kind === 'about' ? <button key={link.id} onClick={onAbout}>{content}</button>
            : <a key={link.id} href={link.url} target={link.kind === 'contact' ? undefined : '_blank'} rel={link.kind === 'contact' ? undefined : 'noreferrer'}>{content}</a>
      })}
    </nav>
    <p className="elsewhere-source">Collected from <a href={profile.source} target="_blank" rel="noreferrer">my Linktree <ExternalLink size={12} /></a> and <a href={profile.aboutSource} target="_blank" rel="noreferrer">published About page <ExternalLink size={12} /></a>.</p>
  </section>
}

export function ContactLinks() {
  return <nav className="contact-links" aria-label="Contact Mathenge">{profile.links.filter(link => ['linkedin', 'github', 'x', 'email'].includes(link.id)).map(link => {
    const Icon = icons[link.id as keyof typeof icons] || ExternalLink
    return <a key={link.id} href={link.url} target={link.kind === 'contact' ? undefined : '_blank'} rel={link.kind === 'contact' ? undefined : 'noreferrer'}><Icon size={17} /><span>{link.label}</span></a>
  })}</nav>
}
