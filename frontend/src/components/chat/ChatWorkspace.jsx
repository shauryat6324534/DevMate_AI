import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import { 
  Send, Copy, Check, Terminal, Play, Cpu, FileText, CheckCircle, Sparkles, BookOpen, AlertCircle, Menu
} from 'lucide-react';
import { ChatHistorySkeleton } from '../ui/Skeleton';

// Simple markdown/codeblock regex segmenter
const parseMessageContent = (text) => {
  if (!text) return [];
  const parts = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'javascript',
      content: match[2]
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts;
};

const renderMarkdown = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let inList = false;

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-6 space-y-1.5 my-3 text-sm text-gray-300 light:text-gray-600">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const parseInlineElements = (lineText) => {
    const parts = [];
    const inlineRegex = /(\*\*|`)(.*?)\1/g;
    let lastIdx = 0;
    let match;

    while ((match = inlineRegex.exec(lineText)) !== null) {
      if (match.index > lastIdx) {
        parts.push(lineText.substring(lastIdx, match.index));
      }
      const type = match[1];
      const content = match[2];
      if (type === '`') {
        parts.push(
          <code key={`code-${match.index}`} className="px-1.5 py-0.5 rounded bg-gray-950/40 text-brand-primary font-mono text-[13px] border border-gray-800/40 light:bg-gray-100 light:text-indigo-600 light:border-gray-200">
            {content}
          </code>
        );
      } else if (type === '**') {
        parts.push(
          <strong key={`strong-${match.index}`} className="font-bold text-gray-100 light:text-gray-900">
            {content}
          </strong>
        );
      }
      lastIdx = inlineRegex.lastIndex;
    }

    if (lastIdx < lineText.length) {
      parts.push(lineText.substring(lastIdx));
    }

    return parts.length > 0 ? parts : [lineText];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      flushList(i);
      const headingText = trimmed.substring(2);
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold tracking-tight text-white light:text-gray-900 mt-6 mb-3 border-b border-gray-800/40 pb-2 light:border-gray-200 leading-tight">
          {parseInlineElements(headingText)}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(i);
      const headingText = trimmed.substring(3);
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold tracking-tight text-white light:text-gray-900 mt-5 mb-2.5 leading-snug">
          {parseInlineElements(headingText)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(i);
      const headingText = trimmed.substring(4);
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold tracking-tight text-white light:text-gray-900 mt-4 mb-2">
          {parseInlineElements(headingText)}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      flushList(i);
      const headingText = trimmed.substring(5);
      elements.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-gray-200 light:text-gray-800 mt-3 mb-1.5">
          {parseInlineElements(headingText)}
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const bulletText = trimmed.substring(2);
      listItems.push(
        <li key={`li-${i}-${listItems.length}`} className="leading-relaxed">
          {parseInlineElements(bulletText)}
        </li>
      );
    } else if (trimmed.startsWith('> ')) {
      flushList(i);
      const quoteText = trimmed.substring(2);
      elements.push(
        <blockquote key={`quote-${i}`} className="pl-4 border-l-4 border-indigo-500/50 italic text-gray-400 light:text-gray-500 my-4 py-1 bg-gray-900/10 rounded-r-lg light:bg-gray-100/50">
          {parseInlineElements(quoteText)}
        </blockquote>
      );
    } else if (trimmed === '---' || trimmed === '***') {
      flushList(i);
      elements.push(
        <hr key={`hr-${i}`} className="border-t border-gray-800/40 my-6 light:border-gray-200" />
      );
    } else if (trimmed === '') {
      flushList(i);
    } else {
      flushList(i);
      elements.push(
        <p key={`p-${i}`} className="text-sm text-gray-300 light:text-gray-600 leading-relaxed mb-3">
          {parseInlineElements(line)}
        </p>
      );
    }
  }

  flushList('final');
  return elements;
};

