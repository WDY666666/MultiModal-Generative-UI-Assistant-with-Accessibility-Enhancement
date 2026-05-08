from app.schemas.response import InteractionPlan


LOGIN_MODAL_FALLBACK_CODE = """import { useState } from 'react'

type Mode = 'login' | 'register' | 'forgot'

export default function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [status, setStatus] = useState('')
  const title = mode === 'login' ? '欢迎回来' : mode === 'register' ? '创建账号' : '找回密码'
  const action = mode === 'login' ? '登录' : mode === 'register' ? '完成注册' : '发送重置说明'

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(59,130,246,0.15),transparent_26%)]" />
      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">认证流程兜底模板</p>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white">登录、注册、找回密码都有真实可点击流程</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">当模型输出不可用时，系统会使用这个可预览模板兜底，避免白屏或空页面。</p>
        </div>

        <form
          className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
          aria-labelledby="auth-title"
          onSubmit={(event) => {
            event.preventDefault()
            setStatus(mode === 'login' ? '已模拟登录成功。' : mode === 'register' ? '已模拟创建账号。' : '已模拟发送重置邮件。')
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{mode}</p>
          <h2 id="auth-title" className="mt-3 text-3xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">填写信息后继续完成当前认证流程。</p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-100">邮箱地址</label>
              <input id="email" type="email" autoComplete="email" placeholder="请输入邮箱地址" className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20" />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-100">密码</label>
                <input id="password" type="password" autoComplete="current-password" placeholder="请输入密码" className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20" />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-100">确认密码</label>
                <input id="confirm" type="password" placeholder="请再次输入密码" className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20" />
              </div>
            )}

            <button type="submit" className="h-11 w-full rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40">{action}</button>
          </div>

          {status && <p className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100" role="status" aria-live="polite">{status}</p>}

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            {mode !== 'login' && <button type="button" onClick={() => setMode('login')} className="font-semibold text-cyan-200 hover:text-cyan-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">返回登录</button>}
            {mode !== 'register' && <button type="button" onClick={() => setMode('register')} className="font-semibold text-cyan-200 hover:text-cyan-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">立即注册</button>}
            {mode !== 'forgot' && <button type="button" onClick={() => setMode('forgot')} className="font-semibold text-cyan-200 hover:text-cyan-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">忘记密码</button>}
          </div>
        </form>
      </section>
    </main>
  )
}"""


LOGIN_ROUTE_FALLBACK_CODE = LOGIN_MODAL_FALLBACK_CODE


DASHBOARD_FALLBACK_CODE = """import { useState } from 'react'

type View = 'home' | 'new' | 'detail'

const items = [
  { title: '首页信息架构检查', status: '进行中', progress: '72%' },
  { title: '注册流程无障碍修复', status: '待审核', progress: '48%' },
  { title: '移动端导航可用性测试', status: '已完成', progress: '100%' },
]

export default function App() {
  const [view, setView] = useState<View>('home')
  const [saved, setSaved] = useState(false)

  if (view === 'new') {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
        <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
          <form
            className="w-full rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30"
            aria-label="新建工作项表单"
            onSubmit={(event) => {
              event.preventDefault()
              setSaved(true)
            }}
          >
            <button type="button" onClick={() => setView('home')} className="mb-6 h-10 rounded-xl border border-white/20 px-4 text-sm font-medium text-slate-100 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">返回仪表盘</button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">创建流程</p>
            <h1 className="mt-2 text-3xl font-bold text-white">新建工作项</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">这里是由“新建”按钮进入的真实内部视图。</p>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="task-name" className="mb-2 block text-sm font-medium text-slate-100">工作项名称</label>
                <input id="task-name" placeholder="例如：优化登录页键盘导航" className="h-11 w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20" />
              </div>
              <div>
                <label htmlFor="task-goal" className="mb-2 block text-sm font-medium text-slate-100">目标说明</label>
                <textarea id="task-goal" placeholder="描述需要生成、修复或验证的 UI 目标" className="min-h-[110px] w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/20" />
              </div>
              <button type="submit" className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40">保存工作项</button>
              {saved && <p className="text-sm text-emerald-300" role="status" aria-live="polite">已保存，可以继续完善详情。</p>}
            </div>
          </form>
        </section>
      </main>
    )
  }

  if (view === 'detail') {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
        <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
          <article className="w-full rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30">
            <button type="button" onClick={() => setView('home')} className="mb-6 h-10 rounded-xl border border-white/20 px-4 text-sm font-medium text-slate-100 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">返回仪表盘</button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">详情视图</p>
            <h1 className="mt-2 text-3xl font-bold text-white">首页信息架构检查</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">这个详情页由“查看详情”按钮触发，说明生成系统已经补齐内部页面流。</p>
          </article>
        </section>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <section className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">交互闭环演示</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">智能 UI 工作台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">兜底模板会补齐新建与详情两条页面流，让按钮真正可用。</p>
          </div>
          <button type="button" onClick={() => setView('new')} className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/40">新建工作项</button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {['生成完成 18 次', '无障碍均分 94', '可交互入口 6 个'].map((metric) => (
            <article key={metric} className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-black/20">
              <p className="text-sm text-slate-400">关键指标</p>
              <p className="mt-2 text-2xl font-bold text-white">{metric}</p>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-black/20" aria-labelledby="work-title">
          <h2 id="work-title" className="text-lg font-bold text-white">最近工作项</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.status} · 进度 {item.progress}</p>
                  </div>
                  <button type="button" onClick={() => setView('detail')} className="h-10 rounded-xl border border-cyan-300/40 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30">查看详情</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}"""

