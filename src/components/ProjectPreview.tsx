import { useState } from 'react'
import { Bike, BookOpen, HeartHandshake, Layers3, Play, X } from 'lucide-react'
import { mediaUrl, type WorkshopProject } from '../content'

type Project = WorkshopProject
const icons = { bike: Bike, book: BookOpen, layers: Layers3, heart: HeartHandshake }

export function ProjectPreview({ project }: { project: Project }) {
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(false)
  const Icon = icons[project.icon as keyof typeof icons] || Layers3
  return <div className={`project-preview project-preview--${project.id}`}>
    <div className="project-preview__bar"><span aria-hidden="true"><i /><i /><i /></span><small>{new URL(project.url).host}</small>{live && <button className="icon-button" onClick={() => setLive(false)} aria-label={`Close ${project.name} live preview`}><X size={14} /></button>}</div>
    {live ? <div className="project-preview__live">{loading && <p role="status">Opening {project.name}…</p>}<iframe src={project.embedUrl} title={`${project.name} interactive preview`} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" allow="fullscreen" onLoad={() => setLoading(false)} /></div>
      : project.preview ? <img src={mediaUrl(project.preview)} alt={project.previewAlt} loading="lazy" width="1280" height="800" />
        : <div className="project-preview__brand"><Icon size={46} strokeWidth={1.3} /><strong>{project.name}</strong><span>Tip. Pay. Donate.<br />Across Africa.</span></div>}
    {project.embedUrl && !live && <button className="project-preview__play" onClick={() => { setLoading(true); setLive(true) }}><Play size={15} />{project.icon === 'bike' ? 'Play a little here' : 'Look inside'}</button>}
    {live && <small className="project-preview__hint">You’re viewing the live website. Use the project link below to open it in its own tab.</small>}
  </div>
}
