import { useState, useEffect, useRef } from 'react';
import { Contact } from './types';
import WorldMap from './components/WorldMap';
import CountryDetails from './components/CountryDetails';
import Loader from './components/Loader';
import LoginView from './components/LoginView';
import SettingsDrawer from './components/SettingsDrawer';
import GuideTourModal from './components/GuideTourModal';
import confetti from 'canvas-confetti';
import { Globe, RefreshCw, Trash2, Heart, Download, Settings } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, googleProvider, signInWithPopup, signOut, OperationType, handleFirestoreError } from './firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { AppLanguage, TRANSLATIONS } from './utils/translations';
import { getCountryInfo } from './data/countries';

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
  const mapRef = useRef<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string>('');
  const [countryColors, setCountryColors] = useState<Record<string, string>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showGuideTour, setShowGuideTour] = useState(false);
  const [triggerGuideAfterLoad, setTriggerGuideAfterLoad] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('gloko_app_language');
    if (saved === 'en' || saved === 'es' || saved === 'fr' || saved === 'de' || saved === 'zh') {
      return saved as AppLanguage;
    }
    return 'en';
  });
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  const handleLanguageChange = (lang: AppLanguage) => {
    setShowSettingsDrawer(false);
    localStorage.setItem('gloko_app_language', lang);
    setLanguage(lang);
    if (user) {
      setHasLoaded(false);
      setTimeout(() => {
        setHasLoaded(true);
      }, 1300);
    }
  };

  // Track Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle tour popup when transition from the loading screen completes
  useEffect(() => {
    if (hasLoaded && isMapLoaded && triggerGuideAfterLoad) {
      setShowGuideTour(true);
      setTriggerGuideAfterLoad(false);
    }
  }, [hasLoaded, isMapLoaded, triggerGuideAfterLoad]);

  // Listen to keyboard dismissal & text input blur on mobile to reset viewport scale to 1.0 (reverses auto-zoom)
  useEffect(() => {
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        (target as HTMLInputElement).type !== 'checkbox' &&
        (target as HTMLInputElement).type !== 'radio' &&
        (target as HTMLInputElement).type !== 'color'
      ) {
        // Temporarily restrict scaling briefly then restore default configuration
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes');
          setTimeout(() => {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
          }, 350);
        }
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Prevent background body scrolling when modal/drawer overlays are open on mobile
  useEffect(() => {
    const shouldLock = !!selectedCountryId || showSettingsDrawer || showGuideTour;
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.position = 'relative';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [selectedCountryId, showSettingsDrawer, showGuideTour]);

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
          if (localStorage.getItem('gloko_no_demo') === 'true') {
            setContacts([]);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          } else {
            setContacts(DEFAULT_DEMO_CONTACTS);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_CONTACTS));
          }
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
        if (localStorage.getItem('gloko_no_demo') === 'true' || localStorage.getItem(`gloko_no_demo_${user.uid}`) === 'true') {
          setContacts([]);
          setHasLoaded(true);
          return;
        }
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
      setTriggerGuideAfterLoad(true);
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
      setShowUserMenu(false);
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
  const handleAddContact = async (contactData: Omit<Contact, 'id' | 'createdAt'>): Promise<string> => {
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
    return contactId;
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
    // Determine the country ID of the contact being deleted prior to deletion
    const contactToDelete = contacts.find((c) => c.id === id);
    const countryId = contactToDelete?.countryId ? contactToDelete.countryId.padStart(3, '0') : null;

    setConfirmConfig({
      isOpen: true,
      title: 'Remove Friend',
      message: 'Are you sure you want to remove this friend? Doing so will permanently remove their records from your travel map.',
      confirmLabel: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        if (user) {
          try {
            await deleteDoc(doc(db, 'contacts', id));
            // Reset color in Firestore if this was the last friend in that country
            if (countryId) {
              const otherCountryFriends = contacts.filter(
                (c) => c.countryId.padStart(3, '0') === countryId && c.id !== id
              );
              if (otherCountryFriends.length === 0) {
                const colorDocRef = doc(db, 'users', user.uid, 'colors', countryId);
                await deleteDoc(colorDocRef);
              }
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, `contacts/${id}`);
          }
        } else {
          const updated = contacts.filter((c) => c.id !== id);
          saveAndSyncContacts(updated);
          // Reset color in local storage if this was the last friend in that country
          if (countryId) {
            const otherCountryFriends = updated.filter(
              (c) => c.countryId.padStart(3, '0') === countryId
            );
            if (otherCountryFriends.length === 0) {
              const updatedColors = { ...countryColors };
              delete updatedColors[countryId];
              setCountryColors(updatedColors);
              try {
                localStorage.setItem('travel_contacts_map_country_colors', JSON.stringify(updatedColors));
              } catch (e) {
                console.error('Failed to save updated colors after filter:', e);
              }
            }
          }
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

  // Export friends book into a beautifully formatted CSV listed per country
  const handleExportCSV = () => {
    try {
      // Sort contacts by country name, then friend name
      const sortedContacts = [...contacts].sort((a, b) => {
        const countryCompare = (a.countryName || '').localeCompare(b.countryName || '');
        if (countryCompare !== 0) return countryCompare;
        return (a.name || '').localeCompare(b.name || '');
      });

      const escapeCSVCell = (val: string | undefined | null) => {
        if (!val) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = ["Country Name", "Country Code", "Friend Name", "City/Region", "Contact Info", "Notes", "Date Created"];
      const csvLines = [
        headers.join(','),
        ...sortedContacts.map((contact) => [
          escapeCSVCell(contact.countryName),
          escapeCSVCell(contact.countryId),
          escapeCSVCell(contact.name),
          escapeCSVCell(contact.city),
          escapeCSVCell(contact.contactInfo),
          escapeCSVCell(contact.notes),
          escapeCSVCell(contact.createdAt)
        ].join(','))
      ];

      const csvContent = "\uFEFF" + csvLines.join('\r\n'); // Add UTF-8 BOM for Microsoft Excel compatibility
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `gloko_friends_book_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV:', e);
    }
  };

  // Reset entire journal
  const handleResetJournal = () => {
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;
    setConfirmConfig({
      isOpen: true,
      title: t.confirmResetTitle,
      message: user ? t.confirmResetMessageUser : t.confirmResetMessageGuest,
      confirmLabel: t.resetEverything,
      isDestructive: true,
      onConfirm: async () => {
        // Set no demo flags to completely clear example inputs
        localStorage.setItem('gloko_no_demo', 'true');
        if (user) {
          localStorage.setItem(`gloko_no_demo_${user.uid}`, 'true');
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
            setContacts([]);
            setCountryColors({});
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, 'contacts-reset');
          }
        } else {
          saveAndSyncContacts([]);
          setCountryColors({});
          localStorage.removeItem('travel_contacts_map_country_colors');
          setSelectedCountryId(null);
        }

        // Add 1.4 seconds artificial delay so the user can easily see and register the beautiful loading button state
        await new Promise((resolve) => setTimeout(resolve, 1400));

        // Close settings drawer
        setShowSettingsDrawer(false);

        // Confetti effect is explicitly omitted here because the user dislikes it for reset.

        setConfirmConfig(null);
      }
    });
  };

  // Set of unique countries visited for metrics display
  const visitedCount = new Set(contacts.map((c) => c.countryId.padStart(3, '0'))).size;

  if (isAuthLoading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <LoginView
        onLogin={handleLogin}
        language={language}
        onLanguageChange={handleLanguageChange}
        isAuthLoading={isAuthLoading}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#d4e5f7] relative overflow-hidden antialiased text-slate-800 font-sans">
      
      {/* Immersive Map Background Layer */}
      <div className={`absolute inset-0 w-full h-full z-0 ${selectedCountryId ? 'pointer-events-none' : ''}`}>
        <WorldMap
          ref={mapRef}
          contacts={contacts}
          selectedCountryId={selectedCountryId}
          onSelectCountry={handleSelectCountry}
          countryColors={countryColors}
          onMapLoaded={() => setIsMapLoaded(true)}
          onLogoClick={() => {
            // Trigger immersive loading screen transition before centering
            setHasLoaded(false);
            setTimeout(() => {
              handleSelectCountry(null, '');
              mapRef.current?.resetView?.();
              setHasLoaded(true);
            }, 1250);
          }}
        />
      </div>

      {/* Absolute fullscreen loader overlay that sits on top when loading */}
      {(!hasLoaded || !isMapLoaded) && <Loader />}

      {/* Floating Settings Gear Menu TRIGGER on bottom-left */}
      {hasLoaded && isMapLoaded && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 pointer-events-auto">
          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="flex items-center justify-center w-10.5 h-10.5 sm:w-11 sm:h-11 bg-white hover:bg-slate-50 text-[#0a1e35] active:scale-95 rounded-full shadow-lg border border-slate-200 transition-all cursor-pointer group"
            title="Open Settings"
          >
            <Settings className="w-5.5 h-5.5 stroke-[1.6] text-slate-700 group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>
      )}

      {/* Left Hand Options Menu Drawer Container */}
      <SettingsDrawer
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        user={user}
        isAuthLoading={isAuthLoading}
        contacts={contacts}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onExportCSV={handleExportCSV}
        onResetJournal={handleResetJournal}
        language={language}
        onLanguageChange={handleLanguageChange}
        onShowGuide={() => setShowGuideTour(true)}
      />

      {/* Interactive Guide Tour Slides Deck Walkthrough Modal */}
      <GuideTourModal
        isOpen={showGuideTour}
        onClose={() => setShowGuideTour(false)}
        language={language}
      />

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
              countryName={getCountryInfo(selectedCountryId)?.name || selectedCountryName}
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
            onClick={() => {
              if (!isResetting) {
                setConfirmConfig(null);
              }
            }}
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
                disabled={isResetting}
                onClick={() => setConfirmConfig(null)}
                className={`px-4 py-2 text-slate-500 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isResetting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                }`}
              >
                {TRANSLATIONS[language]?.cancel || 'Cancel'}
              </button>
              <button
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await confirmConfig.onConfirm();
                  } catch (e) {
                    console.error("Confirm operation failed:", e);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 min-w-[100px] ${
                  isResetting
                    ? 'bg-amber-600 animate-pulse cursor-not-allowed'
                    : confirmConfig.isDestructive
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }`}
              >
                {isResetting ? (
                   <>
                     <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                     <span>
                       {language === 'es' ? 'Restableciendo...' : language === 'fr' ? 'Réinitialisation...' : language === 'de' ? 'Zurücksetzen...' : language === 'zh' ? '正在重置...' : 'Resetting...'}
                     </span>
                   </>
                ) : (
                  confirmConfig.confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
