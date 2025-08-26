import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { motion } from "framer-motion";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

type CodeProps = { inline?: boolean; className?: string; children?: ReactNode };

function CodeBlock({ inline, className, children }: CodeProps) {
    const [copied, setCopied] = useState(false);
    if (inline) {
        return <code className={`bg-gray-100 rounded px-1 ${className || ""}`}>{children}</code>;
    }
    const language = (className || "").replace("language-", "");
    let text = "";
    if (typeof children === "string") {
        text = children;
    } else if (Array.isArray(children)) {
        text = children
            .map((child) => (typeof child === "string" ? child : ""))
            .join("");
    } else {
        text = "";
    }
    text = text.replace(/\n$/, "");
    return (
        <div className="relative group">
            <pre className={`${className || ""} overflow-x-auto rounded-lg p-3`}><code>{text}</code></pre>
            <Button
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl px-2 py-1 text-xs"
                onClick={() => {
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                }}
            >
                {copied ? "Copied" : "Copy"}
            </Button>
            {language && (
                <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/70 rounded px-1">
                    {language}
                </span>
            )}
        </div>
    );
}

function renderAIContent(content: string) {
    const normalized = normalizeAIContent(content);
    return (
        <div className="prose prose-sm max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    code: (props: CodeProps) => (
                        <CodeBlock inline={props.inline} className={props.className}>
                            {props.children}
                        </CodeBlock>
                    ),
                    a: ({ href, children }) => (
                        <a href={href as string} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {children}
                        </a>
                    ),
                }}
            >
                {normalized}
            </ReactMarkdown>
        </div>
    );
}

function normalizeAIContent(content: string): string {
    // Remove common paste artifacts like "Copy" buttons or hljs badges
    const cleanedLines = content
        .split("\n")
        .filter((line) => {
            const trimmed = line.trim();
            if (trimmed === "Copy") return false;
            if (/^Copyhljs\b/i.test(trimmed)) return false;
            return true;
        })
        .map((line) => line.replace(/\s+Copyhljs\b.*$/i, ""));

    // Group consecutive code-like lines and wrap them in fences
    const isCodeLine = (line: string): boolean => {
        const t = line.trim();
        if (t.length === 0) return false;
        return /(;|\{|\}|#include|std::|^\s{2,}|^\s*\/\/|^\s*#|^\s*(g\+\+|\.\/|npm |yarn |pnpm ))/.test(line);
    };

    const detectLang = (block: string[]): string | undefined => {
        const text = block.join("\n");
        if (/#include|std::|int\s+main\s*\(/.test(text)) return "cpp";
        if (/^\s*(g\+\+|\.\/|bash\b)/m.test(text)) return "bash";
        if (/^\s*import\s+|^\s*export\s+|=>/.test(text)) return "ts";
        if (/^\s*def\s+|^\s*class\s+|:\s*$/.test(text)) return "python";
        return undefined;
    };

    const out: string[] = [];
    let i = 0;
    while (i < cleanedLines.length) {
        if (isCodeLine(cleanedLines[i])) {
            const start = i;
            while (i < cleanedLines.length && isCodeLine(cleanedLines[i])) i++;
            const block = cleanedLines.slice(start, i);
            const lang = detectLang(block);
            out.push("```" + (lang || ""));
            out.push(...block);
            out.push("```");
        } else {
            out.push(cleanedLines[i]);
            i++;
        }
    }

    // If nothing got fenced and content looks codey overall, fence whole thing
    const result = out.join("\n");
    if (!/```/.test(result)) {
        const hintCount = (result.match(/(;|\{|\}|#include|std::)/g) || []).length;
        const lines = result.split("\n").length;
        if (lines > 2 && hintCount >= 2) {
            const lang = detectLang(cleanedLines);
            return "```" + (lang || "") + "\n" + result.trim() + "\n```";
        }
    }
    return result;
}

type Message = {
    role: "user" | "ai";
    content: string;
};

export default function ChatApp() {
    const [currentChat, setCurrentChat] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement | null>(null);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMessage: Message = { role: "user", content: input };
        const updatedChat: Message[] = [...currentChat, newMessage];
        setCurrentChat(updatedChat);
        setInput("");
        setLoading(true);

        try {
            // Prepare Gemini API request
            const response = await fetch(
                `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: input,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );// chmod +x Cursor-1.5.5-x86_64.AppImage

            const data = await response.json();
            // Extract AI reply from Gemini response
            const aiReply =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't generate a response.";
            const aiMessage: Message = { role: "ai", content: aiReply };
            setCurrentChat((prev: Message[]) => [...prev, aiMessage]);
        } catch (err) {
            console.error("Error fetching AI response", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setCurrentChat([]);
        setInput("");
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [currentChat, loading]);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-r from-indigo-50 via-fuchsia-50 to-pink-50">
            {/* Header with New Chat Button */}
            <div className="p-4 bg-white/80 backdrop-blur border-b relative flex items-center justify-center">
                <Button
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-2xl shadow-md bg-gradient-to-r from-indigo-600 to-pink-600 text-white hover:from-indigo-700 hover:to-pink-700"
                    onClick={handleNewChat}
                >
                    + New Chat
                </Button>
                <span className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">
                    AIWrap
                </span>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-2 overflow-y-auto">
                    {currentChat.length === 0 ? (
                        <p className="text-gray-400 text-center mt-10 text-lg font-light">
                            Start a new conversation...
                        </p>
                    ) : (
                        currentChat.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "ai" && (
                                    <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-xs font-semibold text-gray-600">
                                        AI
                                    </div>
                                )}
                                <Card
                                    className={`mb-3 shadow-md rounded-2xl max-w-[70%] ${
                                        msg.role === "user" ? "bg-gradient-to-r from-orange-200 to-amber-200" : "bg-white"
                                    }`}
                                >
                                    <CardContent className="px-4 py-1.5">
                                        {msg.role === "ai" ? (
                                            renderAIContent(msg.content)
                                        ) : (
                                            <p className="text-sm leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                                                {msg.content}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-orange-400 text-white shadow flex items-center justify-center text-xs font-semibold">
                                        You
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                    {loading && (
                        <p className="text-gray-400 text-sm animate-pulse">
                            AI is thinking...
                        </p>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Input Box */}
                <div className="p-4 bg-white border-t flex items-center shadow-inner">
                    <input
                        className="flex-1 border rounded-2xl px-4 py-3 mr-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <Button
                        className="rounded-2xl px-6 py-2 shadow-md bg-gradient-to-r from-indigo-600 to-pink-600 text-white hover:from-indigo-700 hover:to-pink-700"
                        onClick={handleSend}
                        disabled={loading}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}
