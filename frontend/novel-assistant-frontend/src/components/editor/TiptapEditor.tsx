import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

// TODO: Integrate AI SDK logic here. 
// For now, we keep the basic Tiptap structure but prepare for AI integration.
// e.g., custom extensions for AI commands, floating menu for AI actions.

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
}

const TiptapEditor = ({ content, onChange, editable = true }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '在此处开始正文写作... (输入 "/" 唤起 AI 助手)',
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none mx-auto focus:outline-none min-h-[500px] px-4 py-8'
        }
    }
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
        if (editor.isEmpty && content) {
            editor.commands.setContent(content)
        }
    }
  }, [content, editor])

  return (
    <div className="w-full h-full flex flex-col">
        {/* Horizontal Rule Guide */}
        <div className="w-full border-b border-gray-100 mb-4 flex items-center justify-center relative">
            <span className="bg-white px-2 text-xs text-gray-300 font-mono absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                START WRITING
            </span>
        </div>
        <EditorContent editor={editor} className="w-full h-full" />
    </div>
  )
}

export default TiptapEditor
