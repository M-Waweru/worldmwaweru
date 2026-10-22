import { useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink, List, RotateCcw } from 'lucide-react'
import DOMPurify from 'dompurify'
import articleManifest from '../generated/articles-manifest.json'
import type { GardenEntry } from '../game/essays'
import 'katex/dist/katex.min.css'
import './article-reader.css'

type Article = { slug: string; title: string; sourceUrl: string; publishedAt: string | null; words: number; readingTime: number; html: string; toc: { id: string; text: string; level: number }[] }
const cached = new Map<string, Promise<Article>>()
const base = import.meta.env.BASE_URL

function loadArticle(slug: string) {
  const record = articleManifest.articles.find(article => article.slug === slug)
  if (!record) return Promise.reject(new Error('This note is not in the local reading collection.'))
  if (!cached.has(record.path)) cached.set(record.path, fetch(`${base}${record.path}`)
    .then(async response => {
      if (!response.ok) throw new Error('The note could not be loaded. Please try again.')
      const article: Article = await response.json()
      if (article.slug !== slug || typeof article.html !== 'string' || !article.html.trim()) throw new Error('The note could not be opened.')
      article.html = DOMPurify.sanitize(article.html.replaceAll('__WORLD_BASE__/', base), { ADD_ATTR: ['data-essay-slug'], FORBID_TAGS: ['style', 'script', 'form', 'iframe'] })
      return article
    }).catch(error => { cached.delete(record.path); throw error }))
  return cached.get(record.path)!
}

export default function ArticleReader({ entry, onOpenEssay, onIndex }: { entry: GardenEntry; onOpenEssay(slug: string): void; onIndex(): void }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    setArticle(null); setError(''); setCopied(false)
    void loadArticle(entry.slug).then(value => { if (!cancelled) setArticle(value) }).catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'The note could not be opened.') })
    return () => { cancelled = true }
  }, [entry.slug, retry])
  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  function scrollTo(id: string) {
    const heading = body.current?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)
    heading?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  function followLink(event: React.MouseEvent<HTMLDivElement>) {
    const link = event.target instanceof Element ? event.target.closest('a') : null
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const href = link.getAttribute('href') || ''
    const slug = link.dataset.essaySlug
    if (slug) { event.preventDefault(); onOpenEssay(slug); return }
    if (href === '#writing') { event.preventDefault(); onIndex(); return }
    if (href.startsWith('#essay/')) { event.preventDefault(); try { onOpenEssay(decodeURIComponent(href.slice(7))) } catch {} return }
    if (href.startsWith('#')) { event.preventDefault(); try { scrollTo(decodeURIComponent(href.slice(1))) } catch {} }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true); setCopyError(false); window.clearTimeout(copyTimer.current); copyTimer.current = window.setTimeout(() => setCopied(false), 2500)
    } catch { setCopyError(true) }
  }

  if (error) return <div className="article-state" role="alert"><h2>The page needs a moment.</h2><p>{error}</p><button className="primary-button" onClick={() => setRetry(value => value + 1)}>Try again <RotateCcw size={16} /></button></div>
  if (!article) return <div className="article-state" role="status"><span className="article-loading-line" /><p>Opening the note…</p></div>

  const date = article.publishedAt && Number.isFinite(Date.parse(article.publishedAt)) ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(article.publishedAt)) : null
  return <section className="full-article" aria-label="Full article">
    <div className="article-reading-tools">
      <span>{date ? <time dateTime={article.publishedAt!}>{date}</time> : 'From the Mathnuscripts'}</span>
      <button className="text-button" onClick={() => void copyLink()} aria-label="Copy a link to this article">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Link copied' : 'Copy link'}</button>
    </div>
    {copyError && <p className="copy-link-notice" role="status">Copy the address from your browser to share this note.</p>}
    {article.toc.length > 2 && <details className="article-contents"><summary><List size={16} /> On this page</summary><nav aria-label="Article sections">{article.toc.map(heading => <button key={heading.id} data-level={heading.level} onClick={() => scrollTo(heading.id)}>{heading.text}</button>)}</nav></details>}
    <div ref={body} className="reader-content" onClick={followLink} dangerouslySetInnerHTML={{ __html: article.html }} />
    <footer className="article-colophon"><span>A note from the Mathnuscripts.</span><a href={article.sourceUrl} target="_blank" rel="noreferrer">Original publication <ExternalLink size={13} /></a></footer>
  </section>
}
