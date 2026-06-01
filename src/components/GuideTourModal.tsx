import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Map, MapPin, Search, BarChart3, Download, Sparkles, PlusCircle } from 'lucide-react';
import { AppLanguage } from '../utils/translations';

import tourMapImg from '../assets/images/tour_map.png';
import tourAddImg from '../assets/images/tour_add.png';
import tourSearchImg from '../assets/images/tour_search.png';
import tourStatsImg from '../assets/images/tour_stats.png';
import tourCsvImg from '../assets/images/tour_csv.png';

interface GuideTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
}

export default function GuideTourModal({ isOpen, onClose, language }: GuideTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset current step to 0 when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Touch swiping state & handlers
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && currentStep < slides.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (isRightSwipe && currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Localized Slide Deck Data
  const getSlides = (): { title: string; desc: string; badge: string; subtitle: string }[] => {
    if (language === 'es') {
      return [
        {
          title: '¿Cuál es el concepto?',
          subtitle: 'Diario de Viajes de Amigos',
          badge: 'Idea Central',
          desc: 'Al volar de regreso de tu viaje de 2 semanas en Tokio, te das cuenta de que conociste a ese chico japonés súper divertido hace 3 años durante un viaje de mochilero en solitario por Brasil, tienes su Instagram y le prometiste hacerle una visita cuando viajaras a Japón. Pero ahora es demasiado tarde... Si Gloko hubiera existido en ese entonces, eso no habría pasado, y tal vez ahora estarías mirando las fotos de un reencuentro tan lindo. Gloko no es otra red social, es solo una aplicación inventada para cumplir una tarea sencilla: llevar un registro y catalogar de manera hermosa dónde se encuentran tus amigos, familiares o contactos profesionales que has conocido a través de continentes y mares. Tener este diario digital de amigos tan simple pero intuitivo en tu bolsillo te permite reconectar y nunca perder la oportunidad de cruzarte de nuevo con esas personas que tanto significaron para ti en algún momento de tu vida.',
        },
        {
          title: 'Añadir un amigo',
          subtitle: 'Completando tu diario',
          badge: 'Guía rápida',
          desc: 'Haz clic en cualquier país en el mapa interactivo para abrir su panel de detalles de país. Completa la información con su nombre, ciudad / región, datos de contacto, foto y añade esa pequeña anécdota sobre cómo se hicieron amigos de forma tan aleatoria aquella noche después de que él derramó esa bebida sobre tu camisa y te ofreció cambiarla por la suya.',
        },
        {
          title: 'Búsqueda inteligente',
          subtitle: 'Localiza a cualquiera al instante',
          badge: 'Guía rápida',
          desc: '¿Te acuerdas de Martina de Europa pero no estás seguro de en qué país estaba? Haz clic en el botón flotante de Buscar amigos para abrir la barra lateral. Escribe al instante el nombre, ciudad, notas o país para buscar amigos a nivel mundial a medida que escribes.',
        },
        {
          title: 'Descargar hoja de cálculo CSV',
          subtitle: 'Exportación fácil',
          badge: 'Utilidad',
          desc: '¿Sientes que estos datos podrían ser de utilidad para alguna herramienta externa? ¿O quieres implementar alguna integración interesante? Descarga todo tu repositorio de cartas de amigos ordenado por destino en formato CSV estándar desde el cajón de Ajustes para respaldar tu agenda de forma segura para Excel o Sheets.',
        },
      ];
    }
    if (language === 'fr') {
      return [
        {
          title: 'Quel est le concept ?',
          subtitle: "Carnet de Voyage et d'Amis",
          badge: 'Objectif',
          desc: "Lors de votre vol retour d'un voyage de 2 semaines à Tokyo, vous réalisez soudain que vous aviez rencontré ce gars japonais super drôle il y a 3 ans lors d'un voyage en sac à dos au Brésil, que vous aviez son Instagram et lui aviez promis de lui rendre visite une fois au Japon. Mais maintenant, c'est trop tard... Si Gloko avait existé à ce moment-là, cela ne se serait pas produit, et vous seriez peut-être en train de regarder les photos d'un si bel événement. Gloko n'est pas un autre réseau social, c'est simplement une application inventée pour accomplir une tâche simple : suivre et répertorier magnifiquement où se trouvent vos amis, votre famille ou vos contacts professionnels à travers les continents et les océans. Avoir ce journal d'amis numérique simple mais intuitif dans votre poche vous permet de vous connecter avec eux et de ne jamais manquer une occasion de croiser à nouveau la route de ces personnes qui ont tant compté pour vous à un moment donné.",
        },
        {
          title: 'Ajout d’un ami',
          subtitle: 'Compléter votre carnet',
          badge: 'Guide',
          desc: "Cliquez sur n'importe quel pays sur la carte interactive pour ouvrir son panneau de détails. Remplissez son nom, ville / région, coordonnées, photo et ajoutez cette petite anecdote sur la façon dont vous êtes devenus amis cette nuit-là après qu'il a renversé son verre sur votre chemise et vous a proposé d'échanger la sienne avec la vôtre.",
        },
        {
          title: 'Recherche intelligente',
          subtitle: 'Localiser quelqu’un instantanément',
          badge: 'Guide',
          desc: "Vous vous souvenez de Martina en Europe, mais vous ne savez plus de quel pays elle venait ? Cliquez sur le bouton flottant Recherche d'amis pour ouvrir la barre la térale. Saisissez instantanément un nom, une ville, des notes ou un pays pour rechercher vos amis dans le monde entier au fur et à mesure que vous tapez.",
        },
        {
          title: 'Télécharger le classeur CSV',
          subtitle: 'Export facile',
          badge: 'Utilitaire',
          desc: "Vous pensez que ces données pourraient être utiles pour un outil externe ? Vous voulez mettre en place une intégration sympa ? Téléchargez l'intégralité de votre carnet d'amis trié par destination dans un format CSV standard sous le tiroir des Paramètres pour sauvegarder en toute sécurité votre répertoire pour Excel ou Sheets.",
        },
      ];
    }
    if (language === 'de') {
      return [
        {
          title: 'Was ist das Konzept?',
          subtitle: 'Freunde-Reisebuch',
          badge: 'Kernziel',
          desc: 'Wenn Sie von Ihrer 2-wöchigen Reise in Tokio zurückfliegen, merken Sie plötzlich, dass Sie diesen super lustigen Japaner vor 3 Jahren während einer Solo-Rucksackreise in Brasilien getroffen haben, sein Instagram haben und versprochen haben, ihn zu besuchen, wenn Sie nach Japan reisen. Aber jetzt ist es zu spät... Wenn es Gloko damals gegeben hätte, wäre das nicht passiert, and vielleicht würden Sie jetzt Bilder von einem so schönen Wiedersehen betrachten. Gloko ist kein weiteres soziales Netzwerk, sondern eine App, die für eine einzige einfache Aufgabe entwickelt wurde: festzuhalten und wunderschön zu katalogisieren, wo sich Ihre Freunde, Familie oder beruflichen Kontakte über Kontinente und Meere hinweg befinden. Ein so einfaches, aber intuitives digitales Freunde-Journal in der Tasche zu haben, ermöglicht es Ihnen, wieder in Kontakt zu treten und nie die Chance zu verpassen, sich wieder mit Menschen zu treffen, die Ihnen irgendwann in Ihrem Leben viel bedeutet haben.',
        },
        {
          title: 'Freund hinzufügen',
          subtitle: 'Dein Buch vervollständigen',
          badge: 'Anleitung',
          desc: 'Klicken Sie auf ein beliebiges Land auf der interaktiven Karte, um die Länderdetails zu öffnen. Tragen Sie Name, Stadt / Region, Kontaktdaten und Foto ein und fügen Sie diese kleine Anekdote hinzu, wie Sie in jener Nacht zufällig Freunde wurden, nachdem er das Getränk auf Ihr Hemd geschüttet und Ihnen angeboten hatte, es mit seinem eigenen zu tauschen.',
        },
        {
          title: 'Intelligente Suche',
          subtitle: 'Jeden sofort finden',
          badge: 'Anleitung',
          desc: 'Erinnern Sie sich an Martina aus Europa, wissen aber nicht mehr, aus welchem Land sie kam? Klicken Sie auf die schwebende Schaltfläche \'Freundesuche\', um die Seitenleiste zu öffnen. Tippen Sie einfach Name, Stadt, Notizen oder Land ein, um Freunde weltweit direkt beim Tippen zu finden.',
        },
        {
          title: 'CSV-Tabelle herunterladen',
          subtitle: 'Einfacher Export',
          badge: 'Werkzeug',
          desc: 'Glauben Sie, dass diese Daten für ein externes Tool nützlich sein könnten? Möchten Sie eine nette Integration erstellen? Laden Sie Ihr gesamtes Freundesbuch, sortiert nach Reisezielen, im Standard-CSV-Format in den Einstellungen herunter, um Ihr Verzeichnis sicher für Excel oder Sheets zu sichern.',
        },
      ];
    }
    if (language === 'zh') {
      return [
        {
          title: '这是什么概念？',
          subtitle: '旅伴联络簿',
          badge: '核心目标',
          desc: '当您结束在东京为期两周的旅行登机回国时，您突然意识到，您在 3 年前独自去巴西背包旅行时曾遇到过那个超级幽默的日本男生，加了 Instagram 并答应去日本玩时一定要去拜访他。但现在一切都太迟了……如果当时 Gloko 存在，这一切就不会发生，也许现在的您正在看着如此温馨的重逢合照呢。Gloko 不是另一个社交媒体，它只是为了完成一个简单的任务而生的应用：记录并精美地分类您在各大洲和海洋遇见的朋友、家人或职业伙伴的位置。将这样一个简单但直观的数字旅伴备忘录放在口袋里，能让您重新建立联系，永远不会错过与那些在您生命中某个时刻曾有着重要意义的人再次相遇的机会。',
        },
        {
          title: '添加一位旅伴',
          subtitle: '丰富您的联络簿',
          badge: '快速上手',
          desc: '在交互式地图上点击任意国家，即可打开其国家详情面板。填写他们的姓名、城市/地区、联系方式、照片，并加上一段小趣事。比如那天晚上，不小心把饮料洒在了您的衬衫上，并主动把自己的衬衫脱下来和您的对调，然后你们就莫名其妙地成为了挚友。',
        },
        {
          title: '智能检索',
          subtitle: '瞬间锁定制定的朋友',
          badge: '快速上手',
          desc: '脑海中记得起来自欧洲的 Martina，但不确定她是哪个具体国家的？点击悬浮的“搜索好友”按钮打开侧边栏。直接输入姓名、城市、备注或国家，即可随打随搜，在全球范围内瞬间找到他们。',
        },
        {
          title: '下载 CSV 表格',
          subtitle: '一键导出',
          badge: '实用工具',
          desc: '觉得这些数据可以用于其他的外部工具？想要实现些有趣的集成？在“设置”抽屉中将整个好友联络簿按目的地一键导出为标准的 CSV 格式，便可轻松在 Excel 或 Google Sheets 中作离线备份。',
        },
      ];
    }
    
    // Default English
    return [
      {
        title: "What's the concept?",
        subtitle: 'Friends Travel Book',
        badge: 'Core Goal',
        desc: `
        When flying back from your 2-weeks trip in Tokyo, you now realise that you met that super funny Japanese guy 3 years ago 
        during a solo backpacking trip in Brazil, got his Instagram and promised to pay him a visit when you travel to Japan. But now it's too late..
        If Gloko existed by that time, that wouldn't have happened, and maybe you would now be looking at pictures of such a nice reunion.
        Gloko is not an another social media, it's just an app invented to complete one simple task: keep track and beautifully catalog where your friends, 
        family, or professional ties you met are located across continents and seas. Having such simple but intuitive digital friends journal in your pocket
        allows you to reconnect and never miss a chance to cross path again with those people that meant so much for you at some point in your life.
        `,
      },
      {
        title: 'Add a friend',
        subtitle: 'Completing your book',
        badge: 'How-to',
        desc: "Click on any country on the interactive map to open its country details panel. Fill in their name, city / region, contact info, picture and add that small anecdote about how you randomly become friends that night after he spilled that drink on your shirt and offered you to switch with his.",
      },
      {
        title: 'Smart Search',
        subtitle: 'Locate anyone Instantly',
        badge: 'How-to',
        desc: 'Remember Martina from Europe but not sure which country she was from? Click the floating Search Friends button to open the sidebar. Instantly type name, city, notes, or country to search friends globally as you type.',
      },
      {
        title: 'Download CSV Spreadsheet',
        subtitle: 'Easy export',
        badge: 'Utility',
        desc: 'You fill like these data could be of any use for an external tool? Want to implement nice integration? Download your entire friends book repository sorted by destination in a standard CSV format under the Settings drawer to safely back up your directory for Excel or Sheets.',
      },
    ];
  };

  const slides = getSlides();
  const currentSlide = slides[currentStep];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getButtonText = () => {
    if (currentStep === slides.length - 1) {
      if (language === 'es') return 'Cerrar';
      if (language === 'fr') return 'Fermer';
      if (language === 'de') return 'Schließen';
      if (language === 'zh') return '关闭';
      return 'Close';
    }
    if (language === 'es') return 'Siguiente';
    if (language === 'fr') return 'Suivant';
    if (language === 'de') return 'Weiter';
    if (language === 'zh') return '下一步';
    return 'Next';
  };

  // Render high-fidelity app screenshots generated by the system inside the tour slides
  const renderSlideGraphic = (stepIndex: number) => {
    const slideImages = [tourMapImg, tourAddImg, tourSearchImg, tourCsvImg];
    return (
      <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-150/80 shadow-inner p-1">
        <img
          src={slideImages[stepIndex]}
          alt={slides[stepIndex]?.title || 'Screenshot'}
          className="w-full h-full object-cover rounded-lg select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Centered Chassis */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed inset-y-10 inset-x-4 sm:inset-auto sm:top-[12vh] sm:left-1/2 sm:-translate-x-1/2 w-auto sm:w-[500px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-150 z-50 flex flex-col select-none overflow-hidden font-sans"
          >
            {/* Header block */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 stroke-[2.2]" />
                  <span>{currentSlide.badge}</span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5 stroke-[1.8]" />
              </button>
            </div>

            {/* Scrollable Container (Image & Text Scroll Together) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
              {/* Graphic Showcase Section */}
              <div className="h-44 sm:h-52 w-full">
                {renderSlideGraphic(currentStep)}
              </div>

              {/* Informational Section */}
              <div className="space-y-2 mt-4 text-left">
                <span className="text-[10px] font-black tracking-widest text-indigo-650 uppercase font-mono block">
                  {currentSlide.subtitle}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug">
                  {currentSlide.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed whitespace-pre-line">
                  {currentSlide.desc}
                </p>
              </div>
            </div>

            {/* Fixed Footer Block */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/10 shrink-0 flex items-center justify-between">
              {/* Visual Circle Dots */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentStep === idx ? 'w-5.5 bg-indigo-600' : 'w-1.5 bg-slate-200 hover:bg-slate-350'
                    }`}
                  />
                ))}
              </div>

              {/* Left and Right directional arrows */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-4.5 h-4.5 stroke-[2]" />
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="p-2 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center min-w-[38px]"
                  title={currentStep === slides.length - 1 ? "Close" : "Next Slide"}
                >
                  {currentStep === slides.length - 1 ? (
                    <span className="px-1.5 font-bold text-xs uppercase text-indigo-650">{getButtonText()}</span>
                  ) : (
                    <ChevronRight className="w-4.5 h-4.5 stroke-[2]" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
