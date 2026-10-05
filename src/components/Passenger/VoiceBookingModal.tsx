import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  CheckCircle2,
  ArrowRight,
  Languages,
  Loader2,
  MessageSquareQuote,
  Shield,
  Users
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { CITY_LOCATIONS } from '../../data/mockData';

interface VoiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOMALI_PRESET_COMMANDS = [
  {
    title: 'Wadaage Pink / Dumarka Keliya',
    somali: 'Waxaan doonayaa Wadaage Pink oo iga qaada Jaamacadda Hargeysa una socda Suuqa Hoose',
    desc: 'Female-only matched shared ride',
  },
  {
    title: 'Safarka Madaarka Cigaal',
    somali: 'I gee Madaarka Caalamiga ah ee Cigaal anoo ka imanaya Huteelka Mansoor',
    desc: 'Airport Express Taxi',
  },
  {
    title: 'Gaadhi Wadaag Ganacsi',
    somali: 'Kaalay Dahabshiil Center oo i gee Ambassador Hotel gaadhi wadaag ah',
    desc: 'Shared discount commute',
  },
  {
    title: 'Taxi Caadi ah',
    somali: 'Taksi caadi ah iigu yeedh Suuqa Barta ilaa New Hargeisa',
    desc: 'Standard Taxi dispatch',
  },
];

