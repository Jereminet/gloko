import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Contact } from '../types';
import { getCountryInfo } from '../data/countries';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import { UserPlus, X, Globe, MapPin, Palette, Search } from 'lucide-react';

interface CountryDetailsProps {
  countryId: string;
  countryName: string;
  contacts: Contact[];
  onAddContact: (contactData: Omit<Contact, 'id' | 'createdAt'>) => Promise<string>;
  onUpdateContact: (contactData: Contact) => void;
  onDeleteContact: (id: string) => void;
  onBack: () => void;
  currentColor?: string;
  onColorChange?: (color: string) => void;
}

export default function CountryDetails({
  countryId,
  countryName,
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onBack,
  currentColor = '',
  onColorChange,
}: CountryDetailsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [shakeFriendId, setShakeFriendId] = useState<string | null>(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const countryInfo = getCountryInfo(countryId);

  // Filter contacts by specific active country (support padded variations)
  const countryContacts = contacts.filter(
    (c) => c.countryId === countryId || c.countryId.padStart(3, '0') === countryId.padStart(3, '0')
  );

  // Filter displayed contacts based on user's query search inside country details - strictly limited to the name of the friend
  const displayedContacts = countryContacts.filter((c) => {
    if (!friendSearchQuery.trim()) return true;
    const q = friendSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q);
  });

  const getNiceDefaultColorForCountry = (id: string) => {
    const padded = id.padStart(3, '0');
    let hash = 0;
    for (let i = 0; i < padded.length; i++) {
      hash = padded.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 75%, 72%)`;
  };

  const handleSaveContact = async (data: any) => {
    if (data.id) {
      // update
      onUpdateContact(data as Contact);
    } else {
      // create
      const newId = await onAddContact(data);
      if (newId) {
        setShakeFriendId(newId);
        
        // Beautiful elegant double confetti blast
        try {
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.6 }
          });
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 110,
              origin: { y: 0.55 }
            });
          }, 200);
        } catch (e) {
          console.error(e);
        }

        // Set glowing duration to exactly 1 second
        setTimeout(() => {
          setShakeFriendId(null);
        }, 1000);
      }
    }
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[400px] text-slate-800">
      {/* Detail View Header */}
      {!isFormOpen ? (
        <>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2 font-sans relative">
                  <span className="text-xl leading-none select-none">{countryInfo?.flag || '🗺️'}</span>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight">{countryName}</h3>
                  
                  {/* Small Customizable Color Button Next to name */}
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-1 hover:bg-slate-200/60 text-slate-500 rounded-md transition-all flex items-center justify-center cursor-pointer"
                      title="Choose map display color"
                    >
                      <Palette 
                        className="h-4 w-4" 
                        style={{ color: currentColor || getNiceDefaultColorForCountry(countryId) }} 
                      />
                    </button>
                    
                    {/* Micro absolute floating preset picker */}
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 shadow-lg rounded-xl p-2.5 z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 w-max">
                        {[
                          '#6366f1', // Indigo
                          '#3b82f6', // Sapphire Blue
                          '#10b981', // Emerald
                          '#f59e0b', // Amber Gold
                          '#ef4444', // Crimson Red
                          '#ec4899', // Rose Orchid
                          '#8b5cf6', // Lavender Purple
                          '#14b8a6', // Cool Mint
                        ].map((presetColor) => (
                          <button
                            key={presetColor}
                            onClick={() => {
                              onColorChange && onColorChange(presetColor);
                              setShowColorPicker(false);
                            }}
                            style={{ backgroundColor: presetColor }}
                            className={`w-4.5 h-4.5 rounded-full transition-transform hover:scale-115 cursor-pointer shadow-xs border border-white ${
                              currentColor === presetColor ? 'ring-2 ring-indigo-505/80 scale-110' : ''
                            }`}
                          />
                        ))}
                        
                        {/* Native custom color bubble tool */}
                        <label 
                          className="w-4.5 h-4.5 rounded-full border border-slate-200 shadow-xs relative cursor-pointer hover:scale-115 transition-transform flex items-center justify-center overflow-hidden"
                          style={{
                            background: 'linear-gradient(45deg, #f06a6a, #f0c36a, #6af07a, #6ad0f0, #966af0, #f06adc)'
                          }}
                          title="Custom color..."
                        >
                          <input
                            type="color"
                            value={currentColor || '#6366f1'}
                            onChange={(e) => onColorChange && onColorChange(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <span className="text-[9px] text-white font-bold leading-none select-none">+</span>
                        </label>

                        {currentColor && (
                          <button
                            onClick={() => {
                              onColorChange && onColorChange('');
                              setShowColorPicker(false);
                            }}
                            className="px-2 py-0.5 border border-slate-205 bg-slate-50 hover:bg-slate-100 rounded text-[9px] font-sans font-semibold text-slate-500 transition-colors cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-sans font-medium pl-6">
                  {countryInfo?.continent || 'Globe'}
                </span>
              </div>
            </div>

            {/* Exit button on top right */}
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              title="Close Panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List and Cards Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Big Prominent Central "Add Friend" Button & Local Friend Search Bar */}
            {countryContacts.length > 0 && (
              <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-100/60">
                <button
                  onClick={handleAddNewClick}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Friend in {countryName}</span>
                </button>

                {/* Micro Input Box to find a friend in active country */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search friends in this country..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full text-[11px] pl-8 pr-7 py-2 border border-slate-200 bg-slate-50/70 hover:bg-slate-100/50 focus:bg-white rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-sans text-slate-800"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  {friendSearchQuery.trim() && (
                    <button
                      onClick={() => setFriendSearchQuery('')}
                      className="absolute right-2.5 top-2 hover:text-red-500 text-slate-400 transition-colors cursor-pointer p-0.5"
                      title="Clear local search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {countryContacts.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans mb-1 flex items-center justify-between">
                  <span>Friends listed ({displayedContacts.length})</span>
                  {friendSearchQuery.trim() && (
                    <span className="text-indigo-650 bg-indigo-50/80 px-1 rounded font-semibold text-[8px] normal-case">Filtered</span>
                  )}
                </div>
                
                {displayedContacts.length > 0 ? (
                  displayedContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onEdit={handleEditClick}
                      onDelete={onDeleteContact}
                      shouldShake={shakeFriendId === contact.id}
                    />
                  ))
                ) : (
                  <div className="py-8 px-4 text-center text-[11px] text-slate-420 font-sans">
                    No friends match "{friendSearchQuery}" inside this country.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-12">
                {/* Clean inline SVG design representing travel note taking */}
                <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl mb-4">
                  <Globe className="h-8 w-8 animate-pulse" />
                </div>
                <h4 className="font-sans font-semibold text-slate-705 text-sm">No friends in this country</h4>
                
                {/* Bigger, Center Add Friend Button */}
                <button
                  onClick={handleAddNewClick}
                  className="mt-6 w-full max-w-xs py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Friend in {countryName}</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <ContactForm
          countryId={countryId}
          countryName={countryName}
          editingContact={editingContact}
          onSave={handleSaveContact}
          onClose={() => {
            setIsFormOpen(false);
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}
