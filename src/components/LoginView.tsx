import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { AppLanguage } from '../utils/translations';

interface LoginViewProps {
  onLogin: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  isAuthLoading: boolean;
}

const SUBTITLES: Record<AppLanguage, string> = {
  en: "Never lose track of those nice travel buddies you want to see again",
  es: "Nunca pierdas la pista de esos queridos compañeros de viaje que deseas volver a ver.",
  fr: "Gardez toujours la trace de ces formidables compagnons de voyage que vous aimeriez revoir.",
  de: "Verlieren Sie nie wieder den Kontakt zu den netten Reisefreunden, die Sie gerne wiedersehen möchten.",
  zh: "永远不要和你想再次见面的那些美好旅伴失去联系。"
};

const TERMS_NOTICE: Record<AppLanguage, string> = {
  en: "Secure cloud authentication via Google. No passwords required.",
  es: "Autenticación segura en la nube mediante Google. Sin contraseñas.",
  fr: "Authentification cloud sécurisée par Google. Sans mot de passe.",
  de: "Sichere Cloud-Authentifizierung über Google. Ohne Passwort.",
  zh: "经由 Google 进行安全的云端认证，无需输入密码。"
};

export default function LoginView({
  onLogin,
  language,
  onLanguageChange,
  isAuthLoading,
}: LoginViewProps) {
  return (
    <div className="fixed inset-0 min-h-screen bg-[#d4e5f7] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* Fixed map representation from the main menu, beautifully blurred */}
      <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
        <svg 
          className="w-full h-full opacity-55 scale-105" 
          viewBox="0 0 1000 500" 
          preserveAspectRatio="xMidYMid slice"
          style={{ filter: 'blur(8px)' }}
        >
          {/* North America */}
          <path d="M 120,80 L 150,60 L 220,50 L 250,70 L 280,60 L 290,110 L 250,130 L 220,130 L 180,180 L 190,200 L 170,250 L 140,230 L 160,195 L 140,160 L 110,140 L 100,110 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 270,30 L 310,25 L 340,35 L 320,60 L 280,60 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" /> {/* Greenland */}
          
          {/* South America */}
          <path d="M 170,260 L 190,265 L 225,290 L 250,330 L 230,390 L 210,430 L 195,450 L 190,440 L 190,400 L 170,340 L 160,290 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          
          {/* Africa */}
          <path d="M 420,185 L 450,180 L 490,190 L 510,220 L 530,240 L 535,270 L 510,320 L 490,350 L 475,340 L 470,295 L 440,280 L 415,240 L 405,200 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 535,310 L 545,315 L 540,340 L 532,335 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" /> {/* Madagascar */}

          {/* Eurasia (Europe + Asia) */}
          <path d="M 390,150 L 390,120 L 420,100 L 450,60 L 500,50 L 600,45 L 750,45 L 820,60 L 850,90 L 840,130 L 810,160 L 830,190 L 790,210 L 760,180 L 730,225 L 680,240 L 660,190 L 610,200 L 580,235 L 560,200 L 521,215 L 480,180 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          
          {/* Australia & Oceania */}
          <path d="M 720,330 L 750,320 L 790,340 L 780,380 L 740,380 L 710,350 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 795,395 L 805,405 L 810,395 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" /> {/* New Zealand */}
          
          {/* Great Britain & Iceland */}
          <path d="M 380,85 L 390,95 L 380,105 L 375,95 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 330,65 L 345,60 L 340,75 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
        </svg>
      </div>

      {/* Floating Language Dropdown on Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
          className="bg-white/80 backdrop-blur-md text-xs font-bold text-slate-700 px-3.5 py-2 border border-slate-200/80 rounded-xl shadow-xs hover:bg-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/55"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="zh">中文</option>
        </select>
      </div>

      {/* Immersive Login Card Chassis */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="w-full max-w-md bg-white/95 backdrop-blur-lg border border-white/60 shadow-2xl rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center z-10 relative"
      >
        {/* Glow behind the emblem */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Static Emblem with Favicon instead of moving Globe */}
        <div className="w-16 h-16 bg-white border border-slate-200 shadow-md rounded-2xl flex items-center justify-center p-3 select-none pointer-events-none">
          <img src="/favicon.png" alt="GLOKO" className="w-full h-full object-contain pointer-events-none select-none" />
        </div>

        {/* App Meta Title block */}
        <div className="mt-6 space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter sm:text-5xl">
            Gloko
          </h1>
          <p className="text-xs font-bold tracking-widest text-indigo-600 uppercase font-mono">
            Friends Travel Book
          </p>
        </div>

        {/* Dynamic, localized subtext and introductory description */}
        <p className="mt-5 text-sm font-semibold text-slate-500 leading-relaxed px-2">
          {SUBTITLES[language]}
        </p>

        {/* Google sign-in action panel */}
        <div className="w-full mt-8 pt-6 border-t border-slate-105">
          <button
            disabled={isAuthLoading}
            onClick={onLogin}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl border border-slate-950 transition-all shadow-lg active:scale-98 flex items-center justify-center gap-3.5 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Standard high-fidelity flat Google "G" icon using inline SVG */}
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>
              {language === 'es' ? 'Acceder con Google Account' :
               language === 'fr' ? 'Se connecter avec Google' :
               language === 'de' ? 'Mit Google anmelden' :
               language === 'zh' ? '开启 Google 账号登录' :
               'Sign in with Google Account'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all stroke-[2.2]" />
          </button>
        </div>

        {/* Localized technical explanation note */}
        <span className="mt-5 text-[10.5px] text-slate-400 font-medium tracking-wide leading-normal">
          {TERMS_NOTICE[language]}
        </span>

      </motion.div>

      {/* Decorative credits lines in standard visual parameters */}
      <span className="absolute bottom-4 text-[10px] text-slate-400 font-bold tracking-widest font-mono select-none">
        Beta version
      </span>
    </div>
  );
}
