import { Bot, Code2, Sparkles } from 'lucide-react'
import { CopilotChat } from '@copilotkit/react-ui'
import { useAppStore } from '@/stores/useAppStore'
import { CopilotCodeAutoApply } from '@/components/copilot/CopilotCodeAutoApply'

const copilotSuggestions = [
  {
    title: 'Polish current page',
    message:
      'Iterate the current preview code only. Improve spacing, typography, and button hierarchy while keeping the current layout.',
  },
  {
    title: 'Improve accessibility',
    message:
      'Based on current code, improve keyboard focus visibility, aria labels, and color contrast without redesigning the page.',
  },
  {
    title: 'Add interactive flow',
    message:
      'Add an in-file multi-view interaction flow using useState (for example dashboard -> create plan -> detail) with Back actions.',
  },
]

const COPILOT_INSTRUCTIONS = `You are the workspace copilot for this app.
When user asks to generate or modify UI, prioritize the existing generatedCodePreview context.
Do not drift into unrelated pages unless the user explicitly requests a redesign.
For UI changes, return complete previewable App.tsx code in a fenced tsx block.
Ensure accessibility and keep React + TypeScript + Tailwind only.`

export function CopilotChatPanel() {
  const generatedCode = useAppStore((state) => state.generatedCode)
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
              <h2 className="text-sm font-semibold text-foreground">CopilotKit Workspace Assistant</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Auto-apply enabled
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This panel is powered by CopilotKit runtime. If the assistant returns previewable TSX, it is automatically
              applied to the live preview.
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            Current code {generatedCode.length.toLocaleString()} chars
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            a11y score {a11yResults?.score ?? 'not scanned'}
          </div>
        </div>
      </div>

      <div className="copilot-chat-window min-h-0 flex-1 p-2">
        <CopilotChat
          className="h-full"
          instructions={COPILOT_INSTRUCTIONS}
          suggestions={copilotSuggestions}
          onInProgress={setIsChatLoading}
          onSubmitMessage={async (message) => {
            const normalized = message.trim()
            if (!normalized) {
              return
            }
            addChatMessages([{ role: 'user', content: normalized }])
          }}
          labels={{
            title: 'Workspace Copilot',
            initial:
              'Ask for targeted edits to the current preview code. Example: "Only update current UI, make CTA button blue, and add focus-visible states."',
            placeholder: 'Iterate current preview code...',
            stopGenerating: 'Stop',
            regenerateResponse: 'Regenerate',
          }}
        />
      </div>
    </div>
  )
}
