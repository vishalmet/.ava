"use client"

import { useMemo } from "react"

interface SyntaxHighlighterProps {
  code: string
  language: "ava" | "sol" | "cairo" | "rs"
  className?: string
}

const tokenPatterns = {
  ava: {
    keywords: /\b(function|require|emit|return|if|else|for|while|let|const|var|address|u64|u32|u8|bool|string|mapping|struct|enum|public|private|internal|external|view|pure|payable|modifier|event|constructor|fallback|receive)\b/g,
    strings: /(["'])((?:\\.|(?!\1)[^\\\r\n])*?)\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b\d+\.?\d*\b/g,
    functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
  },
  sol: {
    keywords: /\b(pragma|solidity|contract|function|require|emit|return|if|else|for|while|mapping|struct|enum|public|private|internal|external|view|pure|payable|modifier|event|constructor|fallback|receive|uint256|uint64|uint32|uint8|address|bool|string|bytes|memory|storage|calldata)\b/g,
    strings: /(["'])((?:\\.|(?!\1)[^\\\r\n])*?)\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b\d+\.?\d*\b/g,
    functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
  },
  cairo: {
    keywords: /\b(%lang|starknet|from|import|func|let|const|if|else|return|felt|HashBuiltin|storage_var|external|view|event|syscall_ptr|pedersen_ptr|range_check_ptr|with_attr|error_message|assert_le|emit)\b/g,
    strings: /(["'])((?:\\.|(?!\1)[^\\\r\n])*?)\1/g,
    comments: /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b\d+\.?\d*\b/g,
    functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\{)/g,
  },
  rs: {
    keywords: /\b(fn|let|mut|const|if|else|match|for|while|loop|break|continue|return|struct|enum|impl|trait|pub|mod|use|crate|self|super|where|as|dyn|move|ref|static|unsafe|extern|type|Self|Result|Option|Vec|HashMap|String|str|u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|f32|f64|bool|char)\b/g,
    strings: /(["'])((?:\\.|(?!\1)[^\\\r\n])*?)\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b\d+\.?\d*\b/g,
    functions: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
  },
}

export default function SyntaxHighlighter({ code, language, className = "" }: SyntaxHighlighterProps) {
  const highlightedCode = useMemo(() => {
    const patterns = tokenPatterns[language]
    if (!patterns) return escapeHtml(code)

    const tokens: Array<{ type: string; match: string; index: number; length: number }> = []

    // Collect all tokens with their positions
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = [...code.matchAll(pattern)]
      matches.forEach(match => {
        if (match.index !== undefined) {
          tokens.push({
            type,
            match: match[0],
            index: match.index,
            length: match[0].length
          })
        }
      })
    })

    // Remove overlapping tokens (keep the first one found)
    const filteredTokens = tokens
      .sort((a, b) => a.index - b.index)
      .filter((token, index, arr) => {
        for (let i = 0; i < index; i++) {
          const prevToken = arr[i]
          if (token.index < prevToken.index + prevToken.length) {
            return false // This token overlaps with a previous one
          }
        }
        return true
      })

    // Build the highlighted string
    let result = ''
    let lastIndex = 0

    filteredTokens.forEach(token => {
      // Add text before the token
      result += escapeHtml(code.substring(lastIndex, token.index))
      
      // Add the highlighted token
      result += `<span class="syntax-${token.type}">${escapeHtml(token.match)}</span>`
      
      lastIndex = token.index + token.length
    })

    // Add remaining text
    result += escapeHtml(code.substring(lastIndex))

    return result
  }, [code, language])

  return (
    <pre 
      className={`font-mono text-sm whitespace-pre-wrap ${className}`}
      style={{ 
        backgroundColor: 'transparent',
        color: '#d4d4d4',
        padding: '1rem',
        borderRadius: '0.5rem',
        overflow: 'visible',
        lineHeight: '1.5',
        margin: 0,
        minHeight: '100%',
        width: 'max-content',
        minWidth: '100%'
      }}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}