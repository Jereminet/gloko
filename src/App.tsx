import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Contact } from './types';
import WorldMap from './components/WorldMap';
import CountryDetails from './components/CountryDetails';
import Loader from './components/Loader';
import LoginView from './components/LoginView';
import SettingsDrawer from './components/SettingsDrawer';
import GuideTourModal from './components/GuideTourModal';
import OnboardingModal from './components/OnboardingModal';
import QRAddFriendModal from './components/QRAddFriendModal';
import FriendActivityModal, { FriendActivityInfo } from './components/FriendActivityModal';
import confetti from 'canvas-confetti';
import { Globe, RefreshCw, Trash2, Heart, Download, Settings, Bell, MapPin, Navigation } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, googleProvider, signInWithPopup, signOut, OperationType, handleFirestoreError } from './firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { AppLanguage, TRANSLATIONS } from './utils/translations';
import { getCountryInfo, COUNTRY_LIST } from './data/countries';
import { safeStorage } from './utils/storage';
import { playBubbleSound, playMinimizeSound, unlockAudioContext } from './utils/audio';

const LOCAL_STORAGE_KEY = 'travel_contacts_map_journal';

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
    const saved = safeStorage.getItem('gloko_app_language');
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

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQRConnect, setShowQRConnect] = useState(false);
  const [userHomeCountryId, setUserHomeCountryId] = useState<string>(() => {
    return safeStorage.getItem('gloko_user_country_id') || '840';
  });
  const [geolocationEnabled, setGeolocationEnabled] = useState<boolean>(() => {
    return safeStorage.getItem('gloko_geolocation_enabled') === 'true';
  });
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [pendingFriendActivity, setPendingFriendActivity] = useState<FriendActivityInfo | null>(null);

  // Refs for stable activity handling without false re-triggering
  const sessionStartTimeRef = useRef<number>(Date.now());
  const contactsRef = useRef<Contact[]>(contacts);
  contactsRef.current = contacts;
  const recentlyAddedFriendNamesRef = useRef<Set<string>>(new Set());

  // Play subtle bubble sound on button clicks, or minimizing sound on window exits (works seamlessly on desktop & mobile)
  useEffect(() => {
    // Unlock AudioContext on first touch/interaction on mobile browsers
    const handleInitialUnlock = () => {
      unlockAudioContext();
    };
    window.addEventListener('touchstart', handleInitialUnlock, { once: true, passive: true });
    window.addEventListener('touchend', handleInitialUnlock, { once: true, passive: true });
    window.addEventListener('pointerdown', handleInitialUnlock, { once: true, passive: true });

    const handleGlobalInteraction = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if clicking a backdrop or close/exit element
      const isBackdrop = target.classList?.contains('backdrop-blur-xs') || target.classList?.contains('backdrop-blur-sm') || target.classList?.contains('backdrop-blur-md');
      const closeBtn = target.closest('button[title*="Close" i], button[title*="Dismiss" i], [aria-label*="close" i], button[data-exit="true"]');
      if (isBackdrop || closeBtn) {
        playMinimizeSound();
        return;
      }

      const button = target.closest('button, [role="button"]');
      if (!button) return;
      // Skip bubble sound if clicking the ping button (ping button has its own bell chime sound effect)
      if (button.getAttribute('data-ping-button') === 'true') {
        return;
      }
      playBubbleSound();
    };

    window.addEventListener('click', handleGlobalInteraction, { capture: true });
    return () => {
      window.removeEventListener('touchstart', handleInitialUnlock);
      window.removeEventListener('touchend', handleInitialUnlock);
      window.removeEventListener('pointerdown', handleInitialUnlock);
      window.removeEventListener('click', handleGlobalInteraction, { capture: true });
    };
  }, []);

  // Prevent pop-up overlaps: clear focused country on map when any modal or drawer opens
  useEffect(() => {
    if (showSettingsDrawer || showGuideTour || showQRConnect || selectedCountryId) {
      mapRef.current?.clearFocusedCountry?.();
    }
  }, [showSettingsDrawer, showGuideTour, showQRConnect, selectedCountryId]);

  const handleLanguageChange = (lang: AppLanguage) => {
    setShowSettingsDrawer(false);
    safeStorage.setItem('gloko_app_language', lang);
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

  // Notification helper (no-op: black feed pop-ups completely removed)
  const showNotification = (_message?: string, _type?: 'info' | 'success' | 'ping', _friendName?: string) => {};

  // Onboarding first-time connection check
  useEffect(() => {
    if (hasLoaded && isMapLoaded && user) {
      const completed = safeStorage.getItem('gloko_onboarding_completed');
      if (completed !== 'true') {
        setShowOnboarding(true);
      }
    }
  }, [hasLoaded, isMapLoaded, user]);

  // Listen to live system pings from other users (authenticated mode only)
  useEffect(() => {
    if (!user) return;
    let isInitialPingsSnapshot = true;
    const pingsQuery = query(collection(db, 'pings'), where('status', '==', 'unread'));
    const unsubscribe = onSnapshot(pingsQuery, (snapshot) => {
      if (isInitialPingsSnapshot) {
        // Suppress past history notifications upon connection
        isInitialPingsSnapshot = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data && data.fromUserId !== user.uid) {
            showNotification(`🌐 ${data.fromUserName} sent a travel Ping to ${data.toContactName}!`, 'info');
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pings');
    });
    return () => unsubscribe();
  }, [user]);

  // Listen to live friend additions / deletions from other accounts
  useEffect(() => {
    if (!user) return;
    let isInitialActivitiesSnapshot = true;
    const activitiesQuery = collection(db, 'friend_activities');
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      if (isInitialActivitiesSnapshot) {
        // Suppress past history actions upon connection
        isInitialActivitiesSnapshot = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Ignore own activities
          if (!data || data.fromUserId === user.uid) return;

          // Ignore activities created before current session started
          if (data.createdAt) {
            const createdAtTime = new Date(data.createdAt).getTime();
            if (!isNaN(createdAtTime) && createdAtTime < sessionStartTimeRef.current - 5000) {
              return;
            }
          }

          const friendNameLower = (data.fromUserName || '').trim().toLowerCase();

          if (data.type === 'added') {
            // Check if this friend is already in our contacts book
            const alreadyFriend = contactsRef.current.some(
              (c) => c.name.toLowerCase() === friendNameLower
            );
            if (!alreadyFriend) {
              setPendingFriendActivity({
                type: 'added',
                friendName: data.fromUserName || 'GLOKO Traveler',
                countryId: String(data.countryId || '840').padStart(3, '0'),
                countryName: data.countryName || 'Global',
                city: data.city || '',
                contactInfo: data.contactInfo || '',
                notes: data.notes || 'Added you via GLOKO Network',
              });
            }
          } else if (data.type === 'deleted') {
            // A mutual friend has removed their connection - notify the user and allow mutual removal
            const existing = contactsRef.current.find((c) => {
              const nameMatch = c.name.trim().toLowerCase() === friendNameLower;
              const contactMatch = Boolean(
                data.contactInfo && c.contactInfo && c.contactInfo.trim().toLowerCase() === data.contactInfo.trim().toLowerCase()
              );
              const noteMatch = Boolean(
                data.notes && c.name.trim().toLowerCase() === data.notes.trim().toLowerCase()
              );
              return nameMatch || contactMatch || noteMatch;
            });

            if (existing) {
              const existingAddedTime = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
              const activityCreatedTime = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();

              // Only trigger if deletion occurred after friendship was established
              if (!existingAddedTime || activityCreatedTime >= existingAddedTime - 5000) {
                setPendingFriendActivity({
                  type: 'deleted',
                  friendName: existing.name || data.fromUserName || 'Friend',
                  countryId: existing.countryId,
                  countryName: existing.countryName,
                  city: existing.city,
                  existingContactId: existing.id,
                });
              }
            }
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friend_activities');
    });
    return () => unsubscribe();
  }, [user]);

  // Finish onboarding handler
  const handleOnboardingComplete = async (countryId: string, enableGeolocation: boolean) => {
    safeStorage.setItem('gloko_onboarding_completed', 'true');
    safeStorage.setItem('gloko_user_country_id', countryId);
    safeStorage.setItem('gloko_geolocation_enabled', String(enableGeolocation));
    setUserHomeCountryId(countryId);
    setGeolocationEnabled(enableGeolocation);
    setShowOnboarding(false);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'profile'), {
          homeCountryId: countryId,
          geolocationEnabled: enableGeolocation,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/settings/profile`);
      }
    }

    const country = COUNTRY_LIST.find(c => c.id === countryId);
    if (country) {
      showNotification(`📍 Home country set to ${country.flag} ${country.name}!`, 'success');
    }
  };

  // Ping a friend handler
  const handlePingFriend = async (contact: Contact) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio autoplay restrictions or unsupported
    }

    if (user) {
      const pingId = `ping-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      try {
        await setDoc(doc(db, 'pings', pingId), {
          id: pingId,
          fromUserId: user.uid,
          fromUserName: user.displayName || user.email?.split('@')[0] || "A Gloko Friend",
          toContactName: contact.name,
          toContactId: contact.id,
          createdAt: new Date().toISOString(),
          status: 'unread'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `pings/${pingId}`);
      }
    }
  };

  // Add friend from QR scan handler
  const handleAddFriendFromQR = async (friendData: {
    name: string;
    countryId: string;
    city: string;
    contact: string;
    notes: string;
    geolocationEnabled?: boolean;
    liveCountryId?: string;
  }) => {
    // Record as recently added friend to prevent any false deletion popup
    recentlyAddedFriendNamesRef.current.add(friendData.name.trim().toLowerCase());
    if (pendingFriendActivity?.friendName.trim().toLowerCase() === friendData.name.trim().toLowerCase()) {
      setPendingFriendActivity(null);
    }

    const country = COUNTRY_LIST.find(c => c.id === friendData.countryId);
    await handleAddContact({
      name: friendData.name,
      countryId: friendData.countryId,
      countryName: country?.name || 'Unknown',
      city: friendData.city,
      contactInfo: friendData.contact,
      notes: friendData.notes,
      geolocationEnabled: friendData.geolocationEnabled !== undefined ? friendData.geolocationEnabled : true,
      liveCountryId: friendData.liveCountryId || friendData.countryId,
    });
    showNotification(`💖 Successfully added ${friendData.name} as a friend!`, 'success');
  };

  // Handle mutual Add-Back from incoming friend activity pop-up
  const handleAddBackFriend = async (activity: FriendActivityInfo) => {
    const country = COUNTRY_LIST.find((c) => c.id === activity.countryId);
    await handleAddContact({
      name: activity.friendName,
      countryId: activity.countryId,
      countryName: country?.name || activity.countryName || 'Global',
      city: activity.city || '',
      contactInfo: activity.contactInfo || '',
      notes: activity.notes || 'Added back via GLOKO mutual friend link',
    });
    showNotification(`🤝 Added ${activity.friendName} back to your travel book!`, 'success');
  };

  // Handle mutual Remove-Back from incoming friend deletion pop-up
  const handleRemoveBackFriend = async (contactId: string) => {
    const friend = contacts.find((c) => c.id === contactId);
    const friendName = friend?.name || 'Friend';
    await handleDeleteContact(contactId);
    showNotification(`🗑️ Removed ${friendName} from your travel book.`, 'info');
  };

  // Simulation helpers for testing the incoming mutual friend flows
  const handleSimulateIncomingAdd = () => {
    const demoTravelers = [
      { name: 'Elena Rostova', countryId: '380', countryName: 'Ukraine', city: 'Kyiv', contactInfo: '@elena_travels', notes: 'Met during summer trip' },
      { name: 'Mateo Silva', countryId: '076', countryName: 'Brazil', city: 'Rio de Janeiro', contactInfo: 'mateo@rio.br', notes: 'Met on hiking trail' },
      { name: 'Amara Okafor', countryId: '566', countryName: 'Nigeria', city: 'Lagos', contactInfo: 'amara@tech.ng', notes: 'Shared a photography tour' },
      { name: 'Liam O’Connor', countryId: '372', countryName: 'Ireland', city: 'Dublin', contactInfo: '@liam_music', notes: 'Met at traditional pub' },
    ];
    // Pick one that is not in current contacts
    const available = demoTravelers.filter(t => !contacts.some(c => c.name.toLowerCase() === t.name.toLowerCase()));
    const chosen = available.length > 0 ? available[0] : {
      name: `Traveler ${Math.floor(Math.random() * 1000)}`,
      countryId: '250',
      countryName: 'France',
      city: 'Paris',
      contactInfo: 'traveler@gloko.app',
      notes: 'Added you to their GLOKO book'
    };

    setPendingFriendActivity({
      type: 'added',
      friendName: chosen.name,
      countryId: chosen.countryId,
      countryName: chosen.countryName,
      city: chosen.city,
      contactInfo: chosen.contactInfo,
      notes: chosen.notes,
    });
  };

  const handleSimulateIncomingDelete = () => {
    if (contacts.length === 0) {
      showNotification('💡 Add at least one friend to test the deletion activity pop-up!', 'info');
      return;
    }
    const randomFriend = contacts[Math.floor(Math.random() * contacts.length)];
    setPendingFriendActivity({
      type: 'deleted',
      friendName: randomFriend.name,
      countryId: randomFriend.countryId,
      countryName: randomFriend.countryName,
      city: randomFriend.city,
      existingContactId: randomFriend.id,
    });
  };

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
        const stored = safeStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const nonDemo = Array.isArray(parsed) ? parsed.filter((c: any) => !c.id?.startsWith('demo-')) : [];
          setContacts(nonDemo);
        } else {
          setContacts([]);
          safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
        }

        const storedColors = safeStorage.getItem('travel_contacts_map_country_colors');
        if (storedColors) {
          setCountryColors(JSON.parse(storedColors));
        } else {
          setCountryColors({});
        }
      } catch (e) {
        console.error('Error loading startup state from localStorage:', e);
        setContacts([]);
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
        const data = docSnap.data() as Contact;
        if (!data.id?.startsWith('demo-')) {
          fetchedContacts.push(data);
        }
      });

      // No sample data for fresh new accounts
      setContacts(fetchedContacts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
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

    // Subscribe to user onboarding settings/profile
    const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'profile');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.homeCountryId) {
          setUserHomeCountryId(data.homeCountryId);
          safeStorage.setItem('gloko_user_country_id', data.homeCountryId);
        }
        if (data.geolocationEnabled !== undefined) {
          setGeolocationEnabled(data.geolocationEnabled);
          safeStorage.setItem('gloko_geolocation_enabled', String(data.geolocationEnabled));
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/settings/profile`);
    });

    return () => {
      unsubscribeContacts();
      unsubscribeColors();
      unsubscribeSettings();
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
      safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write to safeStorage:', e);
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
        safeStorage.setItem('travel_contacts_map_country_colors', JSON.stringify(updatedColors));
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
    const paddedCountryId = String(contactData.countryId || '840').padStart(3, '0');
    const safeCountry = COUNTRY_LIST.find((c) => c.id === paddedCountryId);
    const countryName = String(contactData.countryName || safeCountry?.name || 'Global').slice(0, 100);

    const safeContact: Contact = {
      id: contactId,
      name: String(contactData.name || 'Friend').trim().slice(0, 100),
      countryId: paddedCountryId,
      countryName,
      city: String(contactData.city || '').slice(0, 100),
      contactInfo: String(contactData.contactInfo || '').slice(0, 200),
      notes: String(contactData.notes || '').slice(0, 5000),
      createdAt,
      geolocationEnabled: Boolean(contactData.geolocationEnabled ?? true),
      liveCountryId: String(contactData.liveCountryId || paddedCountryId).padStart(3, '0'),
      photoUrl: contactData.photoUrl ? String(contactData.photoUrl).slice(0, 524288) : undefined,
    };

    if (user) {
      const newContact: Contact = {
        ...safeContact,
        userId: user.uid,
      };
      // Optimistically update contacts state immediately
      setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== contactId)]);
      saveAndSyncContacts([newContact, ...contacts.filter((c) => c.id !== contactId)]);

      const cleanContact: Record<string, any> = {
        id: newContact.id,
        userId: user.uid,
        name: newContact.name,
        countryId: newContact.countryId,
        countryName: newContact.countryName,
        createdAt: newContact.createdAt,
        city: newContact.city,
        contactInfo: newContact.contactInfo,
        notes: newContact.notes,
        geolocationEnabled: newContact.geolocationEnabled,
        liveCountryId: newContact.liveCountryId,
      };
      if (newContact.photoUrl) {
        cleanContact.photoUrl = newContact.photoUrl;
      }

      try {
        await setDoc(doc(db, 'contacts', contactId), cleanContact);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `contacts/${contactId}`);
      }

      // Broadcast addition activity safely
      try {
        const activityId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'friend_activities', activityId), {
          id: activityId,
          fromUserId: user.uid,
          fromUserName: user.displayName || user.email?.split('@')[0] || 'GLOKO Friend',
          countryId: userHomeCountryId || paddedCountryId,
          countryName: getCountryInfo(userHomeCountryId || paddedCountryId)?.name || 'Global',
          type: 'added',
          city: safeContact.city || '',
          contactInfo: user.email || '',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Non-critical broadcast
      }
    } else {
      const updated = [safeContact, ...contacts];
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
            // Broadcast deletion activity so mutual friend connections can receive the removal pop-up
            const activityId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const deleterName = user.displayName || user.email?.split('@')[0] || 'GLOKO Friend';
            const deletionPayload: Record<string, any> = {
              id: activityId,
              fromUserId: user.uid,
              fromUserName: deleterName.slice(0, 100),
              countryId: String(countryId || '840').padStart(3, '0'),
              countryName: String(contactToDelete?.countryName || 'Global').slice(0, 100),
              type: 'deleted',
              createdAt: new Date().toISOString(),
            };
            if (contactToDelete?.name) {
              deletionPayload.notes = contactToDelete.name.slice(0, 500);
            }
            if (contactToDelete?.contactInfo && contactToDelete.contactInfo.includes('@')) {
              deletionPayload.toUserEmail = contactToDelete.contactInfo.slice(0, 150);
            }
            if (user.email) {
              deletionPayload.contactInfo = user.email.slice(0, 200);
            }
            await setDoc(doc(db, 'friend_activities', activityId), deletionPayload);
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
                safeStorage.setItem('travel_contacts_map_country_colors', JSON.stringify(updatedColors));
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
        safeStorage.setItem('gloko_no_demo', 'true');
        if (user) {
          safeStorage.setItem(`gloko_no_demo_${user.uid}`, 'true');
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
          safeStorage.removeItem('travel_contacts_map_country_colors');
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

  // Helper to resolve a contact's display country in fixed mode
  const getDisplayCountryId = (contact: Contact): string => {
    if (contact.homeCountryId) {
      return contact.homeCountryId;
    }
    return contact.countryId;
  };

  const displayedContacts = contacts.map(c => ({
    ...c,
    countryId: getDisplayCountryId(c),
    city: c.city,
  }));

  // Set of unique countries visited for metrics display
  const visitedCount = new Set(
    displayedContacts
      .filter((c) => c.countryId)
      .map((c) => c.countryId.padStart(3, '0'))
  ).size;

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
          contacts={displayedContacts}
          selectedCountryId={selectedCountryId}
          onSelectCountry={handleSelectCountry}
          countryColors={countryColors}
          onMapLoaded={() => setIsMapLoaded(true)}
          userHomeCountryId={userHomeCountryId}
          userGeolocationEnabled={geolocationEnabled}
          isLiveMode={isLiveMode}
          onToggleLiveMode={() => {
            setIsLiveMode((prev) => {
              const next = !prev;
              if (next) {
                // When switching to live mode, close selected country popup
                handleSelectCountry(null, '');
              }
              return next;
            });
          }}
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
        onClose={() => {
          playMinimizeSound();
          setShowSettingsDrawer(false);
        }}
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
        onOpenQRConnect={() => setShowQRConnect(true)}
        onSimulateIncomingAdd={handleSimulateIncomingAdd}
        onSimulateIncomingDelete={handleSimulateIncomingDelete}
        userHomeCountryId={userHomeCountryId}
        geolocationEnabled={geolocationEnabled}
      />

      {/* Interactive Guide Tour Slides Deck Walkthrough Modal */}
      <GuideTourModal
        isOpen={showGuideTour}
        onClose={() => {
          playMinimizeSound();
          setShowGuideTour(false);
        }}
        language={language}
      />

      {/* Center Dialog Popup for Selected Country */}
      {selectedCountryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => {
              playMinimizeSound();
              handleSelectCountry(null, '');
            }}
          />

          {/* Centered Modal Card Container */}
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl h-[88vh] sm:h-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            <CountryDetails
              countryId={selectedCountryId}
              countryName={getCountryInfo(selectedCountryId)?.name || selectedCountryName}
              contacts={displayedContacts}
              isLiveMode={isLiveMode}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onPing={handlePingFriend}
              onBack={() => {
                playMinimizeSound();
                handleSelectCountry(null, '');
              }}
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

      {/* Onboarding Setup Modal Popup upon First Connection */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onComplete={handleOnboardingComplete}
          />
        )}
      </AnimatePresence>

      {/* QR Code Connect Friend Modal Popup */}
      <AnimatePresence>
        {showQRConnect && (
          <QRAddFriendModal
            isOpen={showQRConnect}
            onClose={() => {
              playMinimizeSound();
              setShowQRConnect(false);
            }}
            currentUser={user}
            homeCountryId={userHomeCountryId}
            userGeolocationEnabled={geolocationEnabled}
            onAddFriendFromQR={handleAddFriendFromQR}
          />
        )}
      </AnimatePresence>

      {/* Reciprocal / Mutual Friend Activity Modal Popup (Incoming Add or Delete) */}
      <AnimatePresence>
        {pendingFriendActivity && (
          <FriendActivityModal
            isOpen={!!pendingFriendActivity}
            activity={pendingFriendActivity}
            onClose={() => {
              playMinimizeSound();
              setPendingFriendActivity(null);
            }}
            onAddBack={handleAddBackFriend}
            onRemoveBack={handleRemoveBackFriend}
          />
        )}
      </AnimatePresence>



    </div>
  );
}