HOSPITAL_3D_FALLBACK_CODE = """import { useState } from 'react'

type DepartmentId = 'emergency' | 'cardiology' | 'radiology' | 'pharmacy'

const departments = [
  { id: 'emergency' as DepartmentId, name: '急诊中心', room: '1F-A102', floor: '一层东侧', distance: '约 120 米', time: '步行 2 分钟', route: '大厅入口 → 服务台右转 → 绿色通道直行 → 急诊中心', accessible: '全程无台阶，可使用轮椅通道。', color: 'bg-emerald-300', path: 'M42 140 C100 120 150 118 206 90 C255 66 302 70 350 42' },
  { id: 'cardiology' as DepartmentId, name: '心内科门诊', room: '3F-C318', floor: '三层 C 区', distance: '约 260 米', time: '电梯 4 分钟', route: '大厅入口 → 中庭电梯 → 3 层出梯左转 → C 区 318', accessible: '建议乘坐 2 号无障碍电梯。', color: 'bg-sky-300', path: 'M42 140 C92 138 130 96 174 92 C224 86 254 118 304 104 C332 96 352 78 370 54' },
  { id: 'radiology' as DepartmentId, name: '影像检查室', room: 'B1-R08', floor: '负一层影像区', distance: '约 210 米', time: '电梯 3 分钟', route: '大厅入口 → 中庭电梯 → B1 出梯右转 → 影像登记处', accessible: 'B1 通道较长，建议开启语音导览。', color: 'bg-indigo-300', path: 'M42 140 C88 162 132 172 178 146 C226 118 244 152 292 132 C330 116 342 84 360 58' },
  { id: 'pharmacy' as DepartmentId, name: '门诊药房', room: '1F-P06', floor: '一层西侧', distance: '约 90 米', time: '步行 1 分钟', route: '大厅入口 → 自助机左侧 → 取药等候区 → 门诊药房', accessible: '药房设有低位叫号屏和无障碍取药窗口。', color: 'bg-amber-300', path: 'M42 140 C96 136 126 152 170 130 C218 106 252 94 296 96 C326 98 344 72 364 48' },
]

const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ')

export default function App() {
  const [selectedId, setSelectedId] = useState<DepartmentId>('emergency')
  const selected = departments.find((item) => item.id === selectedId) ?? departments[0]

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(45,212,191,0.18),transparent_24%),radial-gradient(circle_at_76%_20%,rgba(56,189,248,0.16),transparent_28%)]" />
      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[330px_1fr]">
        <aside className="rounded-[30px] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl" aria-labelledby="dept-title">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">医院大厅导览屏</p>
          <h1 id="dept-title" className="mt-3 text-2xl font-bold text-white">选择科室或房间</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">左侧选择目标位置，右侧 3D 场景和路线会同步高亮。</p>
          <div className="mt-5 space-y-3" role="list" aria-label="科室列表">
            {departments.map((department) => (
              <button key={department.id} type="button" onClick={() => setSelectedId(department.id)} aria-pressed={selectedId === department.id} className={cx('w-full rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30', selectedId === department.id ? 'border-cyan-300 bg-cyan-300/12 shadow-lg shadow-cyan-500/10' : 'border-white/10 bg-slate-950/45 hover:border-white/25 hover:bg-white/10')}>
                <span className="flex items-center justify-between gap-3"><span className="font-semibold text-white">{department.name}</span><span className={cx('h-3 w-3 rounded-full', department.color)} aria-hidden="true" /></span>
                <span className="mt-2 block text-sm text-slate-300">{department.room} · {department.floor}</span>
                <span className="mt-1 block text-xs text-slate-400">{department.time}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="grid min-h-0 gap-5 lg:grid-rows-[1fr_auto]">
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/40">
            <div className="absolute left-5 top-5 z-10 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur">
              <p className="text-xs text-slate-400">当前目标</p>
              <p className="mt-1 text-lg font-bold text-white">{selected.name}</p>
              <p className="text-sm text-cyan-100">{selected.room} · {selected.distance}</p>
            </div>
            <model-viewer className="h-[430px] w-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_58%)]" src="https://modelviewer.dev/shared-assets/models/Astronaut.glb" alt="医院空间三维导览模型，右侧叠加当前科室路线信息" camera-controls="true" auto-rotate="true" shadow-intensity="1" exposure="0.9" environment-image="neutral" interaction-prompt="auto" />
            <div className="absolute bottom-5 right-5 z-10 w-[320px] rounded-3xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur">
              <p className="text-xs font-semibold text-cyan-200">路线示意</p>
              <svg className="mt-3 h-36 w-full rounded-2xl bg-slate-900/70" viewBox="0 0 400 180" role="img" aria-label="从大厅到目标科室的路线示意图">
                <rect x="28" y="124" width="46" height="30" rx="12" className="fill-slate-700" />
                <text x="38" y="144" className="fill-slate-200 text-[12px]">大厅</text>
                <path d={selected.path} className="fill-none stroke-cyan-300" strokeWidth="7" strokeLinecap="round" />
                <path d={selected.path} className="fill-none stroke-white/50" strokeWidth="2" strokeLinecap="round" />
                <circle cx="364" cy="50" r="15" className="fill-cyan-300" />
                <text x="300" y="30" className="fill-slate-100 text-[12px]">{selected.name}</text>
              </svg>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/[0.08] p-5"><p className="text-sm text-slate-400">推荐路线</p><p className="mt-2 text-sm leading-6 text-white">{selected.route}</p></article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.08] p-5"><p className="text-sm text-slate-400">预计时间</p><p className="mt-2 text-2xl font-bold text-white">{selected.time}</p><p className="mt-1 text-sm text-slate-300">距离 {selected.distance}</p></article>
            <article className="rounded-3xl border border-white/10 bg-white/[0.08] p-5"><p className="text-sm text-slate-400">无障碍提示</p><p className="mt-2 text-sm leading-6 text-white">{selected.accessible}</p></article>
          </div>
        </section>
      </section>
    </main>
  )
}"""


