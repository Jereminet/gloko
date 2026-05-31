import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Trash2, LogOut, Settings, ShieldAlert, Globe, ArrowRight } from 'lucide-react';
import { User } from 'firebase/auth';
import { Contact } from '../types';
import { AppLanguage, TRANSLATIONS } from '../utils/translations';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAuthLoading: boolean;
  contacts: Contact[];
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onExportCSV: () => void;
  onResetJournal: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  user,
  isAuthLoading,
  contacts,
  onLogin,
  onLogout,
  onExportCSV,
  onResetJournal,
  language,
  onLanguageChange,
}: SettingsDrawerProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Backdrop Dark Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Settings Drawer Panel sliding from the left hand side */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 left-0 h-full w-[310px] sm:w-[365px] bg-white border-r border-slate-200/90 shadow-2xl z-50 flex flex-col font-sans select-none overflow-hidden"
          >
            {/* Header Block with elegant brand look and close action (gear icon has standard weight, i.e., no bold) */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-100/80 rounded-xl text-slate-800">
                  <Settings className="w-5 h-5 stroke-[1.6]" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider leading-none">
                    {t.settings}
                  </h2>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Close settings"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Language Selection Selection Area */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-extrabold text-slate-4000/90 text-slate-400 uppercase tracking-widest leading-none">
                  {t.appLanguage}
                </h3>
                <div className="bg-slate-50/50 border border-slate-150/60 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Globe className="w-4 h-4 text-slate-450 stroke-[1.6]" />
                      <span>{t.languageSelect}</span>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
                      className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Profile / Account Integrations Area */}
              <div className="space-y-3.5">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  {t.userAccountSync}
                </h3>

                {isAuthLoading ? (
                  <div className="flex items-center justify-center py-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                  </div>
                ) : user ? (
                  <div className="bg-slate-50/50 border border-slate-150/60 rounded-2xl p-4 flex flex-col gap-3.5">
                    {/* User Identity Info */}
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="User profile"
                          className="w-11 h-11 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200/50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-750 font-extrabold flex items-center justify-center text-base shadow-sm border border-indigo-200/20">
                          {(user.displayName || 'T').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {user.displayName || 'Traveler'}
                        </div>
                        {user.email && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5 font-bold">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Firestore Sync Badge */}
                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                      <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t.cloudLocked}
                      </span>
                      <span className="text-[9px] text-[#0a1e35]/70 bg-[#d4e5f7]/40 border border-[#d4e5f7] px-2 py-0.5 font-extrabold uppercase tracking-widest rounded-md">
                        {t.synced}
                      </span>
                    </div>

                    {/* Logout Trigger Button (No harsh black backgrounds) */}
                    <button
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="w-full py-2.5 px-3 bg-red-50/55 hover:bg-red-50 hover:text-red-750 text-red-650 rounded-xl border border-red-100/60 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                      {t.signOut}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-slate-150/60 rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      {t.guestModeExplanation}
                    </p>
                    {/* Replaced bg-slate-900 dark theme with clean light borders to remove the dark button style */}
                    <button
                      onClick={() => {
                        onLogin();
                        onClose();
                      }}
                      className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.742-.08-1.302-.172-1.859H12.24z"/>
                      </svg>
                      {t.connectGoogle}
                    </button>
                  </div>
                )}
              </div>

              {/* CSV Export & Data Utilities */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  {t.dataUtilities}
                </h3>

                <div className="bg-slate-50/50 border border-slate-150/60 rounded-2xl p-4 space-y-3 hover:border-indigo-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shrink-0">
                      <Download className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {t.exportFriendsBook}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        {t.exportFriendsDesc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onExportCSV();
                      onClose();
                    }}
                    className="w-full text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-[#0a1e35] tracking-tight py-2 px-3 rounded-xl flex items-center justify-between transition-colors shadow-xs hover:shadow-sm cursor-pointer group"
                  >
                    <span>{t.downloadCsv}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest leading-none">
                  {t.dangerManagement}
                </h3>

                <div className="bg-red-50/15 border border-red-100 rounded-2xl p-4 gap-3 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-xl shrink-0">
                      <ShieldAlert className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-750">
                        {t.resetMapNetwork}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                        {t.resetMapDesc}
                      </p>
                    </div>
                  </div>

                  {/* On reset trigger, we do NOT run onClose() so the settings menu stays elegantly open in the background! */}
                  <button
                    onClick={() => {
                      onResetJournal();
                    }}
                    className="w-full text-xs font-black bg-red-600 hover:bg-red-700 hover:shadow text-white py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    {t.purgeAllFriends}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer metadata block */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center font-mono text-[9px] text-slate-400 font-bold select-none">
              {t.glokoBeta}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
