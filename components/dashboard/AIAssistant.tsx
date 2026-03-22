'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTED_PROMPTS = [
    "What's my total revenue this month?",
    "Which products have low stock?",
    "What is my profit margin?",
    "Show me dead stock this month",
    "Which product sold the most?",
    "How is my business doing overall?",
];

interface AIAssistantProps {
    selectedDate: string;
}

export function AIAssistant({ selectedDate }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async (text?: string) => {
        const userMessage = (text || input).trim();
        if (!userMessage || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, selectedDate }),
            });
            const data = await res.json();

            if (data.error) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `⚠️ Error: ${data.error}`
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Failed to connect to AI. Please check your internet connection.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(v => !v)}
                aria-label="AI Assistant"
                className={`
                    fixed bottom-6 right-6 z-50
                    w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center
                    transition-all duration-300
                    ${isOpen
                        ? 'bg-error text-on-error rotate-0 scale-95'
                        : 'bg-primary text-on-primary hover:scale-110 hover:shadow-xl'
                    }
                `}
                style={{ boxShadow: isOpen ? '' : '0 4px 24px rgba(103,80,164,0.35)' }}
            >
                {isOpen
                    ? <X size={24} />
                    : <Sparkles size={24} className="animate-pulse" />
                }
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 flex flex-col rounded-3xl shadow-2xl border border-outline-variant bg-surface overflow-hidden"
                    style={{
                        width: 'min(420px, calc(100vw - 24px))',
                        height: 'min(600px, calc(100vh - 120px))',
                        boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-4 bg-primary text-on-primary flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-on-primary/20 flex items-center justify-center">
                            <Bot size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-roboto font-bold text-[15px] leading-tight">Ahsania AI</span>
                            <span className="text-[11px] text-on-primary/70 font-inter">Powered by Claude · Analyzing live data</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-auto w-8 h-8 rounded-full hover:bg-on-primary/20 flex items-center justify-center transition-colors"
                        >
                            <ChevronDown size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface-container-lowest">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 mt-4">
                                <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
                                    <Sparkles size={24} className="text-on-primary-container" />
                                </div>
                                <div className="text-center">
                                    <p className="font-roboto font-bold text-[15px] text-on-surface">আপনার ব্যবসায়িক সহকারী</p>
                                    <p className="text-[12px] text-on-surface-variant mt-1 font-inter">
                                        আপনার ডেটা দেখে প্রশ্নের উত্তর দিতে পারব
                                    </p>
                                </div>

                                {/* Suggested Prompts */}
                                <div className="flex flex-col gap-2 w-full mt-2">
                                    {SUGGESTED_PROMPTS.map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => sendMessage(prompt)}
                                            className="text-left text-[13px] text-primary font-inter px-4 py-2.5 rounded-xl border border-outline-variant hover:bg-primary-container/40 transition-colors"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot size={14} className="text-on-primary-container" />
                                        </div>
                                    )}
                                    <div
                                        className={`
                                            max-w-[80%] px-4 py-3 rounded-2xl text-[13px] font-inter leading-relaxed whitespace-pre-wrap
                                            ${msg.role === 'user'
                                                ? 'bg-primary text-on-primary rounded-br-md'
                                                : 'bg-surface-container text-on-surface rounded-bl-md border border-outline-variant'
                                            }
                                        `}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex justify-start gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} className="text-on-primary-container" />
                                </div>
                                <div className="bg-surface-container border border-outline-variant px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-[12px] text-on-surface-variant font-inter">Analyzing your data...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="flex-shrink-0 border-t border-outline-variant bg-surface p-3 flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="আপনার ব্যবসার ব্যাপারে জিজ্ঞেস করুন..."
                            rows={1}
                            className="flex-1 resize-none bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] font-inter text-on-surface outline-none border border-transparent focus:border-primary transition-colors placeholder:text-on-surface-variant/60"
                            style={{ maxHeight: '100px', minHeight: '40px' }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
