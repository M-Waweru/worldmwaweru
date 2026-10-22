import * as cheerio from 'cheerio'
import sanitizeHtml from 'sanitize-html'
import { createHash } from 'node:crypto'

export const SOURCE_HOSTS = new Set(['mathnuscript.com', 'www.mathnuscript.com', 'mathnuscripts.netlify.app'])
export function routeKey(url) {
  const value = new URL(url, 'https://mathnuscript.com')
  let pathname
  try { pathname = decodeURIComponent(value.pathname) } catch { pathname = value.pathname }
  return pathname.replace(/\.html$/i, '').replace(/\/+$/, '').toLowerCase()
}
export function articleRoutes(entries) { return new Map(entries.map(entry => [routeKey(entry.url), entry.slug])) }
export function articleId(slug) { return createHash('sha256').update(slug).digest('hex').slice(0, 16) }

const mathTags = ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mfrac', 'msqrt', 'mroot', 'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover', 'mtable', 'mtr', 'mtd', 'annotation', 'mspace', 'menclose', 'mpadded', 'mphantom', 'mstyle']
const svgTags = ['svg', 'g', 'path', 'line', 'circle', 'rect', 'polyline', 'polygon', 'ellipse', 'defs', 'clippath', 'use']
const numericStyle = /^-?(?:\d*\.)?\d+(?:px|em|ex|rem|%)?$/

export function sanitizeArticle(html) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, ...mathTags, ...svgTags, 'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio', 'details', 'summary', 'mark', 'del', 's', 'time', 'kbd', 'samp', 'input'],
    allowedAttributes: {
      '*': ['id', 'class', 'title', 'role', 'aria-*', 'data-essay-slug'],
      a: ['href', 'target', 'rel', 'data-essay-slug', 'id', 'class', 'aria-*', 'role', 'title'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'title'],
      source: ['src', 'type', 'media'], video: ['src', 'poster', 'controls', 'preload', 'width', 'height'], audio: ['src', 'controls', 'preload'],
      input: ['type', 'disabled', 'checked'], time: ['datetime'],
      span: ['id', 'class', 'style', 'aria-*'],
      table: ['class'], td: ['colspan', 'rowspan', 'style'], th: ['colspan', 'rowspan', 'scope', 'style'],
      math: ['xmlns', 'display'], annotation: ['encoding'], mo: ['stretchy', 'fence', 'separator', 'lspace', 'rspace'],
      mrow: ['class'], mspace: ['width', 'height', 'depth'], mstyle: ['mathcolor', 'mathsize', 'displaystyle', 'scriptlevel'],
      svg: ['xmlns', 'width', 'height', 'viewbox', 'preserveaspectratio', 'aria-*', 'role', 'class'],
      g: ['fill', 'stroke', 'transform', 'class'], path: ['d', 'fill', 'stroke', 'stroke-width', 'transform'],
      line: ['x1', 'x2', 'y1', 'y2', 'stroke', 'stroke-width'], circle: ['cx', 'cy', 'r', 'fill', 'stroke'],
      rect: ['x', 'y', 'width', 'height', 'rx', 'fill', 'stroke'], polyline: ['points', 'fill', 'stroke'], polygon: ['points', 'fill', 'stroke'],
      use: ['href', 'xlink:href'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedStyles: { '*': { height: [numericStyle], width: [numericStyle], top: [numericStyle], left: [numericStyle], 'min-width': [numericStyle], 'margin-left': [numericStyle], 'margin-right': [numericStyle], 'margin-top': [numericStyle], 'vertical-align': [numericStyle], 'font-size': [numericStyle], position: [/^(?:relative|absolute)$/], 'text-align': [/^(?:left|right|center)$/] } },
    transformTags: { input: (_tag, attributes) => ({ tagName: 'input', attribs: { type: 'checkbox', disabled: '', ...(Object.hasOwn(attributes, 'checked') ? { checked: '' } : {}) } }) },
    parser: { lowerCaseAttributeNames: true },
  })
}

