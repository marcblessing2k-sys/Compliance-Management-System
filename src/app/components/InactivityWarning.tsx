import { AlertCircle } from 'lucide-react';

interface InactivityWarningProps {
  secondsRemaining: number;
  onExtend: () => void;
}

export function InactivityWarning({ secondsRemaining, onExtend }: InactivityWarningProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <AlertCircle className="text-yellow-600" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Session Timeout Warning</h2>
            <p className="text-sm text-gray-600">You will be logged out due to inactivity</p>
          </div>
        </div>

        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-3">
            <span className="text-4xl font-bold text-white">{secondsRemaining}</span>
          </div>
          <p className="text-gray-600">
            seconds remaining before automatic logout
          </p>
        </div>

        <button
          onClick={onExtend}
          className="w-full bg-[#5B9BD5] hover:bg-[#4682B4] text-white py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          Continue Session
        </button>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
}
