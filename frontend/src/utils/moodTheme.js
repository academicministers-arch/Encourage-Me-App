// Maps each emotion to a very soft background wash — intentionally subtle
// so the app still reads as calm and professional, not a jarring color
// swap. Two radial washes blended with the base surface color.

const THEMES = {
  Happy: { a: '#FDF6E3', b: '#EAF7EE' },       // warm gold + soft green
  Excited: { a: '#FDF0E0', b: '#FCEFE0' },     // warm apricot
  Motivated: { a: '#EAF7EE', b: '#E7F3FA' },   // green + cool blue
  Calm: { a: '#EAF7EE', b: '#EEF4F8' },        // green + pale blue
  Sad: { a: '#EAF1F8', b: '#F0F1F5' },         // muted blue-gray
  Lonely: { a: '#EFEFF6', b: '#EAF1F8' },      // soft lavender-blue
  Stressed: { a: '#FCEDE9', b: '#FBF3E9' },    // muted warm red/orange
  Anxious: { a: '#FBF0EA', b: '#EFEFF6' },     // warm + cool blend
  Angry: { a: '#FBEAEA', b: '#FCEFE0' },       // muted red/orange
  Confused: { a: '#F1EFF6', b: '#EFF1F5' },    // soft neutral purple-gray
}

const DEFAULT_THEME = { a: '#F5F7FA', b: '#F5F7FA' } // app's default surface color

export function getMoodTheme(emotion) {
  return THEMES[emotion] || DEFAULT_THEME
}

export function moodGradient(emotion) {
  const { a, b } = getMoodTheme(emotion)
  return `radial-gradient(ellipse 80% 50% at 20% 0%, ${a} 0%, transparent 60%), ` +
         `radial-gradient(ellipse 70% 50% at 100% 20%, ${b} 0%, transparent 60%)`
}
