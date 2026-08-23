import React, { useState, useEffect, useRef, Component } from 'react';
import { PanelLeftOpen, Rocket, FileText, Bot, User, Copy, Check, Edit3, X, RefreshCw, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MessageInput from './MessageInput';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500">Render error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}


const ChatContainer = ({ 
  activeChat, 
  createNewChat,
  setAttachedFilesForChat,
  updateChatActivity,
  handleSendMessage,
  editMessageAndResubmit,
  regenerateResponse,
  switchVariant,
  isSidebarOpen, 
  setIsSidebarOpen,
  isGenerating,
  stopGeneration,
  selectedModel,
  setSelectedModel
}) => {
  const [greeting, setGreeting] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const editInputRef = useRef(null);

  // Elon Musk Persona Greetings
  const greetingsList = [
    "What do you want to know about my tweets?",
    "Ask me anything — I'll answer based on what I've actually said.",
    "Mars, AI, free speech — what's on your mind?",
    "Let's talk. What topic are you curious about?",
    "I tweet a lot. Ask me what I think about something.",
    "The future is exciting. What do you want to discuss?",
    "Got a question about Tesla, SpaceX, or X? Fire away.",
    "I respond based strictly on my real tweets. Try me.",
    "What's your question? I'll ground it in what I've actually posted.",
    "Curious about my views? Let's dig into the data.",
    "Ask me about rockets, electric cars, or the meaning of life.",
    "My knowledge comes from my own tweets. What do you want to explore?",
    "Let's get into it. What are you curious about?",
    "I'm Elon's digital twin. Ask me anything from his timeline.",
    "What burning question can I answer from my tweet history?"
  ];

  useEffect(() => {
    setGreeting(greetingsList[Math.floor(Math.random() * greetingsList.length)]);
  }, [activeChat?.id]); // Refresh greeting only when switching to a new/different chat

  // Determine if there is content in the current chat
  const isChatActive = activeChat && (activeChat.messages.length > 0);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const startEditing = (id, text) => {
    setEditingMessageId(id);
    setEditMessageText(text);
  };

  const handleEditSubmit = (msgId) => {
    if (editMessageText.trim() && activeChat) {
      editMessageAndResubmit(activeChat.id, msgId, editMessageText);
    }
    setEditingMessageId(null);
    setEditMessageText('');
  };

  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
      const textLength = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(textLength, textLength);
    }
  }, [editingMessageId]);

  // TTS Helper Functions
  const sanitizeForSpeech = (text) => {
    return text
      .replace(/#+\s/g, '')
      .replace(/(\*\*|\*|__|_)/g, '')
      .replace(/\[Source:.*?\]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`/g, '')
      .replace(/\n/g, '. ');
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const cleanText = sanitizeForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      console.warn('Text-to-speech not supported in this browser.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative min-w-[320px]">
      
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-8 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        
        {/* Dynamic Greeting Center (Landing State) */}
        <div 
          className={`flex-1 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out ${
            isChatActive ? 'opacity-0 -translate-y-10 pointer-events-none absolute inset-0' : 'opacity-100 translate-y-0 relative'
          }`}
        >
          <div className="bg-amber-100 p-4 rounded-full mb-6">
            <Rocket size={48} className="text-amber-600" />
          </div>
          <h1 className="text-3xl font-medium font-spectral text-gray-800 tracking-wide mb-8 text-center leading-loose max-w-2xl">
            {greeting}
          </h1>
          
          {/* Centered Input (Landing State) */}
          <div className="w-full">
            <MessageInput 
              activeChat={activeChat}
              createNewChat={createNewChat}
              setAttachedFilesForChat={setAttachedFilesForChat}
              updateChatActivity={updateChatActivity}
              handleSendMessage={handleSendMessage}
              isChatActive={false}
              isGenerating={isGenerating}
              stopGeneration={stopGeneration}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>

        <div 
          className={`flex-1 w-full max-w-6xl mx-auto p-4 transition-all duration-700 delay-100 ${
            isChatActive ? 'opacity-100 translate-y-0 flex flex-col' : 'opacity-0 translate-y-10 pointer-events-none absolute inset-0'
          }`}
        >
          {activeChat?.messages.map((msg, i) => (
            <div 
              key={i} 
              className={`group w-full flex animate-fade-in-up py-6 px-4 md:px-8 border-b border-slate-200/70 last:border-0 ${
                msg.role === 'user' ? 'flex-row-reverse justify-start' : 'flex-row justify-start'
              }`}
            >
              {/* Avatar Column */}
              <div className={`flex-shrink-0 mt-1 ${msg.role === 'user' ? 'ml-5' : 'mr-5'}`}>
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm border border-gray-300">
                    <User size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                    <Bot size={16} />
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="flex flex-col min-w-0 relative max-w-[90%]">
                
                {/* Header Row */}
                <div className={`flex items-center mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-sm font-semibold tracking-wide text-gray-800">
                    {msg.role === 'user' ? 'You' : 'PersonaTwin.ai'}
                  </span>
                </div>

                {/* File Attachments */}
                {msg.files && msg.files.length > 0 && (
                  <div className={`flex flex-wrap gap-2 mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.files.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide text-gray-700 shadow-sm">
                        <FileText size={14} className="text-gray-400" />
                        <span className="truncate max-w-[200px]">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Content */}
                {editingMessageId === msg.id ? (
                  <div className="flex flex-col w-full gap-3 mt-1">
                    <textarea 
                      ref={editInputRef}
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      rows={Math.max(3, editMessageText.split('\n').length)}
                      className="w-full bg-white border border-amber-200 rounded-lg focus:ring-1 focus:ring-amber-500 resize-none p-3 text-[15.5px] leading-relaxed text-gray-800 shadow-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingMessageId(null)}
                        className="px-4 py-2 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleEditSubmit(msg.id)}
                        className="px-4 py-2 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
                      >
                        Save & Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col w-full text-gray-800">
                    {!msg.text && msg.role === 'assistant' && (
                      <div className="transition-all duration-500 ease-in-out my-1">
                        {isGenerating ? (
                          <span className="animate-glow-pulse italic text-[15px] font-medium text-slate-500">Thinking...</span>
                        ) : (
                          <span className="italic text-[15px] font-medium text-red-400">Generation stopped.</span>
                        )}
                      </div>
                    )}
                    {msg.text && (
                      <div className="transition-all duration-300 opacity-100 font-sans text-[15.5px]">
                        <ErrorBoundary>
                          <div className="prose prose-slate prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        </ErrorBoundary>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Utility Actions (visible on hover) */}
                <div className={`mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' && !editingMessageId && (
                    <button 
                      onClick={() => startEditing(msg.id, msg.text)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md transition-colors"
                      title="Edit Message"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}

                  {/* Variant pagination for assistant messages */}
                  {msg.role === 'assistant' && msg.variants && msg.variants.length > 1 && (
                    <div className="flex items-center gap-1 mr-2 text-xs text-gray-500 font-medium select-none">
                      <button 
                        onClick={() => switchVariant(activeChat.id, msg.id, -1)}
                        disabled={msg.activeVariantIndex === 0}
                        className="p-1 hover:text-gray-800 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                        title="Previous Response"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span>{msg.activeVariantIndex + 1} / {msg.variants.length}</span>
                      <button 
                        onClick={() => switchVariant(activeChat.id, msg.id, 1)}
                        disabled={msg.activeVariantIndex === msg.variants.length - 1}
                        className="p-1 hover:text-gray-800 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                        title="Next Response"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                  
                  {msg.text && msg.role === 'assistant' && !isGenerating && (
                    <button 
                      onClick={() => regenerateResponse(activeChat.id, msg.id)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md transition-colors"
                      title="Regenerate Response"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}

                  {msg.text && msg.role === 'assistant' && !isGenerating && (
                    <button 
                      onClick={() => handleSpeak(msg.text)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md transition-colors"
                      title="Read Aloud"
                    >
                      <Volume2 size={14} />
                    </button>
                  )}

                  {msg.text && (
                    <button 
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md transition-colors"
                      title="Copy Text"
                    >
                      {copiedMessageId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>

      {/* Docked Input Area (Visible when active) */}
      <div 
        className={`w-full bg-gradient-to-t from-marble via-marble to-transparent relative z-20 transition-all duration-700 ${
          isChatActive ? 'opacity-100 translate-y-0 pb-4 pt-2' : 'opacity-0 translate-y-10 pointer-events-none absolute bottom-0 left-0 right-0'
        }`}
      >
          <MessageInput 
          activeChat={activeChat}
          createNewChat={createNewChat}
          setAttachedFilesForChat={setAttachedFilesForChat}
          updateChatActivity={updateChatActivity}
          handleSendMessage={handleSendMessage}
          isChatActive={true}
          isGenerating={isGenerating}
          stopGeneration={stopGeneration}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>

    </div>
  );
};

export default ChatContainer;
