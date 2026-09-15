// Renders a quote/affirmation as a branded downloadable image using the
// native Canvas API — no external libraries needed, works entirely
// client-side.

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

export function generateEncouragementCard({ text, author }) {
  const width = 1080
  const height = 1080
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#0B1F3A')
  gradient.addColorStop(1, '#123256')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Decorative accent circle
  ctx.beginPath()
  ctx.arc(width - 80, 80, 220, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(46, 139, 87, 0.15)'
  ctx.fill()

  // Quote mark
  ctx.fillStyle = '#2E8B57'
  ctx.font = '700 140px Georgia, serif'
  ctx.fillText('"', 90, 260)

  // Quote text, wrapped and centered vertically-ish
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '600 52px Georgia, serif'
  const maxWidth = width - 180
  const lines = wrapText(ctx, text, maxWidth)
  const lineHeight = 68
  const startY = height / 2 - (lines.length * lineHeight) / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, 90, startY + i * lineHeight)
  })

  // Author
  if (author) {
    ctx.fillStyle = '#5BAE84'
    ctx.font = '500 34px Arial, sans-serif'
    ctx.fillText(`— ${author}`, 90, startY + lines.length * lineHeight + 50)
  }

  // Footer branding
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 26px Arial, sans-serif'
  ctx.fillText('Encourage Me · Built and Powered by Emtrixz Technology', 90, height - 60)

  return canvas.toDataURL('image/png')
}

export function downloadEncouragementCard({ text, author }) {
  const dataUrl = generateEncouragementCard({ text, author })
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = 'encourage-me-quote.png'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
