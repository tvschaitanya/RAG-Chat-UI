import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { marked } from 'marked';

export default function ChatApp() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi! I can answer questions about the site. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSourceLabel = (sourceUrl) => {
    try {
      const url = new URL(sourceUrl);
      return url.pathname === '/' ? url.hostname : url.pathname;
    } catch {
      return 'Source';
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.text }),
      });

      if (!res.ok) throw new Error('Backend connection failed');

      const data = await res.json();

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.answer || 'I parsed the request but did not receive a valid answer text.',
        sources: data.sources || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I hit a snag connecting to the backend. Please check your CORS configuration or API Gateway URL and try again.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-6 md:p-8">
      <div className="flex flex-col w-full h-full max-w-md bg-white font-sans sm:shadow-2xl sm:rounded-3xl sm:border sm:border-gray-200 overflow-hidden relative">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <h1 className="text-sm font-semibold text-gray-800 tracking-tight">Site Assistant</h1>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-gray-50">
          {messages.map((msg) => {
            let htmlContent = '';
            try {
              htmlContent = marked.parseInline(msg.text);
            } catch (err) {
              htmlContent = msg.text;
            }

            return (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[82%] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm markdown-body
                    ${msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-md'
                    }
                  `}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[82%] pl-1">
                    {msg.sources.map((source, idx) => (
                      
                        key={idx}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-gray-400 hover:text-blue-500 bg-white hover:bg-blue-50 border border-gray-200 rounded-full px-2.5 py-0.5 truncate max-w-[160px] block transition-colors"
                      >
                        [{idx + 1}] {getSourceLabel(source)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="bg-white border-t border-gray-100 px-4 py-4 pb-safe">
          <form onSubmit={sendMessage} className="flex gap-3 items-center bg-gray-100 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
            <input
              type="text"
              value={input}
              onInput={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-800 placeholder-gray-400 min-w-0"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 text-white rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06l-6.22-6.22V21a.75.75 0 01-1.5 0V4.81l-6.22 6.22a.75.75 0 11-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}