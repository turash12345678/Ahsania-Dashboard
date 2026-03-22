'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown, History, Plus, Trash2, Paperclip, FileText, FileSpreadsheet, Image as ImageIcon, XCircle, Play, Check } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
    role: 'user' | 'assistant';
    content: string;
    fileInfo?: { name: string; type: string };
    imageData?: { base64: string; mimeType: string };
    toolCalls?: any[];
    isHidden?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    messages: Message[];
}

interface AttachedFile {
    name: string;
    type: 'image' | 'text';
    content?: string;
    base64?: string;
    mimeType?: string;
    displayType: string;
}

interface AIAssistantProps {
    selectedDate: string;
}

const STORAGE_KEY = 'ahsania_chat_history';
const MAX_SESSIONS = 30;

const SUGGESTED_PROMPTS = [
    "এই মাসে আমার মোট revenue কত?",
    "দোকানে নতুন প্রোডাক্ট অ্যাড করো",
    "আজকের নতুন কোনো সেল এন্ট্রি করো",
    "আমার profit margin কত?",
];

function getFileIcon(displayType: string) {
    if (displayType === 'Image') return <ImageIcon size={14} />;
    if (displayType === 'Excel') return <FileSpreadsheet size={14} />;
    return <FileText size={14} />;
}

function newSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Component ───────────────────────────────────────────────────────────────
export function AIAssistant({ selectedDate }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string>('');

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
    const [fileLoading, setFileLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Clipboard paste ──────────────────────────
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) break;
                setFileLoading(true);
                try {
                    const form = new FormData();
                    form.append('file', file, 'pasted-image.png');
                    const res = await fetch('/api/ai/file', { method: 'POST', body: form });
                    const data = await res.json();
                    if (!data.error) {
                        setAttachedFile({
                            name: 'Pasted Image',
                            type: 'image',
                            base64: data.base64,
                            mimeType: data.mimeType,
                            displayType: 'Image'
                        });
                    } else { alert('Image error: ' + data.error); }
                } catch { alert('Failed to process pasted image.'); }
                finally { setFileLoading(false); }
                break;
            }
        }
    };

    // ── Load sessions ─────────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const loaded: ChatSession[] = JSON.parse(raw);
                setSessions(loaded);
                if (loaded.length > 0) setActiveSessionId(loaded[0].id);
                else startNewSession(loaded);
            } else {
                startNewSession([]);
            }
        } catch {
            startNewSession([]);
        }
    }, []);

    const saveSessions = useCallback((updated: ChatSession[]) => {
        setSessions(updated);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_SESSIONS))); } catch {}
    }, []);

    const startNewSession = useCallback((existing?: ChatSession[]) => {
        const newSession: ChatSession = {
            id: newSessionId(),
            title: 'New Chat',
            createdAt: new Date().toISOString(),
            messages: []
        };
        const base = existing ?? sessions;
        const updated = [newSession, ...base];
        saveSessions(updated);
        setActiveSessionId(newSession.id);
        setShowHistory(false);
    }, [sessions, saveSessions]);

    const activeSession = sessions.find(s => s.id === activeSessionId);
    const messages = activeSession?.messages ?? [];

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && !showHistory) inputRef.current?.focus();
    }, [isOpen, showHistory]);

    const updateSessionMessages = useCallback((sessionId: string, newMessages: Message[]) => {
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id !== sessionId) return s;
                let title = s.title;
                if (s.messages.length === 0) {
                    title = newMessages.find(m => m.role === 'user' && !m.isHidden)?.content.slice(0, 40) || 'New Chat';
                }
                return { ...s, messages: newMessages, title };
            });
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_SESSIONS))); } catch {}
            return updated;
        });
    }, []);

    const deleteSession = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== id);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
            if (id === activeSessionId) {
                setActiveSessionId(updated[0]?.id ?? '');
                if (updated.length === 0) startNewSession([]);
            }
            return updated;
        });
    }, [activeSessionId, startNewSession]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const isImage = file.type.startsWith('image/');
        const isPDF = ext === 'pdf';
        const isExcel = ['xlsx', 'xls', 'csv'].includes(ext);
        const isWord = ['docx', 'doc'].includes(ext);

        if (!isImage && !isPDF && !isExcel && !isWord) {
            alert('Supported: Image, PDF, Excel (.xlsx/.csv), Word (.docx)');
            return;
        }

        setFileLoading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/ai/file', { method: 'POST', body: form });
            const data = await res.json();
            if (data.error) { alert('File error: ' + data.error); return; }
            setAttachedFile({
                name: file.name,
                type: data.type,
                content: data.content,
                base64: data.base64,
                mimeType: data.mimeType,
                displayType: isImage ? 'Image' : isPDF ? 'PDF' : isExcel ? 'Excel' : 'Word'
            });
        } catch {
            alert('Failed to process file.');
        } finally {
            setFileLoading(false);
        }
    };

    // ── Send message ─────────────────────────────────────────────
    const sendMessage = async (text?: string, targetSessionId?: string, isSystemHide: boolean = false) => {
        const userText = (text || input).trim();
        if ((!userText && !attachedFile) || loading) return;

        const sessionId = targetSessionId || activeSessionId;
        const currentSession = sessions.find(s => s.id === sessionId);
        const currentMessages = currentSession?.messages || [];

        if (!isSystemHide) setInput('');
        let fileSnapshot = null;
        if (!isSystemHide) {
            fileSnapshot = attachedFile;
            setAttachedFile(null);
        }

        const userMsg: Message = {
            role: 'user',
            content: userText || `[Attached: ${fileSnapshot?.name}]`,
            isHidden: isSystemHide,
            ...(fileSnapshot ? { fileInfo: { name: fileSnapshot.name, type: fileSnapshot.displayType } } : {}),
            ...(fileSnapshot?.type === 'image' ? { imageData: { base64: fileSnapshot.base64!, mimeType: fileSnapshot.mimeType! } } : {})
        };

        const updatedMessages = [...currentMessages, userMsg];
        updateSessionMessages(sessionId, updatedMessages);
        setLoading(true);

        try {
            let messagePayload = userText;
            if (fileSnapshot?.type === 'image') messagePayload = `${userText}\n\n[User attached an image: ${fileSnapshot.name}]`;
            else if (fileSnapshot?.type === 'text') messagePayload = `${userText}\n\n${fileSnapshot.content}`;

            const apiMessages = fileSnapshot?.type === 'image'
                ? [{
                    role: 'user' as const,
                    content: [
                        { type: 'text', text: userText || 'What is in this image?' },
                        { type: 'image_url', image_url: { url: `data:${fileSnapshot.mimeType};base64,${fileSnapshot.base64}` } }
                    ]
                }] : undefined;

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messagePayload, selectedDate, apiMessages }),
            });
            const data = await res.json();

            const assistantMsg: Message = {
                role: 'assistant',
                content: data.error ? `⚠️ ${data.error}` : data.reply,
                toolCalls: data.tool_calls // Inject tool calls
            };
            updateSessionMessages(sessionId, [...updatedMessages, assistantMsg]);
        } catch {
            updateSessionMessages(sessionId, [...updatedMessages, { role: 'assistant', content: '⚠️ Connection failed. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    // ── Handle Action (Tool Call) Confirm ──────────────────────────────────────
    const handleActionConfirm = async (call: any, sessionId: string) => {
        setLoading(true);
        try {
            const args = JSON.parse(call.function.arguments);
            let resultMsg = '';

            if (call.function.name === 'add_product') {
                const res = await fetch('/api/inventory/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: args.product_name,
                        buy_price: args.buy_price,
                        sell_price: args.sell_price,
                        stock_quantity: args.stock
                    })
                });
                const data = await res.json();
                resultMsg = data.success ? 'Success: Product added!' : `Error: ${data.error} - ${data.details?.join(', ')}`;
            } 
            else if (call.function.name === 'sell_product') {
                const prodRes = await fetch('/api/inventory/products');
                const products = await prodRes.json();
                const matchedList = products.filter((p: any) => p.name.toLowerCase().includes(args.product_name.toLowerCase()));
                if (matchedList.length === 0) {
                    resultMsg = `Error: Product '${args.product_name}' not found.`;
                } else if (matchedList[0].stock_quantity < args.quantity) {
                    resultMsg = `Error: Insufficient stock. Only ${matchedList[0].stock_quantity} available for ${matchedList[0].name}.`;
                } else {
                    const finalPrice = args.unit_price || matchedList[0].sell_price;
                    const sellRes = await fetch('/api/sales', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: [{ type: 'product', id: matchedList[0].id, quantity: args.quantity, price: finalPrice }],
                            payment_method: 'Cash',
                            total_amount: args.quantity * finalPrice,
                            user_id: 1
                        })
                    });
                    const sellData = await sellRes.json();
                    resultMsg = sellData.success ? `Success: ${args.quantity}x ${matchedList[0].name} sold!` : `Error: ${sellData.error}`;
                }
            }

            // Remove/disable the tool call from UI so it can't be clicked again
            setSessions(prev => {
                const updated = prev.map(s => {
                    if (s.id !== sessionId) return s;
                    const newMsgs = s.messages.map(m => m.toolCalls?.some(tc => tc.id === call.id) 
                        ? { ...m, toolCalls: m.toolCalls.filter(tc => tc.id !== call.id) } 
                        : m);
                    return { ...s, messages: newMsgs };
                });
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_SESSIONS))); } catch {}
                return updated;
            });

            // Send background message to AI with result
            sendMessage(`[System Note: The tool '${call.function.name}' was executed by the user. Result: \n${resultMsg}\nPlease summarize this to the user in Bengali.]`, sessionId, true);

        } catch (err: any) {
            alert('Failed to execute action: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActionCancel = (call: any, sessionId: string) => {
        setSessions(prev => {
            const updated = prev.map(s => {
                if (s.id !== sessionId) return s;
                const newMsgs = s.messages.map(m => m.toolCalls?.some(tc => tc.id === call.id) 
                    ? { ...m, toolCalls: m.toolCalls.filter(tc => tc.id !== call.id) } 
                    : m);
                return { ...s, messages: newMsgs };
            });
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_SESSIONS))); } catch {}
            return updated;
        });
        sendMessage(`[System Note: User cancelled the tool execution for '${call.function.name}'. Please acknowledge gracefully.]`, sessionId, true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / 1000;
        if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(v => !v)}
                aria-label="AI Assistant"
                className={`
                    fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center transition-all duration-300
                    ${isOpen ? 'bg-error text-on-error scale-95' : 'bg-primary text-on-primary hover:scale-110'}
                `}
                style={isOpen ? {} : { boxShadow: '0 4px 24px rgba(103,80,164,0.38)' }}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
            </button>

            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 flex flex-col rounded-3xl shadow-2xl border border-outline-variant bg-surface overflow-hidden"
                    style={{ width: 'min(420px, calc(100vw - 24px))', height: 'min(620px, calc(100vh - 120px))', boxShadow: '0 8px 48px rgba(0,0,0,0.18)' }}
                >
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-primary text-on-primary flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-roboto font-bold text-[14px] leading-tight">Ahsania AI Agent</span>
                            <span className="text-[11px] text-on-primary/70 font-inter truncate">Gemini 2.5 Flash · Live data & Agent Mode</span>
                        </div>
                        <button onClick={() => setShowHistory(v => !v)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showHistory ? 'bg-on-primary/30' : 'hover:bg-on-primary/20'}`}>
                            <History size={17} />
                        </button>
                        <button onClick={() => startNewSession()} className="w-8 h-8 rounded-full hover:bg-on-primary/20 flex items-center justify-center transition-colors">
                            <Plus size={17} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-on-primary/20 flex items-center justify-center transition-colors">
                            <ChevronDown size={17} />
                        </button>
                    </div>

                    {showHistory ? (
                        <div className="flex-1 overflow-y-auto bg-surface-container-lowest">
                            <div className="p-3 border-b border-outline-variant">
                                <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Recent Conversations</span>
                            </div>
                            {sessions.length === 0 ? (
                                <p className="text-center text-on-surface-variant text-[13px] py-8">No history yet</p>
                            ) : (
                                <ul className="flex flex-col">
                                    {sessions.map(s => (
                                        <li
                                            key={s.id}
                                            onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-outline-variant/50 hover:bg-primary-container/30 transition-colors ${s.id === activeSessionId ? 'bg-primary-container/40' : ''}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                                                <Bot size={15} className="text-on-surface-variant" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-on-surface truncate">{s.title}</p>
                                                <p className="text-[11px] text-on-surface-variant">{formatDate(s.createdAt)} · {s.messages.filter(m=>!m.isHidden).length} msgs</p>
                                            </div>
                                            <button onClick={(e) => deleteSession(s.id, e)} className="w-7 h-7 rounded-full hover:bg-error-container hover:text-on-error-container flex items-center justify-center transition-colors text-on-surface-variant flex-shrink-0">
                                                <Trash2 size={13} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface-container-lowest">
                                {messages.filter(m => !m.isHidden).length === 0 ? (
                                    <div className="flex flex-col items-center gap-4 mt-2">
                                        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                                            <Sparkles size={22} className="text-on-primary-container" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-roboto font-bold text-[14px] text-on-surface">আপনার ব্যবসায়িক সহকারী (Agent)</p>
                                            <p className="text-[12px] text-on-surface-variant mt-0.5 font-inter">রিপোর্ট দেখুন বা প্রোডাক্ট বিক্রি করতে বলুন</p>
                                        </div>
                                        <div className="flex flex-col gap-1.5 w-full">
                                            {SUGGESTED_PROMPTS.map(prompt => (
                                                <button key={prompt} onClick={() => sendMessage(prompt)} className="text-left text-[12px] text-primary font-inter px-3 py-2 rounded-xl border border-outline-variant hover:bg-primary-container/40 transition-colors">
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        if (msg.isHidden) return null;
                                        return (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 mt-1">
                                                        <Bot size={13} className="text-on-primary-container" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-1 max-w-[85%] mt-1">
                                                    {msg.fileInfo && (
                                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium w-fit ${msg.role === 'user' ? 'bg-on-primary/20 text-on-primary self-end' : 'bg-surface-container text-on-surface-variant'}`}>
                                                            {getFileIcon(msg.fileInfo.type)}
                                                            <span>{msg.fileInfo.name}</span>
                                                            <span className="opacity-60">({msg.fileInfo.type})</span>
                                                        </div>
                                                    )}
                                                    {msg.imageData && (
                                                        <img src={`data:${msg.imageData.mimeType};base64,${msg.imageData.base64}`} alt="attached" className="rounded-xl max-h-40 object-contain self-end border border-outline-variant" />
                                                    )}
                                                    {msg.content && (
                                                        <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] font-inter leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md border border-gray-200 shadow-sm'}`}>
                                                            {msg.content}
                                                        </div>
                                                    )}

                                                    {/* Render Tool Calls as Interactive Cards */}
                                                    {msg.toolCalls && msg.toolCalls.map((call) => {
                                                        let args;
                                                        try { args = JSON.parse(call.function.arguments); } catch { args = {}; }
                                                        const isSale = call.function.name === 'sell_product';
                                                        return (
                                                            <div key={call.id} className="mt-2 bg-white rounded-xl border border-primary/20 overflow-hidden shadow-sm flex flex-col min-w-[240px]">
                                                                <div className="bg-primary-container/30 px-3 py-2 border-b border-primary/10 flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                                                                        <Play size={10} className="ml-0.5" />
                                                                    </div>
                                                                    <span className="text-[12px] font-bold text-primary">
                                                                        {isSale ? 'Record Sale Proposal' : 'Add Product Proposal'}
                                                                    </span>
                                                                </div>
                                                                <div className="p-3 flex flex-col gap-1.5 text-[12px] text-on-surface bg-white">
                                                                    {isSale ? (
                                                                        <>
                                                                            <p><strong>Item:</strong> {args.product_name}</p>
                                                                            <p><strong>Qty:</strong> {args.quantity}x @ ৳{args.unit_price}</p>
                                                                            <p><strong>Total:</strong> <span className="text-primary font-bold">৳{(args.quantity * args.unit_price).toLocaleString()}</span></p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <p><strong>Name:</strong> {args.product_name}</p>
                                                                            <p><strong>Buy:</strong> ৳{args.buy_price} <strong>Sell:</strong> ৳{args.sell_price}</p>
                                                                            <p><strong>Stock:</strong> {args.stock} units</p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="px-3 pb-3 flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleActionConfirm(call, activeSessionId)}
                                                                        className="flex-1 bg-primary text-white text-[12px] font-semibold py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleActionCancel(call, activeSessionId)}
                                                                        className="flex-1 bg-surface-container text-on-surface text-[12px] font-medium py-1.5 rounded-lg hover:bg-outline-variant transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {loading && (
                                    <div className="flex justify-start gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                                            <Bot size={13} className="text-on-primary-container" />
                                        </div>
                                        <div className="bg-white border border-gray-200 shadow-sm px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                                            <div className="flex gap-1">
                                                {[0, 150, 300].map(d => (
                                                    <span key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                                ))}
                                            </div>
                                            <span className="text-[11px] text-gray-500 font-inter">Working...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="flex-shrink-0 border-t border-outline-variant bg-surface p-3 flex flex-col gap-2">
                                {attachedFile && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-container/40 rounded-xl border border-primary/20 text-[12px] text-primary font-medium">
                                        {getFileIcon(attachedFile.displayType)}
                                        <span className="truncate flex-1">{attachedFile.name}</span>
                                        <span className="text-primary/60">({attachedFile.displayType})</span>
                                        <button onClick={() => setAttachedFile(null)}><XCircle size={14} className="text-primary/70 hover:text-error transition-colors" /></button>
                                    </div>
                                )}
                                {fileLoading && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-xl text-[12px] text-on-surface-variant">
                                        <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                                        <span>Processing file...</span>
                                    </div>
                                )}
                                <div className="flex items-end gap-2">
                                    <button onClick={() => fileInputRef.current?.click()} disabled={fileLoading} className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0 hover:bg-primary-container/40 transition-colors disabled:opacity-40 text-on-surface-variant">
                                        <Paperclip size={16} />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.xlsx,.xls,.csv,.docx,.doc" onChange={handleFileSelect} className="hidden" />
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onPaste={handlePaste}
                                        placeholder="কমান্ড দিন (ex: ৫টা নোকিয়া ১১০০ বিক্রি করো...)"
                                        rows={1}
                                        className="flex-1 resize-none bg-surface-container-high rounded-xl px-3.5 py-2.5 text-[13px] font-inter text-on-surface outline-none border border-transparent focus:border-primary transition-colors placeholder:text-on-surface-variant/60"
                                        style={{ maxHeight: '90px', minHeight: '38px' }}
                                    />
                                    <button onClick={() => sendMessage(undefined, undefined, false)} disabled={(!input.trim() && !attachedFile) || loading} className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity">
                                        <Send size={15} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
