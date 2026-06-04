import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Contact } from '../types';
import { getCountryInfo } from '../data/countries';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import { UserPlus, X, Globe, MapPin, Palette, Search, SlidersHorizontal } from 'lucide-react';
import { getTranslation, getAppLanguage } from '../utils/translations';

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
  const t = getTranslation();

  const getAddFriendLabel = () => {
    return t.addFriendInCountry.replace('{countryName}', countryName);
  };

  const getSearchPlaceholder = () => {
    return t.searchFriendsPlaceholder;
  };

  const getFriendsListedLabel = (num: number) => {
    return t.friendsRegisteredLabel.replace('{num}', String(num));
  };

  const getFilteredLabel = () => {
    return t.filteredLabel;
  };

  const getNoFriendsMatchLabel = (query: string) => {
    return t.noFriendsMatch.replace('{query}', query);
  };

  const getNoFriendsInCountryHeader = () => {
    return t.noFriendsInCountry;
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [shakeFriendId, setShakeFriendId] = useState<string | null>(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-asc' | 'date-desc'>('date-desc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const countryInfo = getCountryInfo(countryId);

  // Filter contacts by specific active country (support padded variations)
  const countryContacts = contacts.filter(
    (c) => c.countryId === countryId || c.countryId.padStart(3, '0') === countryId.padStart(3, '0')
  );

  // Filter and sort contacts based on user preferences in country details
  const filteredContacts = countryContacts.filter((c) => {
    if (!friendSearchQuery.trim()) return true;
    const q = friendSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q);
  });

  const displayedContacts = [...filteredContacts].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name, getAppLanguage());
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name, getAppLanguage());
    } else if (sortBy === 'date-asc') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    } else {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
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
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 relative">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2 font-sans">
                  <span className="text-xl leading-none select-none">{countryInfo?.flag || '🗺️'}</span>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight">{countryName}</h3>
                  
                  {/* Small Customizable Color Button Next to name - Only available if friends exist in country */}
                  {countryContacts.length > 0 && (
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
                  )}
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

            {/* Micro absolute floating preset picker, perfectly centered in the header */}
            {showColorPicker && (
              <div className="absolute top-[85%] left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-lg rounded-xl p-2.5 z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 w-max max-w-[90vw] overflow-x-auto">
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
                    className={`w-4.5 h-4.5 rounded-full transition-transform hover:scale-115 cursor-pointer shadow-xs border border-white shrink-0 ${
                      currentColor === presetColor ? 'ring-2 ring-indigo-500 bg-opacity-100 scale-110' : ''
                    }`}
                  />
                ))}
                
                {/* Native custom color bubble tool */}
                <label 
                  className="w-4.5 h-4.5 rounded-full border border-slate-200 shadow-xs relative cursor-pointer hover:scale-115 transition-transform flex items-center justify-center overflow-hidden shrink-0"
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
                    className="px-2 py-0.5 border border-slate-25 bg-slate-50 hover:bg-slate-100 rounded text-[9px] font-sans font-semibold text-slate-500 transition-colors cursor-pointer shrink-0"
                  >
                    {t.resetBtn}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List and Cards Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-4">
            {/* Big Prominent Central "Add Friend" Button & Local Friend Search Bar */}
            {countryContacts.length > 0 && (
              <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-100/60">
                <button
                  onClick={handleAddNewClick}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{getAddFriendLabel()}</span>
                </button>

                {/* Micro Input Box to find a friend in active country */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
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
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans mb-1 flex items-center justify-between relative">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span>{getFriendsListedLabel(displayedContacts.length)}</span>
                    {friendSearchQuery.trim() && (
                      <span className="text-indigo-650 bg-indigo-50/80 px-1 rounded font-semibold text-[8px] tracking-normal normal-case shrink-0">{getFilteredLabel()}</span>
                    )}
                  </div>
                  
                  {/* Filter logo button & dropdown menu */}
                  <div className="relative shrink-0 select-none">
                    <button
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className={`p-1 hover:bg-slate-100 rounded-md transition-all flex items-center gap-1 cursor-pointer normal-case font-semibold text-[10px] ${
                        isSortMenuOpen ? 'text-indigo-650 bg-slate-100/80' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={t.sortFriendsLabel}
                    >
                      <span className="font-sans text-[10px] text-slate-500 font-semibold tracking-normal hidden xs:inline mr-0.5">
                        {(() => {
                          if (sortBy === 'name-asc') return t.sortActiveNameAsc;
                          if (sortBy === 'name-desc') return t.sortActiveNameDesc;
                          if (sortBy === 'date-asc') return t.sortActiveDateAsc;
                          return t.sortActiveDateDesc;
                        })()}
                      </span>
                      <SlidersHorizontal className="h-3.5 w-3.5 stroke-[2.2]" />
                    </button>
                    
                    {isSortMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsSortMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200/80 shadow-lg rounded-xl py-1 z-50 text-[10.5px] font-sans font-medium tracking-normal text-slate-700 normal-case">
                          <button
                            onClick={() => {
                              setSortBy('name-asc');
                              setIsSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                              sortBy === 'name-asc' ? 'text-indigo-650 bg-indigo-50/40 font-bold' : ''
                            }`}
                          >
                            <span>
                              {t.sortAlphabeticalAsc}
                            </span>
                            {sortBy === 'name-asc' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                          </button>

                          <button
                            onClick={() => {
                              setSortBy('name-desc');
                              setIsSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                              sortBy === 'name-desc' ? 'text-indigo-650 bg-indigo-50/40 font-bold' : ''
                            }`}
                          >
                            <span>
                              {t.sortAlphabeticalDesc}
                            </span>
                            {sortBy === 'name-desc' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                          </button>

                          <button
                            onClick={() => {
                              setSortBy('date-desc');
                              setIsSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                              sortBy === 'date-desc' ? 'text-indigo-650 bg-indigo-50/40 font-bold' : ''
                            }`}
                          >
                            <span>
                              {t.sortDateDesc}
                            </span>
                            {sortBy === 'date-desc' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                          </button>

                          <button
                            onClick={() => {
                              setSortBy('date-asc');
                              setIsSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                              sortBy === 'date-asc' ? 'text-indigo-650 bg-indigo-50/40 font-bold' : ''
                            }`}
                          >
                            <span>
                              {t.sortDateAsc}
                            </span>
                            {sortBy === 'date-asc' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
                    {getNoFriendsMatchLabel(friendSearchQuery)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-12">
                {/* Clean inline SVG design representing travel note taking */}
                <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl mb-4">
                  <Globe className="h-8 w-8 animate-pulse" />
                </div>
                <h4 className="font-sans font-semibold text-slate-705 text-sm">{getNoFriendsInCountryHeader()}</h4>
                
                {/* Bigger, Center Add Friend Button */}
                <button
                  onClick={handleAddNewClick}
                  className="mt-6 w-full max-w-xs py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{getAddFriendLabel()}</span>
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
