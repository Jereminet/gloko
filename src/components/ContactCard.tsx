import React from 'react';
import { Contact } from '../types';
import { Mail, Phone, MessageSquare, MapPin, Edit, Trash2, Calendar, User } from 'lucide-react';
import { getCountryInfo } from '../data/countries';

interface ContactCardProps {
  key?: string | number;
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
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
}: ContactCardProps) {
  const initial = contact.name.trim().charAt(0).toUpperCase() || '?';
  const countryInfo = getCountryInfo(contact.countryId);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-all flex flex-col gap-3 group relative text-slate-800">
      {/* Action Buttons: Float / Hover styled */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(contact)}
          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 shadow-sm transition-all"
          title="Edit Contact"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50 hover:border-red-100 shadow-sm transition-all"
          title="Delete Contact"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Responsive mobile touch actions always visible */}
      <div className="md:hidden absolute top-3 right-3 flex gap-1.5">
        <button
          onClick={() => onEdit(contact)}
          className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 active:bg-indigo-50 active:text-indigo-600"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 active:bg-red-50 active:text-red-650"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Card Info Details */}
      <div className="flex gap-3.5 items-start">
        {/* Profile Avatar / Resized Photo */}
        {contact.photoUrl ? (
          <img
            src={contact.photoUrl}
            alt={contact.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover border border-slate-200/60 bg-slate-50 flex-shrink-0 shadow-sm"
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
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-sans font-semibold text-slate-800 text-sm truncate max-w-full">
              {contact.name}
            </h4>
            {countryInfo && (
              <span
                className="text-xs select-none"
                title={`${countryInfo.name} flag`}
              >
                {countryInfo.flag}
              </span>
            )}
          </div>

          {/* City / Location */}
          {contact.city && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-sans mt-0.5">
              <MapPin className="h-3 w-3 text-slate-450 flex-shrink-0" />
              <span className="truncate">{contact.city}</span>
            </div>
          )}

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
          <span>Met on {new Date(contact.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}</span>
        </span>
        <span className="text-slate-300 font-mono text-[8px]">ID: {contact.id.substring(0, 4).toUpperCase()}</span>
      </div>
    </div>
  );
}
