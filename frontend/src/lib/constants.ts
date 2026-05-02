export const API_BASE_URL = '/api'

export const DEFAULT_PREVIEW_CSS = `html,
body,
#root {
  width: 100%;
  min-height: 100vh;
  margin: 0;
}

body {
  overflow-x: hidden;
  background: #fff;
}

* {
  box-sizing: border-box;
}

.min-h-screen { min-height: 100vh; }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.from-blue-50 { --tw-gradient-from: #eff6ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(239 246 255 / 0)); }
.to-indigo-100 { --tw-gradient-to: #e0e7ff; }
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.p-4 { padding: 1rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.h-8 { height: 2rem; }
.h-16 { height: 4rem; }
.w-8 { width: 2rem; }
.w-16 { width: 4rem; }
.max-w-md { max-width: 28rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }
.bg-blue-600 { background-color: #2563eb; }
.bg-white { background-color: #fff; }
.text-center { text-align: center; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-bold { font-weight: 700; }
.text-white { color: #fff; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-900 { color: #111827; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }`

export const DEFAULT_GENERATED_CODE = `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          多模态生成式 UI 助手
        </h1>
        <p className="text-gray-500 mb-6">
          输入自然语言描述或上传手绘草图，AI 帮你快速生成可访问的 React 组件。
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-3 py-1 bg-white rounded-full text-gray-600 shadow-sm">React + Tailwind</span>
          <span className="px-3 py-1 bg-white rounded-full text-gray-600 shadow-sm">WCAG 2.1 AA</span>
          <span className="px-3 py-1 bg-white rounded-full text-gray-600 shadow-sm">AI 驱动</span>
        </div>
      </div>
    </div>
  )
}`

export const DEMO_PROMPTS = [
  '创建一个在线教育仪表盘，点击“新建学习计划”后进入计划创建页，包含计划名称、目标、周期和保存按钮，并支持返回仪表盘',
  '创建一个现代风格的登录页面，包含邮箱和密码输入框、登录按钮以及忘记密码链接，使用卡片式布局居中显示',
  '设计一个在线教育仪表盘，左侧导航栏显示课程分类，右侧显示学习进度环形图、课程卡片列表和今日任务',
  '生成一个电商产品卡片组件，包含产品图片占位区、名称、价格、五星评分、数量选择器和加入购物车按钮',
  '创建一个响应式导航栏，左侧 Logo，中间菜单项（首页、产品、关于），右侧搜索框和用户头像下拉菜单',
  '设计一个数据可视化仪表盘，顶部显示 4 个统计卡片（总用户、活跃用户、收入、转化率），下方是折线图区域',
]
