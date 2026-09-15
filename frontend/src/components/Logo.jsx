import logo from '../assets/logo.png'

export default function Logo({ size = 'md', showWordmark = true, light = false }) {
  const dims = { sm: 28, md: 36, lg: 48 }
  const d = dims[size] || dims.md

  return (
    <div className="flex items-center gap-2.5 select-none">
      <img
        src={logo}
        alt="Encourage Me logo"
        width={d}
        height={d}
        className="rounded-xl"
      />
      {showWordmark && (
        <span className={`font-display font-bold text-lg tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
          Encourage <span className="text-brand-green">Me</span>
        </span>
      )}
    </div>
  )
}
