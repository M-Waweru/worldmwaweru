import { useEffect, useState } from 'react'
import { applyInstruction, draftKey, editableFields, readDraft, setTheme, themes, type EditableCopy, type FieldName, type ThemeName } from './core'
import './editor.css'

type Message = { role: 'you' | 'kijazo'; content: string }
export function KijazoEditor({ original, onChange }: { original: EditableCopy; onChange(next: EditableCopy): void }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<FieldName>('welcomeTitle')
  const [draft, setDraft] = useState<EditableCopy>(() => readDraft(original))
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([{ role: 'kijazo', content: 'Karibu. Choose something to edit, or ask me to change the theme. Your edits appear immediately, but only in your browser.' }])
  const [copied, setCopied] = useState(false)
  useEffect(() => { onChange(draft); setTheme(draft.kijazoTheme) }, [draft, onChange])
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); setOpen(value => !value) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  function update(next: EditableCopy) {
    setDraft(next)
    try { localStorage.setItem(draftKey, JSON.stringify(next)) } catch { /* optional */ }
  }
  function send() {
    const message = prompt.trim()
    if (!message) return
    const result = applyInstruction(draft, message, selected)
    setMessages(previous => [...previous, { role: 'you', content: message }, { role: 'kijazo', content: result.reply }])
    if (result.next) update(result.next)
    setPrompt('')
  }
  function exportContent() {
    const blob = new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'site.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  async function copyPatch() {
    const changed = Object.fromEntries([...editableFields.map(field => field.key), 'kijazoTheme'].filter(key => draft[key as FieldName] !== original[key as FieldName]).map(key => [key, draft[key as FieldName]]))
    try { await navigator.clipboard.writeText(JSON.stringify(changed, null, 2)); setCopied(true) } catch { setCopied(false) }
  }
  function reset() {
    update({ ...original })
    setMessages(previous => [...previous, { role: 'kijazo', content: 'Restored the published content in your local editor. No GitHub files were changed.' }])
  }
  return <div className="kijazo-sdk" data-kijazo-editor onKeyDown={event => event.stopPropagation()}>
    {!open && <button type="button" className="kijazo-launch" onClick={() => setOpen(true)} aria-label="Open Kijazo editor">✦ <span>Edit with Kijazo</span></button>}
    {open && <aside className="kijazo-panel" aria-label="Kijazo editor">
      <header className="kijazo-panel-head"><span><b>✦ Kijazo</b><small>Live website editor · MVP</small></span><button type="button" onClick={() => setOpen(false)} aria-label="Close editor">✕</button></header>
      <div className="kijazo-editor-content">
        <div className="kijazo-notice">Private to this browser until you export changes. Public visitors cannot see this panel unless they enable editor mode.</div>
        <label className="kijazo-label" htmlFor="kijazo-field">Choose an element</label>
        <select id="kijazo-field" value={selected} onChange={event => setSelected(event.target.value as FieldName)}>
          {editableFields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
        </select>
        <label className="kijazo-label" htmlFor="kijazo-text">Edit content</label>
        <textarea id="kijazo-text" rows={3} value={draft[selected]} onChange={event => update({ ...draft, [selected]: event.target.value })} />
        <label className="kijazo-label" htmlFor="kijazo-theme">Theme</label>
        <select id="kijazo-theme" value={draft.kijazoTheme || 'original'} onChange={event => update({ ...draft, kijazoTheme: event.target.value as ThemeName })}>
          {Object.entries(themes).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
        <div className="kijazo-chat" role="log" aria-label="Editing conversation">{messages.map((message, i) => <p key={i} data-role={message.role}><strong>{message.role === 'you' ? 'You' : 'Kijazo'}</strong>{message.content}</p>)}</div>
        <label className="kijazo-label" htmlFor="kijazo-prompt">Ask Kijazo</label>
        <div className="kijazo-input"><input id="kijazo-prompt" value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); send() } }} placeholder='Try "coastal theme"' /><button type="button" onClick={send}>Send</button></div>
        <div className="kijazo-actions"><button type="button" onClick={exportContent}>Export site.json</button><button type="button" onClick={() => void copyPatch()}>{copied ? 'Copied' : 'Copy changes'}</button><button type="button" onClick={reset}>Reset</button></div>
        <p className="kijazo-footnote">These are local changes. To publish: replace content/site.json in GitHub with the exported file, then let your existing hosting deployment update the public site. Automated publishing needs an authenticated server connection, planned next.</p>
      </div>
    </aside>}
  </div>
}
