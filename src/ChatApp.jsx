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
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 sticky top-0 z-10 flex items-center justify-center">
          <h1 className="text-sm font-semibold text-gray-800">Site Assistant</h1>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                  className={`max-w-[85%] p-3 text-[15px] leading-relaxed shadow-sm markdown-body
                    ${msg.sender === 'user' 
                      ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm'
                    }
                  `}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 max-w-[85%] pl-1">
                    {msg.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-gray-500 hover:text-blue-500 bg-white hover:bg-blue-50 border border-gray-200 rounded px-1.5 py-0.5 truncate max-w-[150px] block transition-colors"
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
              <div className="bg-gray-200 rounded-2xl rounded-tl-sm p-3 flex space-x-1 items-center h-[42px]">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="bg-white border-t border-gray-100 p-3 safe-area-pb">
          <form onSubmit={sendMessage} className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onInput={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-10 py-2 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-[15px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:bg-gray-200 transition-colors shadow-sm cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06l-6.22-6.22V21a.75.75 0 01-1.5 0V4.81l-6.22 6.22a.75.75 0 11-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}