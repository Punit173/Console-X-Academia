"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppDataContext";
import { MessageSquare, Send, X, User, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    id: string;
    user: string;
    text: string;
    time: string;
    isMe: boolean;
};

export default function LiveChatWidget() {
    const socketRef = useRef<Socket | null>(null);
    const { data } = useAppData();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(1);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem("chat_messages");
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("chat_messages", JSON.stringify(messages.slice(-50))); // Save last 50
        }
    }, [messages]);

    // Initialize Socket & User
    useEffect(() => {
        // Determine Username
        // Logic: Try email first (from attendance or timetable), then reg num, then Guest
        const info = data?.attendance?.student_info;
        const timetableInfo = data?.timetable?.student_info;

        let derivedUser = "Guest";

        // Check for email in both places
        const userEmail = info?.email || timetableInfo?.email;
        const userReg = info?.registration_number || timetableInfo?.registration_number;

        if (userEmail) {
            derivedUser = userEmail.split('@')[0];
        } else if (userReg) {
            derivedUser = userReg;
        }

        // If we have a saved username in localStorage that matches the pattern, valid?
        // User requested "username u can generally extract".
        // We'll stick to data-derived or "Guest" + random if not logged in.

        if (derivedUser !== "Guest") {
            // If we found a real user, overwrite if currently empty or using a temporary Guest ID
            if (!username || username.startsWith("Guest")) {
                setUsername(derivedUser);
            }
        } else if (!username) {
            // Only set random guest if we don't have one yet
            setUsername(`Guest_${Math.floor(Math.random() * 1000)}`);
        }

        // Connect Socket
        const initSocket = async () => {
            if (socketRef.current?.connected) return;

            try {
                // Connect to external FastAPI server
                const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "https://academia-scrapper-api-fast.onrender.com";

                socketRef.current = io(socketUrl, {
                    path: "/socket.io", // Standard Socket.io path
                    transports: ["websocket", "polling"], // Try websocket first
                    addTrailingSlash: false,
                });

                socketRef.current.on("connect", () => {
                    console.log("Connected to chat server");
                    setIsConnected(true);
                });

                socketRef.current.on("user-count", (count: number) => {
                    setOnlineCount(count);
                });

                socketRef.current.on("disconnect", () => {
                    console.log("Disconnected");
                    setIsConnected(false);
                });

                socketRef.current.on("chat-message", (msg: Message) => {
                    setMessages((prev) => {
                        // If we already have this ID (optimistically added), update it or ignore?
                        // If we optimistically added, we have it.
                        // But wait, if we optimistically add, 'isMe' is true.
                        // The echo 'isMe' logic in this callback depends on 'msg.user === username'.
                        // If the echo comes back, it's the same message ID.
                        if (prev.some(m => m.id === msg.id)) return prev;

                        return [...prev, { ...msg, isMe: msg.user === derivedUser || msg.user === username }];
                    });
                });
            } catch (e) {
                console.error("Socket Init Failed", e);
            }
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [data, username]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const msg: Message = {
            id: Date.now().toString(),
            user: username,
            text: input.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        // Optimistic Update: Show immediately to user
        setMessages(prev => [...prev, msg]);

        // Emit to server (which broadcasts to others)
        if (socketRef.current) {
            socketRef.current.emit("chat_message", msg);
        }
        setInput("");
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem("chat_messages");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-[350px] h-[500px] glass-card bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Live Chat</h3>
                                        <p className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                                            {onlineCount} Online
                                        </p>
                                    </div>
                                    <span className="text-xs text-white/40 ml-1">({username})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={clearChat} title="Clear Chat" className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-white/20">
                                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="text-xs">No messages yet. Say hi!</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.user === username ? "items-end" : "items-start"}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm border ${msg.user === username
                                            ? "bg-blue-600/20 border-blue-600/30 text-white rounded-tr-none"
                                            : "bg-white/10 border-white/10 text-gray-200 rounded-tl-none"
                                            }`}>
                                            <p className="break-words">{msg.text}</p>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 px-1">
                                            {msg.user !== username && (
                                                <span className="text-[10px] text-white/30 font-bold truncate max-w-[100px]">{msg.user}</span>
                                            )}
                                            <span className="text-[9px] text-white/20">{msg.time}</span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder:text-white/20"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="pointer-events-auto">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20 ${isOpen ? "bg-red-500 rotate-90" : "bg-blue-600 hover:bg-blue-500"
                        }`}
                >
                    {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
                </button>
            </div>
        </div>
    );
}
