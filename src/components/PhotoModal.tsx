import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  photoUrl: string | null;
  friendName?: string;
  onClose: () => void;
}

export default function PhotoModal({
  isOpen,
  photoUrl,
  friendName,
  onClose,
}: PhotoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg sm:max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate pr-4">
            {friendName || 'Friend Photo'}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Photo Container */}
        <div className="p-3 sm:p-4 bg-slate-900/5 flex items-center justify-center overflow-auto max-h-[75vh]">
          <img
            src={photoUrl}
            alt={friendName || 'Friend photo'}
            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