MUSEUM_3D_FALLBACK_CODE = """import { useState } from 'react'

type ArtifactId = 'bronze' | 'ceramic' | 'jade'

const artifacts = [
  { id: 'bronze' as ArtifactId, name: '青铜礼器', dynasty: '商周时期', material: '青铜', gallery: '二层 3 号展厅', description: '器身纹样强调礼制秩序，适合通过 3D 旋转观察肩部和足部细节。', accessibility: '提供文字说明与高对比度重点信息，方便低视力用户理解展品结构。', model: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb' },
  { id: 'ceramic' as ArtifactId, name: '白釉瓷瓶', dynasty: '唐宋时期', material: '瓷器', gallery: '一层 1 号展柜', description: '瓶身轮廓修长，右侧信息卡展示年代、材质和展柜位置。', accessibility: '支持键盘切换展品，并用清晰文本补充 3D 模型无法传达的历史信息。', model: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb' },
  { id: 'jade' as ArtifactId, name: '玉雕佩饰', dynasty: '汉代', material: '玉石', gallery: '三层特展区', description: '小型佩饰需要局部放大观察，界面保留展品要点和导览状态。', accessibility: '为模型区域提供 alt 与文字替代说明，避免只依赖视觉旋转。', model: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb' },
]

const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ')

export default function App() {
  const [selectedId, setSelectedId] = useState<ArtifactId>('bronze')
  const selected = artifacts.find((item) => item.id === selectedId) ?? artifacts[0]

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-stone-950 text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(245,158,11,0.14),transparent_26%),radial-gradient(circle_at_84%_28%,rgba(251,191,36,0.10),transparent_24%)]" />
      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[30px] border border-amber-100/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl" aria-labelledby="artifact-title">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">数字文物展柜</p>
          <h1 id="artifact-title" className="mt-3 text-2xl font-bold text-white">选择文物模型</h1>
          <p className="mt-2 text-sm leading-6 text-stone-300">切换左侧展品，右侧 3D 模型与展陈说明同步更新。</p>
          <div className="mt-5 space-y-3" role="list" aria-label="文物列表">
            {artifacts.map((artifact) => (
              <button key={artifact.id} type="button" onClick={() => setSelectedId(artifact.id)} aria-pressed={selectedId === artifact.id} className={cx('w-full rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/30', selectedId === artifact.id ? 'border-amber-200 bg-amber-200/12 shadow-lg shadow-amber-500/10' : 'border-white/10 bg-stone-950/45 hover:border-white/25 hover:bg-white/10')}>
                <span className="block font-semibold text-white">{artifact.name}</span>
                <span className="mt-2 block text-sm text-stone-300">{artifact.dynasty} · {artifact.material}</span>
                <span className="mt-1 block text-xs text-stone-400">{artifact.gallery}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="grid min-h-0 gap-5 lg:grid-cols-[1fr_310px]">
          <div className="relative overflow-hidden rounded-[34px] border border-amber-100/10 bg-stone-900/80 shadow-2xl shadow-black/40">
            <div className="absolute left-5 top-5 z-10 rounded-2xl border border-white/10 bg-stone-950/75 px-4 py-3 backdrop-blur">
              <p className="text-xs text-stone-400">当前展品</p>
              <p className="mt-1 text-lg font-bold text-white">{selected.name}</p>
              <p className="text-sm text-amber-100">{selected.gallery}</p>
            </div>
            <model-viewer className="h-[560px] w-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16),transparent_58%)]" src={selected.model} alt="文物三维模型展示区，可通过鼠标或触摸旋转查看" camera-controls="true" auto-rotate="true" shadow-intensity="1" exposure="0.95" environment-image="neutral" interaction-prompt="auto" />
          </div>
          <aside className="rounded-[30px] border border-amber-100/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/30" aria-label="文物说明">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">展品档案</p>
            <h2 className="mt-3 text-2xl font-bold text-white">{selected.name}</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-stone-400">年代</dt><dd className="mt-1 font-semibold text-white">{selected.dynasty}</dd></div>
              <div><dt className="text-stone-400">材质</dt><dd className="mt-1 font-semibold text-white">{selected.material}</dd></div>
              <div><dt className="text-stone-400">展区</dt><dd className="mt-1 font-semibold text-white">{selected.gallery}</dd></div>
            </dl>
            <p className="mt-6 text-sm leading-6 text-stone-200">{selected.description}</p>
            <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4"><p className="text-sm font-semibold text-amber-100">无障碍说明</p><p className="mt-2 text-sm leading-6 text-stone-100">{selected.accessibility}</p></div>
          </aside>
        </section>
      </section>
    </main>
  )
}"""


def _prompt_has_any(prompt: str, terms: tuple[str, ...]) -> bool:
    normalized = prompt.lower()
    return any(term in normalized for term in terms)


def build_fallback_code(prompt: str, interaction_plan: InteractionPlan | None = None) -> str:
    page_type = interaction_plan.page_type if interaction_plan else ""
    navigation_mode = interaction_plan.navigation_mode if interaction_plan else ""

    if page_type == "wayfinding-3d" or _prompt_has_any(prompt, ("医院", "科室", "导览", "空间位置", "路线", "wayfinding")):
        return HOSPITAL_3D_FALLBACK_CODE

    if page_type == "museum-3d" or _prompt_has_any(prompt, ("博物馆", "文物", "展品", "展陈", "artifact", "museum")):
        return MUSEUM_3D_FALLBACK_CODE

    if page_type == "auth" or _prompt_has_any(prompt, ("登录", "注册", "忘记密码", "login", "register", "email", "password")):
        if navigation_mode == "history-routes":
            return LOGIN_ROUTE_FALLBACK_CODE
        return LOGIN_MODAL_FALLBACK_CODE

    return DASHBOARD_FALLBACK_CODE
