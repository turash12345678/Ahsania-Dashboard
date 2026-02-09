import { Plus, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export function Header({ searchTerm, onSearchChange }: HeaderProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en-US' | 'bn-BD'>('en-US');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('voice_lang');
    if (savedLang === 'bn-BD' || savedLang === 'en-US') {
      setLanguage(savedLang);
    }
  }, []);

  const switchLanguage = (lang: 'en-US' | 'bn-BD') => {
    setLanguage(lang);
    localStorage.setItem('voice_lang', lang);
    setShowLangMenu(false);
  };

  // Web Speech API Handler
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert("Voice input not supported in this browser.");
    }
  };

  // Long Press Handlers
  const handleTouchStart = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowLangMenu(true);
    }, 600);
  };

  const handleTouchEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPress.current) {
      // Prevent click if long press happened
      e.preventDefault();
      return;
    }
    // If normal click, start listening (only if menu handles didn't capture it)
    if (!showLangMenu) startListening();
  };

  return (
    <div className="flex flex-col items-center w-full bg-[#EFF3F9] pt-[16px] pr-[16px] pb-[8px] pl-[16px]">
      <div className="flex flex-row items-center w-full max-w-[380px] h-[60px] gap-[21px]">
        {/* Close Button (Plus rotated 45deg) -> Dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-none w-[29px] h-[29px] flex items-center justify-center text-[#40444A] transform rotate-45 active:scale-95 transition-transform cursor-pointer"
        >
          <Plus size={36} strokeWidth={2.5} />
        </button>

        {/* Search Pill */}
        <div className="flex-1 h-[60px] bg-white rounded-[33px] flex items-center justify-center shadow-sm px-4">
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Search in List"}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => onSearchChange("")} // Auto-clear on click/focus
            className="w-full bg-transparent outline-none text-[20px] leading-[30px] text-[#7A747F] placeholder-[#7A747F] font-roboto font-normal text-center"
          />
        </div>

        {/* Microphone Icon */}
        <div className="relative">
          <button
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`flex-none w-[29px] h-[29px] flex items-center justify-center active:scale-95 transition-transform ${isListening ? 'text-red-500 scale-110' : 'text-[#40444A] opacity-80'}`}
          >
            <Mic size={28} strokeWidth={2} />
          </button>

          {/* Language Selection Menu */}
          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white shadow-2xl rounded-2xl p-4 z-50 w-64 border border-blue-100 animate-in fade-in zoom-in duration-200">
              <div className="text-sm font-bold text-gray-500 mb-3 px-2 uppercase tracking-wider">Select Voice Language</div>
              <div className="space-y-2">
                <button
                  onClick={() => switchLanguage('bn-BD')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-lg font-medium transition-all ${language === 'bn-BD' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  🇧🇩 Bangla (বাংলা)
                </button>
                <button
                  onClick={() => switchLanguage('en-US')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-lg font-medium transition-all ${language === 'en-US' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
