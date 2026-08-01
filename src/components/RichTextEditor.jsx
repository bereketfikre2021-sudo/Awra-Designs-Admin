import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useRef } from 'react'
import {
  UndoIcon, RedoIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikeIcon,
  CodeIcon, ListBulletIcon, ListOrderedIcon, QuoteIcon, AlignLeftIcon,
  AlignCenterIcon, AlignRightIcon, LinkIcon, ImageIcon, MinusIcon, CloseIcon,
} from './Icons'

const API = import.meta.env.VITE_API_URL || '/api'

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center text-xs transition-colors rounded-sm
        ${active
          ? 'bg-white text-[#0a0a0a]'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
        } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-neutral-800 mx-0.5 self-center" />
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange, placeholder = 'Write your content…', error }) {
  const uploadingRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-400 underline' } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[280px] px-4 py-3',
      },
    },
  })

  // Sync external value changes (e.g. draft restore)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', false)
    }
  }, [value])

  // Image upload via Cloudinary
  const uploadImage = useCallback(async () => {
    if (uploadingRef.current || !editor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      uploadingRef.current = true
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('image', file)
      try {
        const res = await fetch(`${API}/upload/single`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        const data = await res.json()
        if (data.success) editor.chain().focus().setImage({ src: data.data.url }).run()
      } catch {}
      finally { uploadingRef.current = false }
    }
    input.click()
  }, [editor])

  // Add link
  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={`border ${error ? 'border-red-500' : 'border-neutral-800'} bg-[#0a0a0a]`}>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-800 bg-[#111]">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><UndoIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><RedoIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><BoldIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><ItalicIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><StrikeIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><CodeIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><ListBulletIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list"><ListOrderedIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><QuoteIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><CodeIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeftIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenterIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRightIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link"><LinkIcon /></ToolBtn>
        <ToolBtn onClick={uploadImage} title="Insert image"><ImageIcon /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><MinusIcon /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting"><CloseIcon /></ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
