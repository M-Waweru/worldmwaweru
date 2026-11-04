export const editableFields = [
  { key: 'welcomeTitle', label: 'Welcome heading' },
  { key: 'welcomeIntro', label: 'Welcome introduction' },
  { key: 'welcomeAction', label: 'Explore button' },
  { key: 'aboutTitle', label: 'Homestead heading' },
  { key: 'workTitle', label: 'Workshop heading' },
  { key: 'workIntro', label: 'Workshop introduction' },
  { key: 'travelTitle', label: 'Vehicles heading' },
  { key: 'travelIntro', label: 'Vehicles introduction' },
  { key: 'guideGreeting', label: 'Kijazo greeting' },
  { key: 'guideIntro', label: 'Kijazo introduction' },
  { key: 'guideDescription', label: 'Kijazo description' },
] as const

export type FieldName = (typeof editableFields)[number]['key']
export type EditableCopy = Record<FieldName, string> & { kijazoTheme?: ThemeName }
export type ThemeName = 'original' | 'forest' | 'coast' | 'sunset' | 'dusk'
export const themes: Record<ThemeName, { label: string; colors: Record<string, string> }> = {
  original: { label: 'Original garden', colors: {} },
  forest: { label: 'Deep forest', colors: { '--paper': '#e9eedf', '--paper-deep': '#d3dfc7', '--ink': '#1c3227', '--muted': '#465f4b', '--green': '#294f38', '--line': '#bacdb8' } },
  coast: { label: 'Coastal blue', colors: { '--paper': '#ecf5f3', '--paper-deep': '#cce6e3', '--ink': '#123d4c', '--muted': '#426774', '--green': '#167787', '--line': '#b9d4d2' } },
  sunset: { label: 'Sunset clay', colors: { '--paper': '#f8ead8', '--paper-deep': '#ecd0b8', '--ink': '#54372e', '--muted': '#7c5947', '--green': '#98563c', '--line': '#d9b5a1' } },
  dusk: { label: 'Midnight ink', colors: { '--paper': '#222b37', '--paper-deep': '#303b49', '--ink': '#f0eddf', '--muted': '#c7c6bb', '--green': '#6d947b', '--line': '#647185' } },
}
export const draftKey = 'kijazo:mwaweru:draft:v1'
export function readDraft(original: EditableCopy): EditableCopy {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(draftKey) || 'null')
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const draft = { ...original }
      for (const field of editableFields) {
        const text = (value as Record<string, unknown>)[field.key]
        if (typeof text === 'string' && text.length < 10000) draft[field.key] = text
      }
      const theme = (value as Record<string, unknown>).kijazoTheme
      if (typeof theme === 'string' && theme in themes) draft.kijazoTheme = theme as ThemeName
      return draft
    }
  } catch { /* Storage may be unavailable. */ }
  return { ...original }
}
export function setTheme(name: ThemeName = 'original') {
  const allKeys = Object.keys(themes.forest.colors)
  for (const key of allKeys) {
    const next = themes[name].colors[key]
    if (next) document.documentElement.style.setProperty(key, next)
    else document.documentElement.style.removeProperty(key)
  }
}
export function applyInstruction(current: EditableCopy, message: string, selected: FieldName): { next?: EditableCopy; reply: string } {
  const lower = message.toLowerCase().trim()
  const matches: { name: ThemeName; phrases: string[] }[] = [
    { name: 'forest', phrases: ['forest theme', 'green theme'] },
    { name: 'coast', phrases: ['coastal theme', 'blue theme', 'ocean theme'] },
    { name: 'sunset', phrases: ['sunset theme', 'warm theme'] },
    { name: 'dusk', phrases: ['dark theme', 'dark mode', 'midnight theme'] },
    { name: 'original', phrases: ['original theme', 'reset theme'] },
  ]
  for (const theme of matches) {
    if (theme.phrases.some(phrase => lower.includes(phrase))) return { next: { ...current, kijazoTheme: theme.name }, reply: 'Changed the interface to ' + themes[theme.name].label + '. This is a local draft until published.' }
  }
  const quote = message.match(/["“]([^"”]+)["”]/s)
  if (quote) {
    let key = selected
    const named = editableFields.find(field => lower.includes(field.label.toLowerCase()) || lower.includes(field.key.toLowerCase()))
    if (named) key = named.key
    if (/hero (heading|title)|welcome (heading|title)/.test(lower)) key = 'welcomeTitle'
    if (/welcome (intro|description)/.test(lower)) key = 'welcomeIntro'
    return { next: { ...current, [key]: quote[1] }, reply: 'Updated ' + key + ' locally. You can review the change in the site immediately.' }
  }
  return { reply: 'Try “coastal theme” or “change welcome heading to “My new world””. This initial editor supports exact copy changes and preset themes, not arbitrary AI code generation yet.' }
}
