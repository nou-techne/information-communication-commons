# Message Formatting

**Sprint 65** — Markdown rendering in messages

## Status

**Deferred to post-ETHBoulder.** Message Formatting is the first sprint of Cycle 8 Ebb (Communication Quality), adding markdown support to the messaging layer. Part of long-term Discord replacement vision. Not critical for Feb 13-16 event since contributions use plain text extraction.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours
- **Dependency:** Requires Sprint 63 (Real-Time Messages UI) to be implemented first
- **Current flow works:** Contribution form handles plain text well; AI extraction doesn't need markdown
- **Post-event value:** Markdown becomes valuable for technical discussions, code sharing, structured notes in ongoing conversations

## Context: Markdown as Communication Enhancement

Markdown transforms plain text into rich content without leaving the keyboard. Discord, Slack, and GitHub all support markdown because it's the natural language of developers and knowledge workers. Code blocks, lists, emphasis, links — all typed inline without clicking formatting buttons.

Sprint 65 brings markdown rendering to commons.id messages, making technical conversations readable and knowledge capture richer.

## Design

### Supported Markdown

**Basic formatting:**
- `**bold**` → **bold**
- `*italic*` → *italic*
- `~~strikethrough~~` → ~~strikethrough~~
- `` `inline code` `` → `inline code`

**Links:**
- `[text](url)` → hyperlink
- `https://example.com` → auto-linked URL

**Lists:**
```markdown
- Item 1
- Item 2
  - Nested item
```

**Code blocks:**
````markdown
```javascript
function hello() {
  console.log('world')
}
```
````

**Quotes:**
```markdown
> This is a quote
> Multi-line quote
```

**Headings (in messages, downgraded):**
```markdown
# Heading → Bold text (h1-h3 converted to bold to prevent visual hierarchy breaks)
```

### Implementation: marked.js

```tsx
// lib/markdown.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked for message context
marked.setOptions({
  breaks: true,      // GFM line breaks (single \n = <br>)
  gfm: true,         // GitHub Flavored Markdown
  headerIds: false,  // Disable header IDs (not needed in messages)
  mangle: false      // Don't mangle email addresses
})

// Custom renderer: downgrade headings to bold
const renderer = new marked.Renderer()
renderer.heading = (text: string) => {
  return `<strong>${text}</strong>`
}

marked.use({ renderer })

export function renderMarkdown(input: string): string {
  // 1. Parse markdown to HTML
  const html = marked.parse(input) as string
  
  // 2. Sanitize to prevent XSS
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'del', 'code', 'pre',
      'a', 'ul', 'ol', 'li', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'class'],
    ALLOW_DATA_ATTR: false
  })
  
  return clean
}
```

### Message Component with Markdown

```tsx
// components/MessageContent.tsx
import { renderMarkdown } from '../lib/markdown'
import { useMemo } from 'react'

interface Props {
  content: string
  mentions?: string[]
}

export function MessageContent({ content, mentions = [] }: Props) {
  // Render markdown once
  const html = useMemo(() => renderMarkdown(content), [content])
  
  // Highlight @mentions (pre-process before markdown)
  const processedContent = useMemo(() => {
    let processed = content
    mentions.forEach(username => {
      const regex = new RegExp(`@${username}\\b`, 'g')
      processed = processed.replace(regex, `<span class="mention">@${username}</span>`)
    })
    return processed
  }, [content, mentions])
  
  return (
    <div 
      className="message-content prose prose-invert prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(processedContent) }}
    />
  )
}
```

### Tailwind Prose Styling

```css
/* globals.css - Override @tailwindcss/typography for message context */
.message-content.prose {
  color: rgb(209, 213, 219); /* gray-300 */
}

.message-content.prose p {
  margin: 0.25rem 0;
}

.message-content.prose a {
  color: #c3fd50;
  text-decoration: none;
}

.message-content.prose a:hover {
  text-decoration: underline;
}

.message-content.prose code {
  background: #1a1a1a;
  color: #c3fd50;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.message-content.prose pre {
  background: #0f0f0f;
  border: 1px solid #262626;
  border-radius: 0.5rem;
  padding: 0.75rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-content.prose pre code {
  background: transparent;
  padding: 0;
  color: rgb(209, 213, 219);
}

.message-content.prose blockquote {
  border-left: 3px solid #c3fd50;
  padding-left: 1rem;
  color: rgb(156, 163, 175); /* gray-400 */
  font-style: normal;
  margin: 0.5rem 0;
}

.message-content.prose ul, 
.message-content.prose ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-content.prose li {
  margin: 0.25rem 0;
}

.message-content.prose strong {
  color: white;
  font-weight: 600;
}

.message-content.prose em {
  font-style: italic;
}

.message-content.prose del {
  text-decoration: line-through;
  opacity: 0.7;
}

.message-content.prose .mention {
  color: #c3fd50;
  background: #c3fd50/10;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  font-weight: 500;
}
```

### Syntax Highlighting (Code Blocks)

```tsx
// lib/markdown.ts (enhanced)
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-solidity'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/themes/prism-tomorrow.css'

// Custom code block renderer with syntax highlighting
const renderer = new marked.Renderer()

renderer.code = (code: string, language: string | undefined) => {
  if (language && Prism.languages[language]) {
    const highlighted = Prism.highlight(code, Prism.languages[language], language)
    return `<pre class="language-${language}"><code>${highlighted}</code></pre>`
  }
  return `<pre><code>${code}</code></pre>`
}

marked.use({ renderer })
```

