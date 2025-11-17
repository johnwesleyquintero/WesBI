import * as React from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useAppContext } from '../state/appContext';
import { summarizeDataForPrompt } from '../services/geminiService';
import { PaperAirplaneIcon, XIcon, ChatbotIcon } from './Icons';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

// Typing indicator component
const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1 p-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

// Message component
const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const parsedHtml = React.useMemo(() => {
        if (message.role === 'model' && window.marked) {
            // Sanitize to prevent XSS, though marked does some of this by default.
            return window.marked.parse(message.content, { breaks: true, gfm: true });
        }
        return null;
    }, [message.content, message.role]);

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-sm lg:max-w-md p-3 rounded-lg shadow-sm ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {parsedHtml ? (
                    <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: parsedHtml }} />
                ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                )}
            </div>
        </div>
    );
};


const Chatbot: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { apiKey, activeSnapshotKey, snapshots } = state;

    const [chat, setChat] = React.useState<Chat | null>(null);
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    React.useEffect(() => {
        if (!apiKey || !activeSnapshotKey || !snapshots[activeSnapshotKey]) {
            setChat(null);
            setMessages([{ role: 'model', content: "Hello! To get started, please ensure you have an API key set in settings and an FBA snapshot loaded." }]);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const dataSummary = summarizeDataForPrompt(snapshots[activeSnapshotKey].data);
            const systemInstruction = `You are WesBI, an expert FBA (Fulfillment by Amazon) operations analyst. Your personality is helpful, concise, and professional. You are assisting a user who is analyzing their FBA inventory data. Use the provided data summary to answer their questions. Keep your answers formatted in Markdown for readability. Focus on the data and provide actionable advice where possible. The user is looking at a snapshot named "${snapshots[activeSnapshotKey].name}".
            
            Current Data Summary:
            ${dataSummary}`;
            
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction }
            });

            setChat(newChat);
            setMessages([{ role: 'model', content: `Hello! I'm WesBI, your FBA operations analyst. I'm ready to answer questions about your '${snapshots[activeSnapshotKey].name}' snapshot.` }]);
        } catch (error) {
            console.error("Failed to initialize Gemini Chat:", error);
            setMessages([{ role: 'model', content: "There was an error initializing the AI chat. Please check your API key and refresh." }]);
        }

    }, [apiKey, activeSnapshotKey, snapshots]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: userMessage.content });

            let currentResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of result) {
                currentResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = currentResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Gemini chat error:", error);
            const errorMessage = "Sorry, I encountered an error. It might be due to an invalid API key, network issues, or a problem with the AI service. Please try again later.";
            setMessages(prev => {
                const newMessages = [...prev];
                // If the last message is an empty model message, update it. Otherwise, add a new one.
                if(newMessages[newMessages.length - 1].role === 'model' && newMessages[newMessages.length - 1].content === ''){
                     newMessages[newMessages.length - 1].content = errorMessage;
                     return newMessages;
                }
                return [...newMessages, { role: 'model', content: errorMessage }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-8 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 transform transition-all duration-300 ease-in-out origin-bottom-right animate-slide-in">
             <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
                .prose { max-width: none; color: inherit; }
                .prose a { color: #4F46E5; }
                .prose strong { color: #1F2937; }
                .prose code { background-color: #E5E7EB; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; }
                .prose pre { background-color: #F3F4F6; padding: 1em; border-radius: 0.5em; }
                .prose ul, .prose ol { padding-left: 1.5em; }
                .prose p { margin-top: 0; margin-bottom: 1em; }
                .prose p:last-child { margin-bottom: 0; }
            `}</style>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-br from-[#9c4dff] to-[#6c34ff] text-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <ChatbotIcon className="w-6 h-6" />
                    <h3 className="font-bold text-lg">WesBI Chat</h3>
                </div>
                <button
                    onClick={() => dispatch({ type: 'TOGGLE_CHATBOT' })}
                    className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    aria-label="Close chat"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => <Message key={index} message={msg} />)}
                {isLoading && <div className="flex justify-start"><TypingIndicator /></div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={isLoading ? "Waiting for response..." : "Ask about your data..."}
                        disabled={isLoading || !chat}
                        className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9c4dff] disabled:bg-gray-100"
                        aria-label="Chat input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !chat}
                        className="p-3 bg-[#9c4dff] text-white rounded-full transition-colors hover:bg-[#7a33ff] disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Send message"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;