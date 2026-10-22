import { ArrowRight, BookOpen, Code2, ExternalLink } from 'lucide-react'
import { ContactLinks } from './ElsewhereLinks'

export function AboutContent({ onWorkshop, onWriting }: { onWorkshop(): void; onWriting(): void }) {
  return <section className="about-content">
    <h1>Hello, I’m<br />Mathenge.</h1>
    <p className="sheet-lead">A maker of things.<br />A keeper of questions.</p>
    <p>I’m an innovator, venture-builder, and leader. I like solving real-world problems with technology, especially ideas that can make a difference across communities.</p>
    <blockquote className="personal-mantra">Express yourself.<br />Contribute to humanity.<br />Tell the story.</blockquote>
    <p>My work spans market research, software development, business development, and leading teams. Previously, I was co-founder and Product Lead at Shukran, a digital tipping and financial-services platform for service workers in Africa’s hospitality industry.</p>
    <p>Outside the workbench: journaling, hiking, digital gardening, and the freedom of a motorcycle ride. The Mathnuscripts are where many of those questions become writing.</p>
    <h2>There’s more down the path.</h2>
    <div className="path-links"><button onClick={onWorkshop}><Code2 size={19} /><span>Visit the workshop<small>Things in the making</small></span><ArrowRight size={17} /></button><button onClick={onWriting}><BookOpen size={19} /><span>Explore the writing<small>Read the complete Mathnuscripts here</small></span><ArrowRight size={17} /></button></div>
    <h2>A conversation can be a beginning.</h2>
    <ContactLinks />
    <p className="sheet-footnote">Biography and links from <a href="https://mwaweru.com/about" target="_blank" rel="noreferrer">my published About page <ExternalLink size={12} /></a>.</p>
  </section>
}