### Markdown Input Helper

```tsx
// components/MarkdownInput.tsx
import { useState, useRef } from 'react'
import { Bold, Italic, Code, Link, List } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function MarkdownInput({ value, onChange, onSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  function insertMarkdown(before: string, after: string = '') {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }
  
  return (
    <div className="space-y-2">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] border border-[#262626] rounded-t-lg">
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="p-1.5 hover:bg-[#262626] rounded"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="p-1.5 hover:bg-[#262626] rounded"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="p-1.5 hover:bg-[#262626] rounded"
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertMarkdown('[', '](url)')}
          className="p-1.5 hover:bg-[#262626] rounded"
          title="Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertMarkdown('- ', '')}
          className="p-1.5 hover:bg-[#262626] rounded"
          title="List"
        >
          <List className="w-4 h-4" />
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2 py-1 text-xs rounded ${
            showPreview ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'hover:bg-[#262626]'
          }`}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      
      {/* Input or preview */}
      {showPreview ? (
        <div className="min-h-[100px] p-3 bg-[#1a1a1a] border border-[#262626] border-t-0 rounded-b-lg">
          <MessageContent content={value} />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit()
            }
            // Keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              if (e.key === 'b') {
                e.preventDefault()
                insertMarkdown('**', '**')
              }
              if (e.key === 'i') {
                e.preventDefault()
                insertMarkdown('*', '*')
              }
            }
          }}
          className="w-full min-h-[100px] p-3 bg-[#1a1a1a] border border-[#262626] border-t-0 rounded-b-lg resize-none focus:outline-none focus:border-[#c3fd50]"
          placeholder="Type your message... (markdown supported)"
        />
      )}
      
      <p className="text-xs text-gray-500">
        Supports **bold**, *italic*, `code`, [links](url), lists, and code blocks
      </p>
    </div>
  )
}
```

### Link Preview Cards (Future Enhancement)

```tsx
// Automatically fetch and display previews for URLs
async function fetchLinkPreview(url: string) {
  const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
  return res.json()
}

function LinkPreview({ url, title, description, image }: LinkPreviewData) {
  return (
    <a href={url} target="_blank" className="block mt-2 border border-[#262626] rounded-lg overflow-hidden hover:border-[#c3fd50]/50">
      {image && <img src={image} className="w-full h-32 object-cover" />}
      <div className="p-3">
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{description}</p>}
        <p className="text-xs text-gray-600 mt-1">{new URL(url).hostname}</p>
      </div>
    </a>
  )
}
```

## Security: XSS Prevention

**Critical:** Markdown rendering opens XSS vectors. DOMPurify sanitization is mandatory.

```tsx
// Test cases for XSS prevention
describe('Markdown Security', () => {
  it('prevents script injection', () => {
    const input = '<script>alert("xss")</script>'
    const output = renderMarkdown(input)
    expect(output).not.toContain('<script>')
  })
  
  it('prevents onclick handlers', () => {
    const input = '[click me](javascript:alert("xss"))'
    const output = renderMarkdown(input)
    expect(output).not.toContain('javascript:')
  })
  
  it('prevents image onerror', () => {
    const input = '![](x onerror=alert("xss"))'
    const output = renderMarkdown(input)
    expect(output).not.toContain('onerror')
  })
})
```

## Acceptance Criteria (Deferred)

- [x] Message formatting design documented
- [ ] Markdown renders correctly in message view (bold, italic, code, links, lists, quotes, code blocks)
- [ ] Syntax highlighting for code blocks (JS, TS, Python, Solidity, JSON)
- [ ] XSS prevention via DOMPurify (all tests pass)
- [ ] Formatting toolbar with quick-insert buttons
- [ ] Preview toggle (edit ↔ preview)
- [ ] Keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic)
- [ ] @mentions highlighted in markdown content
- [ ] Links auto-linked (plain URLs become clickable)
- [ ] Responsive on mobile (toolbar collapses gracefully)

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprint 63 (Real-Time Messages UI)

## Priority

**Medium (deferred).** Markdown is quality-of-life for technical discussions. Priority increases when:
- Messaging layer is live (Sprint 63)
- Technical conversations happening regularly
- Code sharing becomes common
- User feedback requests formatting capabilities

## Notes

Markdown in messages is a standard feature in modern collaboration tools. The key decisions:

1. **Limited tag set** — Only safe, message-appropriate tags. No `<iframe>`, `<object>`, `<embed>`, etc.
2. **Downgrade headings** — H1-H6 → bold text. Prevents visual hierarchy breaks in message threads.
3. **GFM breaks** — Single newline = `<br>` (GitHub Flavored Markdown). Matches user expectations.
4. **Syntax highlighting** — Essential for technical communities. Prism.js covers common languages.
5. **Mention preservation** — Process @mentions before markdown to prevent `@user` being interpreted as email.

The toolbar shortcuts (Ctrl+B, etc.) match standard text editors. The preview toggle lets users verify rendering before sending.

Next sprint: Sprint 66 (Thread Status Indicators) adds visual lifecycle management to threads.