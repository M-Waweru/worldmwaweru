import { ArrowRight, BookOpen, MessageCircle } from 'lucide-react'
import { people } from '../content'
import { essayBySlug } from '../game/essays'

export function Conversation({ personId, onRead, onReturn }: { personId: string; onRead(slug: string): void; onReturn(): void }) {
  const person = people.people.find(item => item.id === personId)
  if (!person) return <section><h1>They’ve wandered on.</h1><button className="text-button" onClick={onReturn}>Back to the garden <ArrowRight size={15} /></button></section>
  const essay = essayBySlug(person.essaySlug)
  return <section className="conversation-content"><MessageCircle className="conversation-mark" size={38} strokeWidth={1.2} /><h1>{person.name}</h1><p className="sheet-lead">{person.role}</p><blockquote>{person.greeting}</blockquote>{person.dialogue.map(line => <p key={line}>{line}</p>)}{essay && <button className="conversation-note" onClick={() => onRead(essay.slug)}><BookOpen size={23} /><span><small>A thought to take with you</small><strong>{essay.title}</strong><small>{essay.readingTime} min · read the complete note here</small></span><ArrowRight size={18} /></button>}<button className="text-button" onClick={onReturn}>Thanks. I’ll keep wandering. <ArrowRight size={15} /></button></section>
}
