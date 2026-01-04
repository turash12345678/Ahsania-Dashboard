import { Plus, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export function Header({ searchTerm, onSearchChange }: HeaderProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  // Web Speech API Handler
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Or 'bn-BD' if needed

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
            className="w-full bg-transparent outline-none text-[20px] leading-[30px] text-[#7A747F] placeholder-[#7A747F] font-roboto font-normal text-center"
          />
        </div>

        {/* Microphone Icon */}
        <button
          onClick={startListening}
          className={`flex-none w-[29px] h-[29px] flex items-center justify-center text-[#40444A] active:scale-95 transition-transform ${isListening ? 'text-red-500 scale-110' : 'opacity-80'}`}
        >
          <Mic size={28} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
