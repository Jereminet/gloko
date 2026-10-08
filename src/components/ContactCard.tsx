import React, { useState } from 'react';
import { Contact } from '../types';
import { Mail, Phone, MessageSquare, MapPin, Edit, Trash2, Calendar, User, Bell, Send, Check } from 'lucide-react';
import { getCountryInfo } from '../data/countries';
import { getTranslation, getAppLanguage } from '../utils/translations';
import PhotoModal from './PhotoModal';
import { playBellSound } from '../utils/audio';

interface ContactCardProps {
  key?: string | number;
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onPing?: (contact: Contact) => void;
  onExpandPhoto?: (url: string, name: string) => void;
  shouldShake?: boolean;
}

// Generate a deterministic soft pastel background gradient based on name string
function getAvatarGradient(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-indigo-500 to-indigo-600 text-indigo-50',
    'from-slate-600 to-slate-700 text-slate-50',
    'from-violet-500 to-indigo-500 text-violet-50',
    'from-indigo-400 to-slate-400 text-indigo-50',
    'from-slate-500 to-indigo-500 text-slate-50',
    'from-indigo-600 to-violet-600 text-indigo-50',
  ];
  return gradients[hash % gradients.length];
}

// Helper to determine and style contact info fields
function renderContactInfo(info: string) {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info);
  const isPhone = /^[+\d\s-]{7,20}$/.test(info);
  const isSocial = info.startsWith('@');

  let icon = <MessageSquare className="h-3.5 w-3.5" />;
  let href = '';

  if (isEmail) {
    icon = <Mail className="h-3.5 w-3.5" />;
    href = `mailto:${info}`;
  } else if (isPhone) {
    icon = <Phone className="h-3.5 w-3.5" />;
    href = `tel:${info}`;
  } else if (isSocial) {
    href = `https://instagram.com/${info.replace('@', '')}`;
  }

  return (
    <div className="flex items-center gap-2 mt-1 px-2.5 py-1 bg-slate-50 text-[11px] text-slate-600 rounded-lg hover:bg-slate-100 transition-colors w-fit max-w-full overflow-hidden">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="hover:underline text-indigo-600 truncate"
        >
          {info}
        </a>
      ) : (
        <span className="truncate">{info}</span>
      )}
    </div>
  );
}

export default function ContactCard({
  contact,
  onEdit,
  onDelete,
  onPing,
  onExpandPhoto,
  shouldShake = false,
}: ContactCardProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const initial = contact.name.trim().charAt(0).toUpperCase() || '?';
  const countryInfo = getCountryInfo(contact.countryId);

  const handlePingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinging) return;
    setIsPinging(true);
    playBellSound();
    onPing?.(contact);
    setTimeout(() => {
      setIsPinging(false);
    }, 1100);
  };

  return (
    <>
      <div className={`bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-all flex flex-col gap-3 group relative text-slate-800 ${shouldShake ? 'glow-animation ring-2 ring-indigo-500 shadow-md transform' : ''}`}>
      {/* Top Right Action & Ping Button Group */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {/* Yellow Ping Button with message sent fly animation and bell chime */}
        {onPing && (
          <div className="relative shrink-0">
            <button
              onClick={handlePingClick}
              data-ping-button="true"
              disabled={isPinging}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-full border border-amber-300 shadow-xs transition-all cursor-pointer relative shrink-0 disabled:opacity-90"
              title="Send a travel Ping!"
            >
              {isPinging ? (
                <>
                  <Check className="h-3 w-3 stroke-[2.5] text-amber-900" />
                  <span>Sent!</span>
                </>
              ) : (
                <>
                  <Bell className="h-3 w-3 stroke-[2.5] text-amber-900 fill-amber-900/15" />
                  <span>Ping</span>
                </>
              )}
            </button>

            {/* Floating Paper Airplane / Message Burst Animation taking flight */}
            {isPinging && (
              <div className="absolute -top-1 -right-2 pointer-events-none z-30 animate-fly-message flex items-center gap-1 bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full shadow-md border border-amber-300 text-[9px]">
                <Send className="w-2.5 h-2.5 text-amber-950" />
                <span>Pinged</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Always visible */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(contact);
            }}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 hover:border-indigo-100 shadow-xs transition-all cursor-pointer flex items-center justify-center"
            title="Edit Contact"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(contact.id);
            }}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-650 hover:bg-red-50 hover:border-red-100 shadow-xs transition-all cursor-pointer flex items-center justify-center"
            title="Delete Contact"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="flex gap-3.5 items-start">
        {/* Profile Avatar / Resized Photo */}
        {contact.photoUrl ? (
          <img
            src={contact.photoUrl}
            alt={contact.name}
            referrerPolicy="no-referrer"
            onClick={(e) => {
              e.stopPropagation();
              if (onExpandPhoto) {
                onExpandPhoto(contact.photoUrl!, contact.name);
              } else {
                setShowPhotoModal(true);
              }
            }}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200/60 bg-slate-50 flex-shrink-0 shadow-sm cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
            title="Click to expand photo"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(
              contact.name
            )} font-display font-semibold text-lg flex items-center justify-center flex-shrink-0 shadow-sm`}
          >
            {initial}
          </div>
        )}

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-16 md:pr-24">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-sans font-semibold text-slate-800 text-sm truncate max-w-full">
              {contact.name}
            </h4>
          </div>

          {/* City / Location */}
          {contact.city && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-sans mt-0.5">
              <MapPin className="h-3 w-3 text-slate-450 flex-shrink-0" />
              <span className="truncate">{contact.city}</span>
            </div>
          )}

          {/* Live Location Detail Line */}
          <div className="flex items-center gap-1.5 text-[11px] font-sans mt-1">
            <span className="text-slate-400 font-medium">Live Location:</span>
            {contact.hasLinkedAccount && contact.geolocationEnabled && contact.liveCountryId ? (
              (() => {
                const info = getCountryInfo(contact.liveCountryId);
                return (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="select-none">{info?.flag}</span>
                    <span>{info?.name || 'Unknown'}</span>
                  </span>
                );
              })()
            ) : (
              <span className="text-slate-400 italic">unknown</span>
            )}
          </div>

          {/* Contact field detail */}
          {contact.contactInfo && renderContactInfo(contact.contactInfo)}
        </div>
      </div>

      {/* Notes Row */}
      {contact.notes && (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-600 font-sans leading-relaxed whitespace-pre-wrap leading-relaxed">
          {contact.notes}
        </div>
      )}

      {/* Date Met */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 font-sans border-t border-slate-100 pt-2 pb-0.5 mt-auto">
        <span className="flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          <span>{(() => {
            const lang = getAppLanguage();
            const formatted = new Date(contact.createdAt).toLocaleDateString(lang, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const t = getTranslation();
            return t.addedOnFormat.replace('{date}', formatted);
          })()}</span>
        </span>
      </div>
      </div>

      <PhotoModal
        isOpen={showPhotoModal}
        photoUrl={contact.photoUrl || null}
        friendName={contact.name}
        onClose={() => setShowPhotoModal(false)}
      />
    </>
  );
}
