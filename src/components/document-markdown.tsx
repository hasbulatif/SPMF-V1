'use client'

import React from 'react'

/**
 * Pemisah markdown ringkas untuk paparan dokumen A4.
 * Menyokong: tajuk #, ##, ###, jadual |...|, senarai -, penekanan **bold**, italic *italic*, blockquote, hr ---
 */
export function DocumentMarkdown({ content }: { content: string }) {
  const blocks = parseBlocks(content)
  return (
    <div className="document-content space-y-3 text-[13px] leading-relaxed text-neutral-800">
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  )
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'table' | 'list' | 'quote' | 'hr'
  text?: string
  items?: string[]
  rows?: string[][]
  align?: ('left' | 'center' | 'right')[]
}

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() })
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      i++
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      i++
      continue
    }
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      i++
      continue
    }
    if (line.startsWith('|')) {
      // jadual
      const rows: string[][] = []
      let align: ('left' | 'center' | 'right')[] | undefined
      while (i < lines.length && lines[i].startsWith('|')) {
        const raw = lines[i].trim()
        // baris separator
        if (/^\|[\s:|-]+\|$/.test(raw) && !align) {
          const cells = raw.slice(1, -1).split('|')
          align = cells.map((c) => {
            const t = c.trim()
            if (t.startsWith(':') && t.endsWith(':')) return 'center'
            if (t.endsWith(':')) return 'right'
            return 'left'
          })
          i++
          continue
        }
        // baris data
        const cells = raw
          .slice(1, raw.endsWith('|') ? -1 : undefined)
          .split('|')
          .map((c) => c.trim())
        rows.push(cells)
        i++
      }
      blocks.push({ type: 'table', rows, align: align ?? [] })
      continue
    }
    if (/^[-*]\s/.test(line.trim())) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }
    // paragraf - kumpul baris berturutan
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('|') &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      lines[i].trim() !== '---'
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push({ type: 'p', text: para.join(' ') })
  }
  return blocks
}

function renderBlock(b: Block, key: number): React.ReactNode {
  switch (b.type) {
    case 'h1':
      return (
        <h1 key={key} className="text-center text-2xl font-bold text-neutral-900 mb-2">
          {renderInline(b.text ?? '')}
        </h1>
      )
    case 'h2':
      return (
        <h2 key={key} className="text-lg font-bold text-neutral-900 border-b border-neutral-300 pb-1 mt-3">
          {renderInline(b.text ?? '')}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={key} className="text-base font-semibold text-neutral-900 mt-2">
          {renderInline(b.text ?? '')}
        </h3>
      )
    case 'hr':
      return <hr key={key} className="border-neutral-300 my-3" />
    case 'quote':
      return (
        <blockquote key={key} className="border-l-4 border-neutral-400 pl-3 italic text-neutral-700">
          {renderInline(b.text ?? '')}
        </blockquote>
      )
    case 'p':
      return (
        <p key={key} className="text-justify">
          {renderInline(b.text ?? '')}
        </p>
      )
    case 'list':
      return (
        <ul key={key} className="list-disc pl-5 space-y-1">
          {b.items?.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      )
    case 'table':
      if (!b.rows || b.rows.length === 0) return null
      return (
        <div key={key} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {b.rows[0].map((h, ci) => (
                  <th
                    key={ci}
                    className="border border-neutral-400 bg-neutral-100 px-2 py-1 text-left font-semibold"
                    style={{ textAlign: b.align?.[ci] ?? 'left' }}
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-neutral-300 px-2 py-1"
                      style={{ textAlign: b.align?.[ci] ?? 'left' }}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

function renderInline(text: string): React.ReactNode {
  // bold **...**, italic *...*, inline code `...`
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  while (remaining.length > 0) {
    const bold = remaining.match(/\*\*([^*]+)\*\*/)
    const italic = remaining.match(/\*([^*]+)\*/)
    const code = remaining.match(/`([^`]+)`/)
    const matches = [
      bold ? { type: 'b', m: bold, idx: bold.index ?? 0 } : null,
      italic ? { type: 'i', m: italic, idx: italic.index ?? 0 } : null,
      code ? { type: 'c', m: code, idx: code.index ?? 0 } : null,
    ].filter(Boolean) as { type: string; m: RegExpMatchArray; idx: number }[]
    if (matches.length === 0) {
      parts.push(remaining)
      break
    }
    matches.sort((a, b) => a.idx - b.idx)
    const first = matches[0]
    if (first.idx > 0) parts.push(remaining.slice(0, first.idx))
    if (first.type === 'b') parts.push(<strong key={key++}>{first.m[1]}</strong>)
    else if (first.type === 'i') parts.push(<em key={key++}>{first.m[1]}</em>)
    else if (first.type === 'c')
      parts.push(<code key={key++} className="rounded bg-neutral-100 px-1 py-0.5 text-[11px]">{first.m[1]}</code>)
    remaining = remaining.slice(first.idx + first.m[0].length)
  }
  return <>{parts}</>
}
