"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
};

export default function AIWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Store the current input before clearing
    const currentInput = inputValue;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Get the access token from localStorage
      const token = localStorage.getItem("access");

      // Call the backend AI endpoint
      const response = await fetch("http://localhost:8000/api/ai/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get AI response");
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to get AI response"
        }. Please ensure your AI API key is configured.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
        <p className="text-blue-100 text-sm">Ask me anything about your data</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Start a conversation with the AI assistant
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-300 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="break-words">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none break-words">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-1 mb-1" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="ml-2" {...props} />,
                          code: ({node, inline, ...props}) =>
                            inline ? (
                              <code className="bg-gray-200 px-1 rounded text-xs" {...props} />
                            ) : (
                              <code className="block bg-gray-200 p-2 rounded text-xs overflow-x-auto mb-2" {...props} />
                            ),
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-400 pl-2 italic mb-2" {...props} />,
                          table: ({node, ...props}) => <table className="border-collapse border border-gray-400 mb-2 text-xs" {...props} />,
                          th: ({node, ...props}) => <th className="border border-gray-400 px-2 py-1 bg-gray-200" {...props} />,
                          td: ({node, ...props}) => <td className="border border-gray-400 px-2 py-1" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                  <span className="inline-flex space-x-1">
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
