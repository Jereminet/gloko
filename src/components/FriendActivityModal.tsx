import React from 'react';
import { UserPlus, UserMinus, Heart, Trash2, X, MapPin } from 'lucide-react';
import { COUNTRY_LIST } from '../data/countries';

export type FriendActivityType = 'added' | 'deleted';

export interface FriendActivityInfo {
  type: FriendActivityType;
  friendName: string;
  countryId: string;
  countryName?: string;
  city?: string;
  contactInfo?: string;
  notes?: string;
  // If deletion: the matching contact ID in user's book to remove
  existingContactId?: string;
}

interface FriendActivityModalProps {
  isOpen: boolean;
  activity: FriendActivityInfo | null;
  onClose: () => void;
  onAddBack: (activity: FriendActivityInfo) => void;
  onRemoveBack: (contactId: string) => void;
}

export default function FriendActivityModal({
  isOpen,
  activity,
  onClose,
  onAddBack,
  onRemoveBack,
}: FriendActivityModalProps) {
  if (!isOpen || !activity) return null;

  const country = COUNTRY_LIST.find((c) => c.id === activity.countryId);
  const countryFlag = country?.flag || '🌍';
  const countryDisplayName = country?.name || activity.countryName || 'Global';

  const isAdd = activity.type === 'added';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Exit Close button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isAdd
                  ? 'bg-indigo-50 border-indigo-150 text-indigo-600'
                  : 'bg-red-50 border-red-150 text-red-600'
              }`}
            >
              {isAdd ? (
                <UserPlus className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <UserMinus className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="font-sans font-bold text-base text-slate-900 leading-snug">
                {isAdd ? 'Friend Added You!' : 'Friend Removed You'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium font-sans">
                {isAdd ? 'Mutual Book Connection' : 'Updated Travel Network'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Informative message body */}
        <div className="text-xs text-slate-600 leading-relaxed font-sans">
          {isAdd ? (
            <span>
              <strong className="text-slate-900">{activity.friendName}</strong> has just added you to their GLOKO travel book from{' '}
              <strong className="text-slate-800">{countryFlag} {countryDisplayName}</strong>. Would you like to add them back into your own book as well?
            </span>
          ) : (
            <span>
              <strong className="text-slate-900">{activity.friendName}</strong> has removed their connection with you. Would you like to remove them from your travel book as well?
            </span>
          )}
        </div>

        {/* Contact Snapshot Card Preview */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
            {activity.friendName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-slate-900 truncate">
              {activity.friendName}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-sans mt-0.5">
              <span>{countryFlag}</span>
              <span className="font-medium text-slate-700 truncate">{countryDisplayName}</span>
              {activity.city && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 truncate flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 inline" /> {activity.city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Not Now
          </button>

          {isAdd ? (
            <button
              onClick={() => {
                onAddBack(activity);
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Add Back to My Book</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (activity.existingContactId) {
                  onRemoveBack(activity.existingContactId);
                }
                onClose();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from My Book</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
