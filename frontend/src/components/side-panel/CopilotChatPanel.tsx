import { CopilotChat } from '@copilotkit/react-ui'

const copilotInstructions = `
你是“多模态生成式 UI 助手”的 CopilotKit 助手。
请始终使用简洁中文回答，帮助用户完成 React + TypeScript + Tailwind 页面生成、界面迭代和无障碍修复。
你可以参考当前应用通过 useCopilotReadable 暴露的 prompt、生成代码预览、图片解析结果和 axe-core 无障碍扫描结果。
不要要求用户重复粘贴当前代码；除非用户主动要求视觉诊断，也不要要求用户再上传界面截图。
注意：你当前不能直接“看见”Sandpack iframe 里的像素级截图，只能读取应用显式暴露的文本状态、代码摘要和无障碍扫描结果。
当用户需要生成页面、修改当前 UI 或修复无障碍问题时，优先说明你会使用页面中注册的 CopilotKit actions：
generateAccessibleReactUI、iterateGeneratedUI、fixAccessibilityIssue。
如果运行环境暂时不能自动调用 action，请明确提示用户也可以切换到“聊天迭代”标签页完成同样操作。
`

const suggestions = [
  {
    title: '生成在线教育仪表盘',
    message: '生成一个在线教育仪表盘，左侧导航，右侧包含学习进度、课程卡片和今日任务，并满足 WCAG AA。',
  },
  {
    title: '迭代当前 UI',
    message: '把当前页面改成更现代的深色管理后台风格，增强键盘焦点状态和按钮对比度。',
  },
  {
    title: '修复无障碍问题',
    message: '根据当前 axe-core 扫描结果，解释最严重的问题，并修复当前生成代码。',
  },
]

export function CopilotChatPanel() {
  return (
    <div className="copilot-chat-panel h-full min-h-0 bg-background">
      <CopilotChat
        className="copilot-chat-window"
        instructions={copilotInstructions}
        suggestions={suggestions}
        labels={{
          title: 'CopilotKit 助手',
          initial: [
            '我是接入 CopilotKit 的应用内助手，可以读取当前生成状态、无障碍扫描结果，并协助调用生成/迭代/修复动作。',
            '我目前不会自动读取预览截图的像素内容；如果要做到“看图自动识别界面”，需要再接入截图采集 + 视觉模型分析链路。',
            '为了保证 Demo 稳定，“聊天迭代”仍保留为可靠执行通道；这里用于展示更标准的 CopilotKit 交互入口。',
          ],
          placeholder: '输入生成、迭代或无障碍修复需求...',
          error: 'CopilotKit 对话暂时不可用，请确认后端 /api/copilotkit 和 Ollama/LLM 服务已启动。',
        }}
      />
    </div>
  )
}
