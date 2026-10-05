import React, { useState } from 'react';
import { Users, UserPlus, Check, X, DollarSign, Share2, Mail } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';

interface FareSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FareSplitModal: React.FC<FareSplitModalProps> = ({ isOpen, onClose }) => {
  const { currentRide, splitFareWith, addSplitFriend, setSplitFareWith, currentUser, language } = useRide();
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalFare = currentRide ? currentRide.totalFare : 24.50;
  const participantCount = splitFareWith.length + 1; // Me + friends
  const perPersonAmount = Math.round((totalFare / participantCount) * 100) / 100;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendName && friendEmail) {
      addSplitFriend(friendName, friendEmail);
      setFriendName('');
      setFriendEmail('');
    }
  };

  const copyShareLink = () => {
    const tripId = currentRide?.id || `trip_${Date.now().toString().slice(-6)}`;
    navigator.clipboard?.writeText(`https://wadaage.taxi/split-fare?trip=${tripId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Dynamic Fare Splitting</h3>
            <p className="text-xs text-slate-500">Split cost automatically in real-time mid-trip</p>
          </div>
        </div>

        {/* Fare Summary Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Trip Fare</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(totalFare)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Your Equal Share ({participantCount} people)</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(perPersonAmount)} / person</span>
          </div>
        </div>

        {/* Invite Friend Form */}
        <form onSubmit={handleAdd} className="space-y-3 mb-5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Invite Friend to Split</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Friend's Name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              required
            />
            <input
              type="email"
              placeholder="Email or Phone"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            Add to Fare Split
          </button>
        </form>

        {/* List of Split Participants */}
        <div className="space-y-2 mb-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Split Participants ({participantCount})</span>

          {/* User Self */}
          <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-[10px]">YOU</div>
              <div>
                <p className="font-bold">{currentUser?.name || (language === 'so' ? 'Adiga (Qabanqaabiye)' : 'You (Trip Host)')}</p>
                <p className="text-[10px] text-slate-500">Host • WadaagePay</p>
              </div>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(perPersonAmount)}</span>
          </div>

          {/* Invited Friends */}
          {splitFareWith.map((friend, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{friend.name}</p>
                  <p className="text-[10px] text-slate-500">{friend.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(perPersonAmount)}</span>
                <button
                  onClick={() => setSplitFareWith((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Share Link Button */}
        <button
          onClick={copyShareLink}
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-indigo-500" />}
          {copied ? 'Split Request Link Copied!' : 'Share Split Payment Link'}
        </button>
      </div>
    </div>
  );
};
