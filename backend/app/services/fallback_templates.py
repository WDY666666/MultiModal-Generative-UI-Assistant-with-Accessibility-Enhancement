LOGIN_FALLBACK_CODE = """export default function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
            Secure workspace access
          </p>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white">
            Sign in to continue your work
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Accessible login fallback with clear labels, keyboard focus states, and balanced contrast.
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3" aria-label="Platform highlights">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="mt-1 text-xs text-slate-300">Uptime</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20">
              <p className="text-2xl font-bold text-white">AA</p>
              <p className="mt-1 text-xs text-slate-300">Accessibility</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="mt-1 text-xs text-slate-300">Monitoring</p>
            </div>
          </div>
        </div>

        <form className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl" aria-labelledby="login-title">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30" aria-hidden="true">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 7.2L12 11.4L20 7.2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M6.5 10V15.2C6.5 16.7 9 18.2 12 18.2C15 18.2 17.5 16.7 17.5 15.2V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 id="login-title" className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-sm text-slate-300">Use your email and password to sign in</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-100">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-medium text-slate-100">Password</label>
                <a href="#" className="text-sm font-medium text-cyan-200 underline-offset-4 transition hover:text-cyan-100 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              />
              <p className="mt-2 text-xs text-slate-400">Use at least 8 characters with numbers or symbols.</p>
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
            >
              Sign in
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-300">
            No account yet?
            <a href="#" className="ml-1 font-semibold text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">
              Create account
            </a>
          </p>
        </form>
      </section>
    </main>
  )
}"""


DASHBOARD_FALLBACK_CODE = """import { useEffect, useState } from 'react'

type RoutePath = '/' | '/plans/new'

const courses = [
  { title: 'React Component Design', progress: '82%', status: 'Keep learning' },
  { title: 'Tailwind Accessibility Styles', progress: '64%', status: 'Today task' },
  { title: 'Product Prototype Review', progress: '41%', status: 'Pending' },
]

function normalizePath(pathname: string): RoutePath {
  return pathname === '/plans/new' ? '/plans/new' : '/'
}

export default function App() {
  const [path, setPath] = useState<RoutePath>(() => normalizePath(window.location.pathname))
  const [planName, setPlanName] = useState('')
  const [planGoal, setPlanGoal] = useState('')
  const [planCycle, setPlanCycle] = useState('4 weeks')
  const [saved, setSaved] = useState(false)

  const navigate = (nextPath: RoutePath) => {
    window.history.pushState({ path: nextPath }, '', nextPath)
    setPath(nextPath)
  }

  useEffect(() => {
    const onPopState = () => {
      setPath(normalizePath(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (path === '/plans/new') {
    return (
      <main className="min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
          <section className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Route: /plans/new</p>
                <h1 className="mt-2 text-3xl font-bold text-white">Create Plan</h1>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="h-10 rounded-xl border border-white/20 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
              >
                Back to Dashboard
              </button>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                setSaved(true)
              }}
              aria-label="Create plan form"
            >
              <div>
                <label htmlFor="plan-name" className="mb-2 block text-sm font-medium text-slate-100">Plan Name</label>
                <input
                  id="plan-name"
                  value={planName}
                  onChange={(event) => setPlanName(event.target.value)}
                  placeholder="Frontend engineering advanced plan"
                  className="h-11 w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                />
              </div>

              <div>
                <label htmlFor="plan-goal" className="mb-2 block text-sm font-medium text-slate-100">Learning Goal</label>
                <textarea
                  id="plan-goal"
                  value={planGoal}
                  onChange={(event) => setPlanGoal(event.target.value)}
                  placeholder="Describe your expected skills and outcomes"
                  className="min-h-[110px] w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                />
              </div>

              <div>
                <label htmlFor="plan-cycle" className="mb-2 block text-sm font-medium text-slate-100">Plan Cycle</label>
                <select
                  id="plan-cycle"
                  value={planCycle}
                  onChange={(event) => setPlanCycle(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-white focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                >
                  <option>2 weeks</option>
                  <option>4 weeks</option>
                  <option>8 weeks</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
                >
                  Save Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlanName('')
                    setPlanGoal('')
                    setPlanCycle('4 weeks')
                    setSaved(false)
                  }}
                  className="h-11 rounded-xl border border-white/20 px-5 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
                >
                  Reset
                </button>
                {saved && (
                  <p className="text-sm text-emerald-300" role="status" aria-live="polite">
                    Plan saved. You can continue adding detailed tasks.
                  </p>
                )}
              </div>
            </form>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="grid min-h-screen w-full lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-white/10 bg-white/[0.04] p-5 lg:block" aria-label="Course navigation">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500" aria-hidden="true" />
            <div>
              <p className="font-bold text-white">EduPilot</p>
              <p className="text-xs text-slate-400">Learning Console</p>
            </div>
          </div>
          <nav className="space-y-2">
            {['Overview', 'My Courses', 'Learning Plans', 'A11y Report'].map((item) => (
              <button
                type="button"
                key={item}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="relative z-10 min-h-screen overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Accessible Dashboard</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">Online Learning Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Track progress, course tasks, and key metrics with clear focus states.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/plans/new')}
                className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
              >
                New Learning Plan
              </button>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              {['Today 126 minutes', 'Tasks 8/10', 'A11y Score 96'].map((metric) => (
                <article key={metric} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/20">
                  <p className="text-sm text-slate-400">Key Metric</p>
                  <p className="mt-2 text-2xl font-bold text-white">{metric}</p>
                </article>
              ))}
            </div>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/20" aria-labelledby="course-title">
              <h2 id="course-title" className="text-lg font-bold text-white">Course Progress</h2>
              <div className="mt-4 space-y-3">
                {courses.map((course) => (
                  <article key={course.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{course.title}</h3>
                        <p className="text-sm text-slate-400">{course.status}</p>
                      </div>
                      <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">{course.progress}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}"""


def build_fallback_code(prompt: str) -> str:
    normalized_prompt = prompt.lower()
    login_terms = (
        "login",
        "signin",
        "sign in",
        "email",
        "password",
        "\u767b\u5f55",
        "\u90ae\u7bb1",
        "\u5bc6\u7801",
        "\u5fd8\u8bb0\u5bc6\u7801",
    )
    if any(term in normalized_prompt for term in login_terms):
        return LOGIN_FALLBACK_CODE
    return DASHBOARD_FALLBACK_CODE
