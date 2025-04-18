"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function ChatBubble() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => setIsOpen((prev) => !prev);

    return (
        <>
            {/* Chat Bubble Button */}
            <div
                className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
                    isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
            >
                <button
                    onClick={toggleChat}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
                >
                    <MessageCircle size={24} />
                </button>
            </div>

            {/* Chat Window */}
            <div
                className={`fixed bottom-4 right-4 w-80 bg-card rounded-lg shadow-xl overflow-hidden transition-all duration-300 z-50 border border-border ${
                    isOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-12 pointer-events-none"
                }`}
            >
                <div className="flex items-center justify-between bg-primary p-3">
                    <h3 className="font-medium text-primary-foreground">Chat Support</h3>
                    <button
                        onClick={toggleChat}
                        className="text-primary-foreground/80 hover:text-primary-foreground"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 h-64 flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground text-center">Coming Soon</p>
                </div>
            </div>
        </>
    );
}
