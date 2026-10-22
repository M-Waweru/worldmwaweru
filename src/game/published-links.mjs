/** Match the live Quartz publisher: retain folders/punctuation, lowercase and hyphenate. */
export function publishedPathFor(sourcePath) {
  return sourcePath
    .replace(/\\/g, '/')
    .replace(/(?:\.md)+$/i, '')
    .split('/')
    .map((segment) => segment.toLowerCase().replace(/\s+/g, '-'))
    .join('/')
}

export function publishedUrlFor(sourcePath) {
  return `https://mathnuscript.com/${publishedPathFor(sourcePath).split('/').map(encodeURIComponent).join('/')}`
}
