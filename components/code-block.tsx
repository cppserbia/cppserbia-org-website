"use client"

import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
    children: string
    className?: string
    inline?: boolean
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
    // Extract language from className (format: "language-cpp")
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''

    // If it's inline code or no language specified, render as inline
    if (inline || !language) {
        let cleanedChildren = children.trim()
        return (
            <code className="bg-gray-900 text-purple-300 px-1 py-0.5 rounded text-sm font-mono">
                {cleanedChildren}
            </code>
        )
    }

    // For block code with language, use syntax highlighter
    return (
        <div className="my-4 not-prose">
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    border: '1px solid rgb(55, 65, 81)', // border-gray-700
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    backgroundColor: '#1e1e1e', // Match VS Code Dark Plus theme background
                }}
                codeTagProps={{
                    style: {
                        fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", "Fira Code", "Consolas", monospace',
                        backgroundColor: 'transparent', // Make code background transparent to match container
                    }
                }}
            >
                {children}
            </SyntaxHighlighter>
        </div>
    )
}
