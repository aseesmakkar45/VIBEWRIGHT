import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Flame, Cpu, Sparkles } from 'lucide-react';

const VIBE_MODES = [
  {
    id: "x_mode",
    name: "🔥 X Mode",
    subtext: "Punchy, witty & direct — short cadence, meme culture & dry humor.",
    icon: <Flame size={15} className="text-amber-500" />
  },
  {
    id: "first_principles",
    name: "🚀 First Principles",
    subtext: "Hardcore engineering — atomic physics, thermodynamics & 5-step algorithm.",
    icon: <Cpu size={15} className="text-blue-500" />
  },
  {
    id: "visionary",
    name: "🌌 Visionary",
    subtext: "Civilizational scale — consciousness, Fermi paradox & simulation theory.",
    icon: <Sparkles size={15} className="text-purple-500" />
  }
];

const VibeSelector = ({ selectedVibe, setSelectedVibe }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeVibe = VIBE_MODES.find(v => v.id === selectedVibe) || VIBE_MODES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-700 font-medium text-xs border border-gray-200 bg-white/70 shadow-xs"
        title="Persona Style & Tone Mode"
      >
        <span>{activeVibe.icon}</span>
        <span className="font-semibold text-gray-800">{activeVibe.name}</span>
        <ChevronDown 
          size={13} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden animate-fade-in-up origin-bottom">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Persona Style Clone</span>
          </div>
          <div className="p-1.5 flex flex-col gap-1">
            {VIBE_MODES.map((vibe) => (
              <button
                key={vibe.id}
                onClick={() => {
                  setSelectedVibe(vibe.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                  selectedVibe === vibe.id 
                    ? 'bg-amber-50/80 border border-amber-200/60' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {vibe.icon}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold tracking-wide ${selectedVibe === vibe.id ? 'text-amber-900' : 'text-gray-800'}`}>
                    {vibe.name}
                  </span>
                  <span className="text-[11px] leading-snug text-gray-500 mt-0.5">
                    {vibe.subtext}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VibeSelector;