export const VoiceBookingModal: React.FC<VoiceBookingModalProps> = ({ isOpen, onClose }) => {
  const {
    setPickupLocation,
    setDropoffLocation,
    setSelectedCategory,
    setGenderPreference,
    setWaitAndSaveTier,
    bookRide
  } = useRide();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'confirmed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    pickupName: string;
    dropoffName: string;
    category: string;
    genderPreference?: string;
    waitAndSaveTier?: string;
    confidence: number;
    explanation?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Prompt initial instruction
      setStatus('idle');
      setTranscript('Riix badhanka mikrafoonka ama dooro hadal Somali ah hoos...');
    } else {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setIsListening(false);
    setTranscript('');
    setStatus('idle');
    setParsedResult(null);
    setErrorMessage('');
  };

  const processCommandText = async (text: string) => {
    setStatus('processing');
    setTranscript(`"${text}"`);

    try {
      const response = await fetch('/api/nlp/parse-somali-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      const data = await response.json();

      if (data && data.success) {
        // Map pickup
        let pickupNode = CITY_LOCATIONS.find((l) => l.name.toLowerCase().includes(data.pickup.toLowerCase())) ||
          CITY_LOCATIONS.find((l) => l.id === data.pickupId) ||
          CITY_LOCATIONS[0];

        // Map dropoff
        let dropoffNode = CITY_LOCATIONS.find((l) => l.name.toLowerCase().includes(data.dropoff.toLowerCase())) ||
          CITY_LOCATIONS.find((l) => l.id === data.dropoffId) ||
          CITY_LOCATIONS[1];

        setPickupLocation(pickupNode);
        setDropoffLocation(dropoffNode);

        const category = data.category || 'wadaage_share';
        setSelectedCategory(category as any);

        if (data.genderPreference === 'female_only') {
          setGenderPreference('female_only');
        } else {
          setGenderPreference('any');
        }

        if (data.waitAndSaveTier === 'wait_and_save') {
          setWaitAndSaveTier('wait_and_save');
        } else {
          setWaitAndSaveTier('express');
        }

        setParsedResult({
          pickupName: pickupNode.name,
          dropoffName: dropoffNode.name,
          category,
          genderPreference: data.genderPreference,
          waitAndSaveTier: data.waitAndSaveTier,
          confidence: data.confidence || 0.95,
          explanation: data.explanation || 'AI successfully recognized Somali landmarks and ride intent.',
        });

        setStatus('confirmed');
        setIsListening(false);
      } else {
        throw new Error(data.message || 'Could not understand command');
      }
    } catch (e: any) {
      console.warn('NLP server fallback, applying local Somali parser:', e);
      // Fallback local heuristic
      let pNode = CITY_LOCATIONS[0];
      let dNode = CITY_LOCATIONS[1];
      let cat = 'wadaage_share';
      let gPref = 'any';

      const lower = text.toLowerCase();
      if (lower.includes('madaarka') || lower.includes('airport')) {
        dNode = CITY_LOCATIONS.find((l) => l.id === 'loc_airport') || CITY_LOCATIONS[3];
      }
      if (lower.includes('mansoor')) {
        pNode = CITY_LOCATIONS.find((l) => l.id === 'loc_mansoor') || CITY_LOCATIONS[2];
      }
      if (lower.includes('jaamacadda') || lower.includes('university')) {
        pNode = CITY_LOCATIONS.find((l) => l.id === 'loc_uoh') || CITY_LOCATIONS[1];
      }
      if (lower.includes('pink') || lower.includes('dumar') || lower.includes('shecab')) {
        gPref = 'female_only';
        setGenderPreference('female_only');
      }
      if (lower.includes('taxi') || lower.includes('taksi')) {
        cat = 'wadaage_taxi';
      }

      setPickupLocation(pNode);
      setDropoffLocation(dNode);
      setSelectedCategory(cat as any);

      setParsedResult({
        pickupName: pNode.name,
        dropoffName: dNode.name,
        category: cat as any,
        genderPreference: gPref,
        confidence: 0.92,
        explanation: 'Understood via Wadaage On-Device Somali Landmark Engine.',
      });
      setStatus('confirmed');
      setIsListening(false);
    }
  };

  const startVoiceCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'so-SO'; // Somali language code, falls back to multi-lingual
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);
        setStatus('listening');
        setTranscript('Dhegeysanayaa codkaaga... (Listening to Somali audio)');

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          processCommandText(speechResult);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
          setStatus('idle');
          setTranscript('Codka lama maqal ama makarafoonka ayaa xidhan. Fadlan ku celi adoo cod dheer ku hadlaya ama dooro meelaha degdegga ah.');
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('Speech API init error:', err);
      }
    }

    setIsListening(false);
    setStatus('idle');
    setTranscript('Browser-kaagu ma taageerayo duubista codka tooska ah. Fadlan dooro mid ka mid ah jidadka iyo meelaha hoose.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-2 pb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Somali NLP Voice AI (Af-Soomaali)
          </div>

          <h3 className="text-xl font-black tracking-tight text-white mb-1">
            Hands-Free Somali Voice Booking
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Ku hadal Af-Soomaali dabiici ah: Magacow halka aad joogto iyo meesha aad u socoto
          </p>
        </div>

        {/* Visualizer Wave */}
        <div className="my-5 flex items-center justify-center gap-1.5 h-16">
          {isListening ? (
            <>
              <div className="w-2 bg-emerald-500 rounded-full h-10 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 bg-emerald-400 rounded-full h-14 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 bg-teal-400 rounded-full h-8 animate-bounce" style={{ animationDelay: '300ms' }} />
              <div className="w-2 bg-emerald-500 rounded-full h-16 animate-bounce" style={{ animationDelay: '100ms' }} />
              <div className="w-2 bg-emerald-300 rounded-full h-6 animate-bounce" style={{ animationDelay: '250ms' }} />
            </>
          ) : status === 'processing' ? (
            <div className="flex flex-col items-center gap-2 text-teal-400 text-xs font-bold">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>AI Fahmaysa Amarkaaga...</span>
            </div>
          ) : status === 'confirmed' ? (
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/50 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <button
              onClick={startVoiceCapture}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}
        </div>

        {/* Live Transcript / Output Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center mb-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold mb-1">
            {status === 'listening'
              ? 'DHEGEYSANAYAA...'
              : status === 'processing'
              ? 'AI SOMALI RECOGNITION...'
              : status === 'confirmed'
              ? 'AMARKA LA FAHMEY (CONFIRMED)'
              : 'DIYAAR (READY)'}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-200 italic">
            {transcript}
          </p>
        </div>

        {/* Parsed Result Box if Confirmed */}
        {parsedResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 mb-4 text-left space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 font-extrabold uppercase tracking-wide">
              <span>Halka La Hubiyey</span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md">
                Confidence: {Math.round(parsedResult.confidence * 100)}%
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400 font-semibold">Ka Qaad:</span> {parsedResult.pickupName}
              </div>
              <div>
                <span className="text-slate-400 font-semibold">U Gee:</span> {parsedResult.dropoffName}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                  {parsedResult.category.toUpperCase()}
                </span>
                {parsedResult.genderPreference === 'female_only' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Wadaage Pink
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Somali Preset Clickable Chips */}
        {status !== 'confirmed' && (
          <div className="mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Ama Riix Tusaale Soomaali ah:
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {SOMALI_PRESET_COMMANDS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => processCommandText(p.somali)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition flex items-center justify-between text-xs group"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-200 block truncate">{p.title}</span>
                    <span className="text-[11px] text-teal-400/90 truncate italic block">"{p.somali}"</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {status === 'confirmed' ? (
            <button
              onClick={() => {
                bookRide('wallet');
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              Hubi & Dalbo Gaadhiga Hadda (Book Ride)
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={startVoiceCapture}
              disabled={isListening}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              {isListening ? 'Dhegeysanayaa...' : 'Riix si aad Cod ugu Dalbato'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
