import profile from '../content/profile.json'
import site from '../content/site.json'
import workshopData from '../content/projects.json'
import people from '../content/people.json'

export type WorkshopProject = { id: string; name: string; category: string; description: string; url: string; preview?: string; previewAlt?: string; embedUrl?: string; icon?: string; action: string; featured?: boolean; stats?: { value: string; label: string }[]; statsNote?: string; statsSource?: string }
export const workshop: { projects: WorkshopProject[] } = workshopData
export { profile, site, people }
/** CMS media paths work both at / and under a Vite deployment subdirectory. */
export const mediaUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
