/** Pure validation shared by the build and editorial regression checks. */
export function validateEditableContent(config, documents, { mediaExists = () => true, essaySlugs = new Set() } = {}) {
  const errors = []
  const error = (path, message) => errors.push(`${path}: ${message}`)
  function field(value, definition, path) {
    if (value === undefined || value === null || value === '') {
      if (definition.required) error(path, 'a value is required')
      return
    }
    if (definition.list) {
      if (!Array.isArray(value)) { error(path, 'must be a list'); return }
      if (definition.required && !value.length) error(path, 'must contain at least one item')
      value.forEach((item, index) => field(item, { ...definition, list: false }, `${path}[${index}]`))
    } else if (definition.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) { error(path, 'must be an object'); return }
      for (const child of definition.fields || []) field(value[child.name], child, `${path}.${child.name}`)
    } else if (definition.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) error(path, 'must be a finite number')
    } else if (definition.type === 'boolean') {
      if (typeof value !== 'boolean') error(path, 'must be true or false')
    } else {
      if (typeof value !== 'string') { error(path, 'must be text'); return }
      if (definition.type === 'select' && !definition.options?.values?.includes(value)) error(path, 'choose a configured option')
      if (definition.type === 'image') {
        if (!value.startsWith('/assets/') || value.split('/').includes('..')) error(path, 'use an image in /assets/')
        else if (!mediaExists(value)) error(path, `image does not exist: ${value}`)
      }
    }
  }
  for (const entry of config.content || []) {
    const document = documents[entry.path]
    if (!document || entry.type !== 'file' || entry.format !== 'json') { error(entry.path, 'expected an editable JSON file'); continue }
    for (const definition of entry.fields || []) field(document[definition.name], definition, `${entry.path}.${definition.name}`)
  }
  function url(value, path, contact = false) {
    if (!value) return
    try { const parsed = new URL(value); if (parsed.protocol !== 'https:' && !(contact && parsed.protocol === 'mailto:')) error(path, 'use an HTTPS URL or a contact mailto link') }
    catch { error(path, 'invalid URL') }
  }
  function ids(items, path) {
    const seen = new Set()
    for (const item of items) {
      if (!/^[a-z][a-z0-9-]*$/.test(item.id || '')) error(path, 'IDs must use lowercase letters, numbers, and hyphens')
      if (seen.has(item.id)) error(path, `duplicate ID: ${item.id}`)
      seen.add(item.id)
    }
  }
  const projects = documents['content/projects.json']?.projects || []
  ids(projects, 'workshop.projects')
  if (projects[0]?.id !== 'thenks') error('workshop.projects', 'keep Thenks as the lead project')
  if (!projects.some(project => project.id === 'mathnuscripts')) error('workshop.projects', 'retain the Mathnuscripts project and local reading link')
  for (const project of projects) {
    url(project.url, `workshop.${project.id}.url`); url(project.embedUrl, `workshop.${project.id}.embedUrl`)
    url(project.statsSource, `workshop.${project.id}.statsSource`)
    if (Array.isArray(project.stats) && project.stats.length && !project.statsSource) error(`workshop.${project.id}.statsSource`, 'provide the published source for these results')
    if (project.preview && !project.previewAlt?.trim()) error(`workshop.${project.id}.previewAlt`, 'describe the preview image')
  }
  const people = documents['content/people.json']?.people || []
  ids(people, 'residents.people')
  for (const person of people) {
    if (!essaySlugs.has(person.essaySlug)) error(`residents.${person.id}.essaySlug`, 'use an exact published Mathnuscripts note ID')
    if (!/^#[\da-f]{6}$/i.test(person.coat || '')) error(`residents.${person.id}.coat`, 'use a six-digit hex colour')
    if (Math.hypot(person.x, person.z) > 124 || person.z > 31) error(`residents.${person.id}.position`, 'place the resident on land inside the world')
  }
  const elsewhere = documents['content/elsewhere.json']
  if (elsewhere) {
    ids(elsewhere.links || [], 'elsewhere.links'); ids(elsewhere.projects || [], 'elsewhere.projects')
    if (!elsewhere.links?.some(link => link.id === 'github')) error('elsewhere.links', 'keep the GitHub link with ID github')
    for (const link of elsewhere.links || []) { url(link.url, `elsewhere.${link.id}.url`, link.kind === 'contact'); url(link.source, `elsewhere.${link.id}.source`) }
    for (const project of elsewhere.projects || []) { url(project.url, `earlier.${project.id}.url`); url(project.source, `earlier.${project.id}.source`) }
    url(elsewhere.source, 'elsewhere.source'); url(elsewhere.aboutSource, 'elsewhere.aboutSource')
  }
  return errors
}
