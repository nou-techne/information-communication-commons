import React, { useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInline(text: string): string {
  let result = escapeHtml(text)
  // inline code
  result = result.replace(/`([^`]+)`/g, '<code class="bg-[#111] px-1.5 py-0.5 rounded text-xs font-mono text-gray-200">$1</code>')
  // bold
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  // italic
  result = result.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
  // links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#c3fd50] hover:underline">$1</a>')
  // bare URLs
  result = result.replace(/(^|[\s>])((https?:\/\/)[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#c3fd50] hover:underline">$2</a>')
  return result
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const rendered = useMemo(() => {
    const blocks: { type: 'code' | 'text'; content: string; lang?: string }[] = []
    const parts = content.split(/```(\w*)\n?([\s\S]*?)```/)
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) blocks.push({ type: 'text', content: parts[i] })
      } else if (i % 3 === 1) {
        // lang marker, next is content
      } else {
        blocks.push({ type: 'code', content: parts[i], lang: parts[i - 1] || undefined })
      }
    }
    return blocks
  }, [content])

  return (
    <div className="text-sm text-gray-300 space-y-2">
      {rendered.map((block, i) => {
        if (block.type === 'code') {
          return (
            <pre key={i} className="bg-[#111] rounded-lg p-3 overflow-x-auto text-xs font-mono text-gray-200 border border-[#262626]">
              <code>{block.content}</code>
            </pre>
          )
        }
        // Process text block into lines for lists and paragraphs
        const lines = block.content.split('\n')
        const elements: React.ReactElement[] = []
        let listItems: string[] = []
        
        const flushList = () => {
          if (listItems.length > 0) {
            elements.push(
              <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-0.5 pl-2">
                {listItems.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
                ))}
              </ul>
            )
            listItems = []
          }
        }

        for (const line of lines) {
          const listMatch = line.match(/^[\s]*[-*]\s+(.+)/)
          if (listMatch) {
            listItems.push(listMatch[1])
          } else {
            flushList()
            const trimmed = line.trim()
            if (trimmed) {
              elements.push(
                <p key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />
              )
            }
          }
        }
        flushList()

        return <div key={i}>{elements}</div>
      })}
    </div>
  )
}
