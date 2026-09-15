import Logo from './Logo.jsx'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl grid gap-6 md:grid-cols-[320px_minmax(420px,1fr)]">
        <aside className="hidden md:flex flex-col justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-10">
            <Logo size="lg" light />
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
              <p className="text-sm text-white/90 font-medium leading-relaxed">
                Encourage Me helps you track emotions, write journal entries, and receive gentle support on your mental wellness journey.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/75 leading-relaxed">
                Sign in or register to access mood insights, favorite quotes, and a community of encouragement.
              </p>
            </div>
          </div>
        </aside>

        <div className="relative flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}
