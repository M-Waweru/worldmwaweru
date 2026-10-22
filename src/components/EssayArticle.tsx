import { lazy, Suspense } from 'react'
import { ArrowRight, Compass, Leaf } from 'lucide-react'
import { territoryNames, titleForSlug, type GardenEntry } from '../game/essays'

const ArticleReader = lazy(() => import('./ArticleReader'))

export function EssayArticle({ entry, onOpenEssay, onIndex, onWalk }: { entry: GardenEntry; onOpenEssay(slug: string): void; onIndex(): void; onWalk(): void }) {
  return <article className="essay-preview">
    <h1>{entry.title}</h1>
    <p className="essay-meta"><span className="growth-status" data-status={entry.status}><Leaf size={13} />{entry.status}</span><span>{territoryNames[entry.territory]}</span><span>{entry.readingTime} min read</span></p>
    <Suspense fallback={<div className="article-state" role="status"><p>Opening the note…</p></div>}><ArticleReader entry={entry} onOpenEssay={onOpenEssay} onIndex={onIndex} /></Suspense>
    {entry.links.length > 0 && <section className="related-notes"><h2>Follow the thread</h2>{entry.links.map(slug => <button key={slug} onClick={() => onOpenEssay(slug)}>{titleForSlug(slug)}<ArrowRight size={15} /></button>)}</section>}
    <button className="text-button" onClick={onWalk}>Find this note in the garden <Compass size={15} /></button>
  </article>
}