export const ChatWorkspace = ({ 
  messages, 
  loading, 
  error, 
  prompt, 
  onPromptChange, 
  onSend, 
  onSelectCode,
  onOpenSidebar,
  selectedCodeText
}) => {
  const bottomRef = useRef(null);
  const [copiedId, setCopiedId] = React.useState(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [messages, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f19] relative overflow-hidden">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Toggle drawer button for small layouts */}
        <div className="md:hidden flex items-center justify-between border-b border-gray-800/60 pb-3 mb-4">
          <button 
            onClick={onOpenSidebar}
            className="p-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl flex items-center space-x-1.5"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase">Open Chats</span>
          </button>
        </div>

        {messages.length === 0 && !loading ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-3xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              DevMate AI Programming Workspace
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-lg mx-auto mb-8">
              Generate code, explain concepts, optimize queries, and run comprehensive reviews. Get started by entering a concept or query below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {[
                { label: 'What is Recursion?', desc: 'Generates progressive explanations & challenges.' },
                { label: 'Generate a Python binary search function', desc: 'Returns formatted code, ready to analyze.' },
                { label: 'Explain Javascript array functions', desc: 'Breaks down map, filter, and reduce operations.' },
                { label: 'Review optimization structures', desc: 'Learn best algorithmic performance habits.' }
              ].map((shortcut, idx) => (
                <button
                  key={idx}
                  onClick={() => onPromptChange(shortcut.label)}
                  className="p-4 bg-gray-900/60 hover:bg-gray-950 border border-gray-800/60 hover:border-indigo-500/30 rounded-2xl text-xs transition-all text-left group"
                >
                  <span className="font-bold text-gray-200 block mb-1 group-hover:text-indigo-400">{shortcut.label}</span>
                  <span className="text-gray-500">{shortcut.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div 
                key={msg.id || idx}
                className={`flex space-x-4 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    AI
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                    : 'bg-gray-900/80 border border-gray-800/80 text-gray-200 rounded-bl-none'
                }`}>
                  {/* Sender title */}
                  <span className="block text-[10px] font-semibold uppercase tracking-wider font-mono text-gray-500 mb-1.5">
                    {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                  </span>

                  {/* Parse and Segment Content */}
                  <div className="space-y-4 leading-relaxed break-words whitespace-pre-wrap">
                    {parseMessageContent(msg.content).map((part, pIdx) => {
                      if (part.type === 'code') {
                        const blockId = `${idx}-${pIdx}`;
                        const isCopied = copiedId === blockId;
                        const isSelected = selectedCodeText === part.content;

                        return (
                          <div key={blockId} className="relative group border border-gray-800 rounded-xl overflow-hidden mt-3 mb-3 bg-[#0d1117] font-mono text-xs">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-950/60 border-b border-gray-800/80 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                              <span>{part.language}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onSelectCode(part.content)}
                                  className={`px-2 py-1 border rounded text-[9px] transition-all ${
                                    isSelected 
                                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-bold' 
                                      : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                                  }`}
                                  title="Analyze inside Results Panel"
                                >
                                  {isSelected ? 'Active Analysis' : 'Analyze Snippet'}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(part.content, blockId)}
                                  className="p-1 hover:text-white rounded"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            <pre className="p-4 overflow-x-auto"><code className={`language-${part.language}`}>{part.content}</code></pre>
                          </div>
                        );
                      }
                      return <div key={pIdx} className="space-y-1">{renderMarkdown(part.content)}</div>;
                    })}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                    U
                  </div>
                )}
              </div>
            ))}

            {loading && <ChatHistorySkeleton />}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>
        )}
      </div>

      {/* Query prompt submission bottom editor bar */}
      <div className="p-4 border-t border-gray-800/60 bg-[#090d16]/40 backdrop-blur-md">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }} 
          className="max-w-3xl mx-auto flex items-end space-x-3"
        >
          <div className="flex-1 bg-gray-900 border border-gray-800 focus-within:border-indigo-500/60 rounded-2xl px-4 py-3 flex items-end transition-all relative">
            <textarea
              rows="1"
              placeholder="Ask a coding question or generate a script..."
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-600 outline-none resize-none max-h-40 overflow-y-auto leading-relaxed py-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading || prompt.trim() === ''}
            className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.97] transition-all disabled:opacity-30 disabled:scale-100 disabled:shadow-none shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWorkspace;
