import { TextInput } from './TextInput'
import { ImageUpload } from './ImageUpload'
import { GenerateButton } from './GenerateButton'
import { DemoPrompts } from './DemoPrompts'
import { InteractionPlanCard } from './InteractionPlanCard'

export function InputPanel() {
  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">输入描述</h2>
        <p className="text-xs text-muted-foreground">
          描述你想要的 UI，或上传手绘草图/参考截图。
        </p>
      </div>

      <TextInput />
      <ImageUpload />
      <GenerateButton />
      <InteractionPlanCard />

      <div className="mt-auto pt-4 border-t border-border">
        <DemoPrompts />
      </div>
    </div>
  )
}
