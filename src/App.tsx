import { useState, useEffect } from 'react';
import { Contact } from './types';
import WorldMap from './components/WorldMap';
import CountryDetails from './components/CountryDetails';
import { Globe, RefreshCw, Trash2, Heart, Download } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, googleProvider, signInWithPopup, signOut, OperationType, handleFirestoreError } from './firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'travel_contacts_map_journal';

// Helper to compile elegant default demo contacts on first setup
const DEFAULT_DEMO_CONTACTS: Contact[] = [
  {
    id: 'demo-yuki',
    name: 'Yuki Tanaka',
    countryId: '392', // Japan
    countryName: 'Japan',
    city: 'Kyoto',
    contactInfo: '@yuki_travels',
    photoUrl: undefined,
    notes: 'Met during a tea ceremony in Kyoto! Incredible local guide who showed us hidden bamboo paths in Arashiyama.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: 'demo-lucas',
    name: 'Lucas Dubois',
    countryId: '250', // France
    countryName: 'France',
    city: 'Paris',
    contactInfo: 'lucas.d@email.com',
    photoUrl: undefined,
    notes: 'Landscape photographer. Met him at a small vintage cafe near Montmartre. Exchanged great tips for capturing golden hour photos around the Seine.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  {
    id: 'demo-sophia',
    name: 'Sophia Ramirez',
    countryId: '840', // USA
    countryName: 'United States',
    city: 'Austin, TX',
    contactInfo: '+1 512-555-0143',
    photoUrl: undefined,
    notes: 'Super funny road trip companion! Hosted me in Austin and made the absolute best street tacos under the stars.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string>('');
  const [countryColors, setCountryColors] = useState<Record<string, string>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  // Track Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state from LocalStorage (Guest Mode) or Cloud Firestore (Cloud Sync Mode)
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      // Unauthenticated Mode (Local sandbox)
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setContacts(JSON.parse(stored));
        } else {
          setContacts(DEFAULT_DEMO_CONTACTS);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_CONTACTS));
        }

        const storedColors = localStorage.getItem('travel_contacts_map_country_colors');
        if (storedColors) {
          setCountryColors(JSON.parse(storedColors));
        } else {
          setCountryColors({});
        }
      } catch (e) {
        console.error('Error loading startup state from localStorage:', e);
        setContacts(DEFAULT_DEMO_CONTACTS);
      } finally {
        setHasLoaded(true);
      }
      return;
    }

    // Authenticated Mode (Full Cloud integration)
    setHasLoaded(false);

    // Subscribe to contacts
    const contactsQuery = query(collection(db, 'contacts'), where('userId', '==', user.uid));
    const unsubscribeContacts = onSnapshot(contactsQuery, async (snapshot) => {
      const fetchedContacts: Contact[] = [];
      snapshot.forEach((docSnap) => {
        fetchedContacts.push(docSnap.data() as Contact);
      });

      // Boostrap zero-state user profiles automatically with demo items
      if (fetchedContacts.length === 0) {
        try {
          for (const demoContact of DEFAULT_DEMO_CONTACTS) {
            const cloudContact = { 
              ...demoContact, 
              id: `${demoContact.id}-${user.uid.substring(0, 5)}`,
              userId: user.uid 
            };
            const cleanCloudContact = JSON.parse(JSON.stringify(cloudContact));
            await setDoc(doc(db, 'contacts', cloudContact.id), cleanCloudContact);
          }
        } catch (e) {
          console.error("Error setting up initial demo data under user account:", e);
        }
      } else {
        // Sort contacts by date downloaded/saved
        setContacts(fetchedContacts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
      setHasLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'contacts');
    });

    // Subscribe to user custom colors
    const colorsCollection = collection(db, 'users', user.uid, 'colors');
    const unsubscribeColors = onSnapshot(colorsCollection, (snapshot) => {
      const fetchedColors: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.color) {
          fetchedColors[docSnap.id] = data.color;
        }
      });
      setCountryColors(fetchedColors);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/colors`);
    });

    return () => {
      unsubscribeContacts();
      unsubscribeColors();
    };
  }, [user, isAuthLoading]);

  // Auth Action handlers
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in operation failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setContacts([]);
      setCountryColors({});
      setSelectedCountryId(null);
    } catch (error) {
      console.error('Sign-out operation failed:', error);
    }
  };

  // Sync state helpers
  const saveAndSyncContacts = (updated: Contact[]) => {
    setContacts(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  };

  const handleSaveCountryColor = async (countryId: string, color: string) => {
    if (user) {
      const colorDocRef = doc(db, 'users', user.uid, 'colors', countryId);
      try {
        await setDoc(colorDocRef, {
          userId: user.uid,
          countryId,
          color
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/colors/${countryId}`);
      }
    } else {
      const updatedColors = { ...countryColors, [countryId]: color };
      setCountryColors(updatedColors);
      try {
        localStorage.setItem('travel_contacts_map_country_colors', JSON.stringify(updatedColors));
      } catch (e) {
        console.error('Failed to write country colors details:', e);
      }
    }
  };

  // Select country handler
  const handleSelectCountry = (countryId: string | null, countryName: string) => {
    setSelectedCountryId(countryId);
    setSelectedCountryName(countryName);
  };

  // Add Contact
  const handleAddContact = async (contactData: Omit<Contact, 'id' | 'createdAt'>) => {
    const contactId = `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();

    if (user) {
      const newContact: Contact = {
        ...contactData,
        id: contactId,
        userId: user.uid,
        createdAt,
      };
      const cleanContact = JSON.parse(JSON.stringify(newContact));
      try {
        await setDoc(doc(db, 'contacts', contactId), cleanContact);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `contacts/${contactId}`);
      }
    } else {
      const newContact: Contact = {
        ...contactData,
        id: contactId,
        createdAt,
      };
      const updated = [newContact, ...contacts];
      saveAndSyncContacts(updated);
    }
  };

  // Update Contact
  const handleUpdateContact = async (updatedContact: Contact) => {
    if (user) {
      const contactWithUser = { ...updatedContact, userId: user.uid };
      const cleanContact = JSON.parse(JSON.stringify(contactWithUser));
      try {
        await setDoc(doc(db, 'contacts', updatedContact.id), cleanContact);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `contacts/${updatedContact.id}`);
      }
    } else {
      const updated = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c));
      saveAndSyncContacts(updated);
    }
  };

  // Delete Contact
  const handleDeleteContact = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Connection',
      message: 'Are you sure you want to delete this connection? Doing so will permanently remove their records from your travel map.',
      confirmLabel: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        if (user) {
          try {
            await deleteDoc(doc(db, 'contacts', id));
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, `contacts/${id}`);
          }
        } else {
          const updated = contacts.filter((c) => c.id !== id);
          saveAndSyncContacts(updated);
        }
        setConfirmConfig(null);
      }
    });
  };

  // Export journal logs
  const handleExportJournal = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `travels_contact_journal_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset entire journal
  const handleResetJournal = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reset Map Data',
      message: user 
        ? 'Are you sure you want to reset your travel network? This will clear all custom database entries, clear custom colors, and restore the initial example contacts.'
        : 'Are you sure you want to reset your travel network? This will restore the initial examples, clear all custom colors, and clear all custom entries!',
      confirmLabel: 'Reset Everything',
      isDestructive: true,
      onConfirm: async () => {
        if (user) {
          try {
            // 1. Fetch current contacts
            const q = query(collection(db, 'contacts'), where('userId', '==', user.uid));
            const qSnapshot = await getDocs(q);
            for (const document of qSnapshot.docs) {
              await deleteDoc(doc(db, 'contacts', document.id));
            }
            // 2. Clear custom country colors
            const colorsCol = collection(db, 'users', user.uid, 'colors');
            const colSnapshot = await getDocs(colorsCol);
            for (const document of colSnapshot.docs) {
              await deleteDoc(doc(db, 'users', user.uid, 'colors', document.id));
            }
            // 3. Clear selected country selection
            setSelectedCountryId(null);
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, 'contacts-reset');
          }
        } else {
          saveAndSyncContacts(DEFAULT_DEMO_CONTACTS);
          setCountryColors({});
          localStorage.removeItem('travel_contacts_map_country_colors');
          setSelectedCountryId(null);
        }
        setConfirmConfig(null);
      }
    });
  };

  if (!hasLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4" />
        <h3 className="text-sm font-semibold text-slate-600">Loading Traveler Passport...</h3>
      </div>
    );
  }

  // Set of unique countries visited for metrics display
  const visitedCount = new Set(contacts.map((c) => c.countryId.padStart(3, '0'))).size;

  return (
    <div className="h-screen w-screen bg-[#F9FAFB] flex flex-col overflow-hidden antialiased text-slate-800 font-sans">
      {/* Top Navigation Frame */}
      <header className="h-20 border-b border-slate-200 bg-white sticky top-0 z-30 shrink-0">
        <div className="w-full h-full px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handleSelectCountry(null, '')}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/favicon.png" 
                alt="Gloko Logo" 
                className="w-8 h-8 object-contain rounded-lg"
              />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 select-none">
              Gloko
            </h1>
          </div>

          {/* Action Header Panel */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/80 p-1 sm:p-1.5 pl-2.5 sm:pl-3.5 pr-1.5 sm:pr-2 rounded-full shadow-xs animate-in fade-in duration-200 select-none">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-850 line-clamp-1 max-w-[80px] sm:max-w-[120px]">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Traveler'}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1 justify-end leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sync
                  </span>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User Profile" 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-750 font-bold flex items-center justify-center text-xs shadow-xs">
                    {(user.displayName || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 hover:bg-red-50 text-red-550 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-transparent hover:border-red-100 shrink-0 select-none"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <span className="hidden md:inline text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mr-1.5">
                  Guest Mode
                </span>
                <button
                  onClick={handleLogin}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full text-xs font-extrabold tracking-tight shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 border border-slate-800"
                >
                  <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.742-.08-1.302-.172-1.859H12.24z"/>
                  </svg>
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame takes 100% full-width style edges */}
      <main className="flex-1 w-full flex flex-col overflow-hidden relative">
        <div className="w-full flex-grow flex-1 flex flex-col relative min-h-0">
          <WorldMap
            contacts={contacts}
            selectedCountryId={selectedCountryId}
            onSelectCountry={handleSelectCountry}
            countryColors={countryColors}
          />
        </div>
      </main>

      {/* Center Dialog Popup for Selected Country */}
      {selectedCountryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => handleSelectCountry(null, '')}
          />

          {/* Centered Modal Card Container */}
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl h-[88vh] sm:h-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            <CountryDetails
              countryId={selectedCountryId}
              countryName={selectedCountryName}
              contacts={contacts}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onBack={() => handleSelectCountry(null, '')}
              currentColor={countryColors[selectedCountryId]}
              onColorChange={(color) => handleSaveCountryColor(selectedCountryId, color)}
            />
          </div>
        </div>
      )}

      {/* Elegant Custom Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setConfirmConfig(null)}
          />

          {/* Centered Confirmation Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-205 p-6 w-full max-w-md flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 z-[110] text-slate-800">
            <h3 className="font-sans font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
              {confirmConfig.isDestructive ? (
                <span className="text-red-500">⚠️</span>
              ) : (
                <span className="text-indigo-500">ℹ️</span>
              )}
              {confirmConfig.title}
            </h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              {confirmConfig.message}
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md ${
                  confirmConfig.isDestructive
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }`}
              >
                {confirmConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="h-12 border-t border-slate-200 bg-white px-4 sm:px-10 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest shrink-0 select-none">
        <span>© 2026 Mappa Mundi</span>
        <div className="flex gap-4 sm:gap-6 items-center">
          <span className="hidden sm:inline">Syncing with Cloud...</span>
          <span className="text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer" onClick={() => handleSelectCountry(null, '')}>
            View Summary Stats
          </span>
        </div>
      </footer>
    </div>
  );
}