export function extractArticle(page, entry, entries) {
  const $ = cheerio.load(page)
  const pageSlug = $('body').attr('data-slug')
  if (pageSlug && routeKey(`/${pageSlug}`) !== routeKey(entry.url)) throw new Error(`Published page does not match the requested note: ${entry.url}`)
  const body = $('article .markdown-preview-view').first().length ? $('article .markdown-preview-view').first() : $('.center > article').first().length ? $('.center > article').first() : $('main article').first()
  if (!body.length) throw new Error(`No published article body found: ${entry.url}`)
  const date = $('time[datetime]').first().attr('datetime') || null
  const routes = articleRoutes(entries)
  body.find('script, style, noscript, form, button, .backlinks, .graph, .search, [data-reader-exclude]').remove()
  body.find('a[role="anchor"][aria-hidden="true"]').remove()
  const firstHeading = body.children('h1').first()
  const normalize = value => value.toLowerCase().replace(/\s+/g, ' ').trim()
  const pageTitle = $('.article-title').first().text()
  if (firstHeading.length && [entry.title, pageTitle].filter(Boolean).some(title => normalize(title) === normalize(firstHeading.text()))) firstHeading.remove()
  body.find('iframe').each((_i, element) => {
    const src = $(element).attr('src')
    if (src && /^https?:\/\//i.test(src)) $(element).replaceWith($('<p>').append($('<a>').attr({ href: src, target: '_blank', rel: 'noopener noreferrer' }).text($(element).attr('title') || 'Watch the embedded video')))
    else $(element).remove()
  })
  body.find('a[href]').each((_i, element) => {
    const link = $(element), href = link.attr('href')
    if (!href || href.startsWith('#')) return
    let url
    try { url = new URL(href, entry.url) } catch { link.removeAttr('href'); return }
    const slug = SOURCE_HOSTS.has(url.hostname) ? routes.get(routeKey(url)) : null
    if (slug) { link.attr({ href: `#essay/${encodeURIComponent(slug)}`, 'data-essay-slug': slug }); link.removeAttr('target'); link.removeAttr('rel') }
    else if (SOURCE_HOSTS.has(url.hostname) && ['', '/index', '/content/essays', '/content/notes'].includes(routeKey(url))) { link.attr('href', '#writing'); link.removeAttr('target') }
    else { link.attr('href', url.href); if (/^https?:$/.test(url.protocol)) link.attr({ target: '_blank', rel: 'noopener noreferrer' }) }
  })
  const assets = new Set()
  body.find('img, source, audio, video').each((_i, element) => {
    const media = $(element)
    for (const attribute of ['src', 'poster']) {
      const raw = media.attr(attribute)
      if (!raw || raw.startsWith('data:')) continue
      try { const url = new URL(raw, entry.url); media.attr(attribute, url.href); if (SOURCE_HOSTS.has(url.hostname)) assets.add(url.href) } catch { media.removeAttr(attribute) }
    }
    media.removeAttr('srcset'); media.removeAttr('onerror'); media.removeAttr('onload')
    if (element.tagName === 'img') media.attr({ loading: 'lazy', decoding: 'async' })
    if (element.tagName === 'audio' || element.tagName === 'video') media.attr({ controls: '', preload: 'metadata' })
  })
  const toc = []
  body.find('h2, h3').each((i, element) => {
    const heading = $(element), text = heading.text().trim(), id = heading.attr('id') || `section-${i + 1}`
    heading.attr('id', id); if (text) toc.push({ id, text, level: Number(element.tagName.slice(1)) })
  })
  const html = sanitizeArticle(body.html() || '')
  const plainText = cheerio.load(html, {}, false).text().trim()
  const words = plainText.split(/\s+/).filter(Boolean).length
  if (!words) throw new Error(`Empty published article: ${entry.url}`)
  return { slug: entry.slug, title: entry.title, sourceUrl: entry.url, publishedAt: date, words, readingTime: Math.max(1, Math.round(words / 200)), html, toc, assets: [...assets] }
}

export function rewriteArticleAssets(html, assets, unavailable = new Set()) {
  const $ = cheerio.load(html, {}, false)
  $('img, source, audio, video').each((_i, element) => {
    const media = $(element), source = media.attr('src')
    if (source && unavailable.has(source)) {
      const target = element.tagName === 'source' ? media.parent('audio, video') : media
      target.replaceWith($('<p>').addClass('article-attachment-note').text(`${element.tagName === 'img' ? 'An image' : 'A media attachment'} is unavailable in the published source. The complete note text is included here.`))
      return
    }
    for (const attribute of ['src', 'poster']) { const value = $(element).attr(attribute); if (value && assets.has(value)) $(element).attr(attribute, assets.get(value)) }
  })
  return $.html()
}
