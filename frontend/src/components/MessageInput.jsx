import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, Mic, ArrowUp, X, Rocket, Zap, MessageCircle, Square, Flame, Sparkles, Brain } from 'lucide-react';
import LightboxModal from './LightboxModal';
import ModelSelector from './ModelSelector';
import VibeSelector from './VibeSelector';

const MessageInput = ({ 
  activeChat, 
  createNewChat, 
  setAttachedFilesForChat, 
  updateChatActivity, 
  handleSendMessage, 
  isChatActive, 
  isGenerating, 
  stopGeneration, 
  selectedModel, 
  setSelectedModel,
  selectedVibe,
  setSelectedVibe 
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const attachedFiles = activeChat?.attachedFiles || [];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 300)}px`;
    }
  }, [text]);

  // Global Keyboard Capture ("Type-to-Chat")
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeElement = document.activeElement;
      if (
        activeElement && 
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.isContentEditable)
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length > 1) return;

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleSubmit = () => {
    if (text.trim() || attachedFiles.length > 0) {
      handleSendMessage(text, attachedFiles);
      setText('');
    }
  };

  const handlePillClick = (prompt) => {
    setText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const updateFiles = (newFiles) => {
    let targetChatId = activeChat?.id;
    if (!targetChatId) {
       targetChatId = createNewChat();
    }
    setAttachedFilesForChat(targetChatId, [...(activeChat?.attachedFiles || []), ...newFiles]);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      updateFiles(newFiles);
      e.target.value = null;
    }
  };

  const removeFile = (indexToRemove, e) => {
    e.stopPropagation();
    if (activeChat) {
      setAttachedFilesForChat(activeChat.id, attachedFiles.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleFileClick = (file) => {
    if (file.type && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setActiveLightboxImage({ url: objectUrl, name: file.name });
    } else {
      const objectUrl = URL.createObjectURL(file);
      const tempLink = document.createElement('a');
      tempLink.href = objectUrl;
      tempLink.download = file.name || 'downloaded_file';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice_query_${Date.now()}.webm`, { type: 'audio/webm' });
          updateFiles([audioFile]);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Could not access microphone. Please ensure microphone permissions are granted.');
      }
    }
  };

  const hasContent = text.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 ${isChatActive ? 'pb-4' : ''}`}>
      {activeLightboxImage && (
        <LightboxModal 
          imageUrl={activeLightboxImage.url} 
          fileName={activeLightboxImage.name} 
          onClose={() => {
            URL.revokeObjectURL(activeLightboxImage.url);
            setActiveLightboxImage(null);
          }} 
        />
      )}

      {/* Input Container */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-200/80 p-2 transition-all duration-200 focus-within:shadow-[0_4px_25px_rgba(0,0,0,0.1)] focus-within:border-amber-400">
        
        {/* Attached Files Chips Bar */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b border-gray-100 mb-1">
            {attachedFiles.map((file, idx) => (
              <div 
                key={idx} 
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button 
                  onClick={(e) => removeFile(idx, e)}
                  className="text-gray-400 hover:text-gray-600 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File Input Element */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            className="hidden" 
          />
          
          {/* Attachment Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors shrink-0"
            title="Attach reference files (PDF, Markdown, CSV, TXT)"
          >
            <Paperclip size={20} />
          </button>

          {/* Dynamic Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Elon anything — tweet history, first principles, or crazy hypotheticals..."
            className="flex-1 max-h-[300px] min-h-[40px] bg-transparent resize-none border-none focus:outline-none focus:ring-0 outline-none text-gray-800 placeholder-gray-400 py-2.5 px-2 overflow-y-auto font-sans"
            rows={1}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 px-1 pb-1">
            <VibeSelector selectedVibe={selectedVibe} setSelectedVibe={setSelectedVibe} />
            <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

            {(!hasContent || isRecording) && !isGenerating && (
              <button 
                onClick={handleMicClick}
                className={`p-2.5 rounded-full transition-colors ${
                  isRecording 
                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
                title="Voice Input"
              >
                <Mic size={18} className={isRecording ? 'animate-pulse text-red-500' : ''} />
              </button>
            )}
            
            {hasContent && !isRecording && !isGenerating && (
              <button 
                onClick={handleSubmit}
                className="p-2.5 rounded-full transition-all bg-gray-900 text-white hover:bg-gray-800 scale-100"
              >
                <ArrowUp size={18} />
              </button>
            )}

            {isGenerating && (
              <button 
                onClick={stopGeneration}
                className="p-2.5 rounded-full transition-all bg-gray-900 text-white hover:bg-gray-800 scale-100"
                title="Stop Execution"
              >
                <Square size={18} className="fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Action Pills (Landing State Only) */}
      {!isChatActive && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 animate-fade-in-up">
          <button 
            onClick={() => handlePillClick("What are your thoughts on settling Mars?")}
            className="bg-white hover:bg-amber-50/70 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Rocket size={14} className="text-amber-500" /> Mars & Starship Timelines
          </button>
          <button 
            onClick={() => handlePillClick("How would you optimize a pizza delivery chain using first principles?")}
            className="bg-white hover:bg-amber-50/70 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Zap size={14} className="text-blue-500" /> First Principles: Pizza Delivery (Out-of-Dataset)
          </button>
          <button 
            onClick={() => handlePillClick("If you were teleported to the Middle Ages, what technology do you build first?")}
            className="bg-white hover:bg-amber-50/70 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles size={14} className="text-purple-500" /> Middle Ages Survival Hypothetical
          </button>
          <button 
            onClick={() => handlePillClick("Are we living in a computer simulation?")}
            className="bg-white hover:bg-amber-50/70 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Brain size={14} className="text-emerald-500" /> Simulation Hypothesis & Memes
          </button>
        </div>
      )}

      {/* Disclaimer / Hints */}
      <div className="text-center mt-3">
        <p className="text-[11px] text-gray-400">
          Cloned with authentic style, tone, cadence, and first-principles mental models.
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
