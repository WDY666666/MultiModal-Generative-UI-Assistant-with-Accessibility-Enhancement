LOGIN_FALLBACK_CODE = """export default function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
            安全工作区访问
          </p>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white">
            登录后继续你的工作
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            这是具备无障碍能力的登录兜底页面，包含清晰标签、键盘焦点状态与合规对比度。
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3" aria-label="平台亮点">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="mt-1 text-xs text-slate-300">在线率</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20">
              <p className="text-2xl font-bold text-white">AA</p>
              <p className="mt-1 text-xs text-slate-300">无障碍等级</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="mt-1 text-xs text-slate-300">实时监控</p>
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
              <h2 id="login-title" className="text-2xl font-bold text-white">欢迎回来</h2>
              <p className="text-sm text-slate-300">使用邮箱和密码登录你的账户</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-100">邮箱地址</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="请输入邮箱地址"
                className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-medium text-slate-100">密码</label>
                <a href="#" className="text-sm font-medium text-cyan-200 underline-offset-4 transition hover:text-cyan-100 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">
                  忘记密码？
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
              />
              <p className="mt-2 text-xs text-slate-400">建议至少使用 8 位，并包含数字或符号。</p>
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
            >
              登录
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-300">
            还没有账号？
            <a href="#" className="ml-1 font-semibold text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">
              立即注册
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
  { title: 'React 组件设计实战', progress: '82%', status: '继续学习' },
  { title: 'Tailwind 无障碍样式优化', progress: '64%', status: '今日任务' },
  { title: '产品原型评审与迭代', progress: '41%', status: '待处理' },
]

function normalizePath(pathname: string): RoutePath {
  return pathname === '/plans/new' ? '/plans/new' : '/'
}

export default function App() {
  const [path, setPath] = useState<RoutePath>(() => normalizePath(window.location.pathname))
  const [planName, setPlanName] = useState('')
  const [planGoal, setPlanGoal] = useState('')
  const [planCycle, setPlanCycle] = useState('4 周')
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
                <h1 className="mt-2 text-3xl font-bold text-white">创建学习计划</h1>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="h-10 rounded-xl border border-white/20 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
              >
                返回仪表盘
              </button>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                setSaved(true)
              }}
              aria-label="创建学习计划表单"
            >
              <div>
                <label htmlFor="plan-name" className="mb-2 block text-sm font-medium text-slate-100">计划名称</label>
                <input
                  id="plan-name"
                  value={planName}
                  onChange={(event) => setPlanName(event.target.value)}
                  placeholder="例如：前端工程进阶训练计划"
                  className="h-11 w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                />
              </div>

              <div>
                <label htmlFor="plan-goal" className="mb-2 block text-sm font-medium text-slate-100">学习目标</label>
                <textarea
                  id="plan-goal"
                  value={planGoal}
                  onChange={(event) => setPlanGoal(event.target.value)}
                  placeholder="描述你希望达成的能力与成果"
                  className="min-h-[110px] w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                />
              </div>

              <div>
                <label htmlFor="plan-cycle" className="mb-2 block text-sm font-medium text-slate-100">计划周期</label>
                <select
                  id="plan-cycle"
                  value={planCycle}
                  onChange={(event) => setPlanCycle(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-white focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                >
                  <option>2 周</option>
                  <option>4 周</option>
                  <option>8 周</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
                >
                  保存计划
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlanName('')
                    setPlanGoal('')
                    setPlanCycle('4 周')
                    setSaved(false)
                  }}
                  className="h-11 rounded-xl border border-white/20 px-5 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
                >
                  重置
                </button>
                {saved && (
                  <p className="text-sm text-emerald-300" role="status" aria-live="polite">
                    计划已保存，你可以继续补充详细任务。
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
        <aside className="hidden border-r border-white/10 bg-white/[0.04] p-5 lg:block" aria-label="课程导航">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500" aria-hidden="true" />
            <div>
              <p className="font-bold text-white">EduPilot</p>
              <p className="text-xs text-slate-400">学习控制台</p>
            </div>
          </div>
          <nav className="space-y-2">
            {['总览', '我的课程', '学习计划', '无障碍报告'].map((item) => (
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
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">无障碍仪表盘</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">在线学习仪表盘</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  用清晰的焦点状态追踪学习进度、课程任务和关键指标。
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/plans/new')}
                className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40"
              >
                新建学习计划
              </button>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              {['今日学习 126 分钟', '任务完成 8/10', '无障碍评分 96'].map((metric) => (
                <article key={metric} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/20">
                  <p className="text-sm text-slate-400">关键指标</p>
                  <p className="mt-2 text-2xl font-bold text-white">{metric}</p>
                </article>
              ))}
            </div>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-xl shadow-black/20" aria-labelledby="course-title">
              <h2 id="course-title" className="text-lg font-bold text-white">课程进度</h2>
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
