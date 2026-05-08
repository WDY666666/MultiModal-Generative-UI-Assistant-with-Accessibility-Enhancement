import { Bot, Code2, RotateCcw, Sparkles } from 'lucide-react'
import { CopilotChat } from '@copilotkit/react-ui'

import { CopilotCodeAutoApply } from '@/components/copilot/CopilotCodeAutoApply'
import { useAppStore } from '@/stores/useAppStore'

const COPILOT_INSTRUCTIONS = `你是本项目的 Copilot 工作区助手。请始终围绕“当前 generatedCodePreview”做修改，不要无故重新生成完全不同的页面。

规则：
1. 优先在现有页面上做最小必要修改。
2. 只有用户明确要求重做、重构或切换为完全不同页面时，才重建结构。
3. 若用户要求跳转/创建详情页，请在单文件预览里用真实可交互的 view 或 History API 实现。
4. 所有用户可见文案默认使用简体中文。
5. 生成结果尽量保持可预览、可直接应用、可访问。
6. 若当前代码存在上一版，可优先做增量修复而不是推翻重写。
7. 如果当前页面是登录、注册、忘记密码、仪表盘、列表、详情、新建、购物车、结算等常见产品场景，请补齐合理的内部视图切换或状态流。
8. 回复里如果包含代码，必须输出完整 React + TypeScript + Tailwind 单文件组件，并保留 export default。`

function buildCopilotSystemMessage(
  contextString: string,
  generatedCode: string,
  previousGeneratedCode: string | null,
  interactionPlan:
    | {
        summary: string
        pageType: string
        navigationMode: string
        implementationStrategy: string
        primaryViews: string[]
        popupViews: string[]
        routes: string[]
      }
    | null
) {
  return [
    COPILOT_INSTRUCTIONS,
    '',
    'CopilotKit 共享上下文：',
    contextString || '暂无额外上下文。',
    '',
    '当前中间预览区完整代码如下。你必须基于这份代码修改，而不是凭空重新生成：',
    '```tsx',
    generatedCode,
    '```',
    '',
    interactionPlan
      ? [
          '当前结构化交互计划：',
          `- 总结：${interactionPlan.summary}`,
          `- 页面类型：${interactionPlan.pageType}`,
          `- 导航模式：${interactionPlan.navigationMode}`,
          `- 实现策略：${interactionPlan.implementationStrategy}`,
          `- 主视图：${interactionPlan.primaryViews.join('、') || '暂无'}`,
          `- 弹窗视图：${interactionPlan.popupViews.join('、') || '暂无'}`,
          `- 路由：${interactionPlan.routes.join('、') || '暂无'}`,
          '',
        ].join('\n')
      : '当前还没有结构化交互计划。',
    '',
    previousGeneratedCode ? '当前存在上一版预览代码，用户要求恢复时请优先调用恢复能力。' : '当前没有上一版预览代码。',
  ].join('\n')
}

export function CopilotChatPanel() {
  const generatedCode = useAppStore((state) => state.generatedCode)
  const previousGeneratedCode = useAppStore((state) => state.previousGeneratedCode)
  const interactionPlan = useAppStore((state) => state.interactionPlan)
  const a11yResults = useAppStore((state) => state.a11yResults)
  const addChatMessages = useAppStore((state) => state.addChatMessages)
  const setIsChatLoading = useAppStore((state) => state.setIsChatLoading)

  return (
    <div className="copilot-chat-panel flex h-full min-h-0 flex-col bg-background">
      <CopilotCodeAutoApply />

      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Copilot 工作区助手</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                自动应用已开启
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              这里会围绕当前预览代码做迭代。你可以直接说“把主按钮改成蓝色”“增加淡入动画”“恢复上一版”。
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            当前代码 {generatedCode.length.toLocaleString()} 字符
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            无障碍评分 {a11yResults?.score ?? '未扫描'}
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            {previousGeneratedCode ? '支持恢复上一版' : '尚无上一版'}
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            当前预览已和 Copilot 共享状态
          </div>
        </div>
      </div>

      <div className="copilot-chat-window min-h-0 flex-1 p-2">
        <CopilotChat
          className="h-full"
          instructions={COPILOT_INSTRUCTIONS}
          makeSystemMessage={(contextString) =>
            buildCopilotSystemMessage(contextString, generatedCode, previousGeneratedCode, interactionPlan)
          }
          onInProgress={setIsChatLoading}
          onSubmitMessage={async (message) => {
            const normalized = message.trim()
            if (!normalized) {
              return
            }
            addChatMessages([{ role: 'user', content: normalized }])
          }}
          labels={{
            title: 'Copilot 助手',
            initial: '直接输入你的修改要求，例如：把主按钮改成蓝色，或者恢复上一版。',
            placeholder: '输入迭代指令（基于当前预览代码）...',
            stopGenerating: '停止生成',
            regenerateResponse: '重新生成',
            copyToClipboard: '复制内容',
            thumbsUp: '有帮助',
            thumbsDown: '没帮助',
            copied: '已复制',
            error: '请求失败，请稍后重试。',
          }}
        />
      </div>
    </div>
  )
}
