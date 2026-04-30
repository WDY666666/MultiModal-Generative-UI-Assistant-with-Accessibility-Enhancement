export const API_BASE_URL = '/api'

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
          多模态生成式UI助手
        </h1>
        <p className="text-gray-500 mb-6">
          输入自然语言描述或上传手绘草图，AI 帮你快速生成可访问的 React 组件
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
  '创建一个现代风格的登录页面，包含邮箱和密码输入框，登录按钮，以及忘记密码链接，使用卡片式布局居中显示',
  '设计一个在线教育仪表盘，左侧导航栏显示课程分类，右侧显示学习进度环形图、课程卡片列表和今日任务',
  '生成一个电商产品卡片组件，包含产品图片占位区、名称、价格、五星评分、数量选择器和加入购物车按钮',
  '创建一个响应式导航栏，左侧Logo，中间菜单项（首页、产品、关于），右侧搜索框和用户头像下拉菜单',
  '设计一个数据可视化仪表盘，顶部显示4个统计卡片（总用户、活跃用户、收入、转化率），下方是折线图区域',
]
