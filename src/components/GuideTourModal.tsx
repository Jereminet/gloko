import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Map, MapPin, Search, BarChart3, Download, Sparkles, PlusCircle } from 'lucide-react';
import { AppLanguage } from '../utils/translations';

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
          title: 'El Objetivo del Mapa',
          subtitle: 'Diario de Conexiones Globales',
          badge: 'Objetivo',
          desc: 'Gloko es tu atlas de viajes personal y el diario de tu red global. Catalogas dónde están tus seres queridos, amigos y contactos profesionales en los continentes y océanos.',
        },
        {
          title: 'Agregar un amigo por país',
          subtitle: 'Tus sellos de viaje',
          badge: 'Sencillo',
          desc: 'Haz clic en cualquier país en el mapa interactivo para abrir su panel de detalles. Registra un amigo con su nombre, ciudad / región, información de contacto, notas, foto opcional y personaliza el color estético del país.',
        },
        {
          title: 'Buscar amigos',
          subtitle: 'Búsqueda instantánea',
          badge: 'Instantáneo',
          desc: 'Haz clic en el botón flotante de Buscar amigos para desplegar la barra lateral. Escribe cualquier detalle para filtrar de forma dinámica por nombre, ciudad, notas o país en tiempo real.',
        },
        {
          title: 'Estadísticas Generales',
          subtitle: 'Tus indicadores de red',
          badge: 'Panel',
          desc: 'Visualiza el progreso de tu mapa en la tarjeta de Estadísticas Generales. Sigue tu total de amigos, países visitados, porcentaje de la Tierra cubierto e historial de actividad reciente.',
        },
        {
          title: 'Exportar Libro de Amigos',
          subtitle: 'Respaldo seguro en CSV',
          badge: 'Seguro',
          desc: 'Descarga todo tu Libro de Amigos en una hoja de cálculo CSV estándar desde el cajón de Ajustes para conservarlos de forma de seguridad en Excel o Google Sheets.',
        },
      ];
    }
    if (language === 'fr') {
      return [
        {
          title: 'Le but de la carte',
          subtitle: 'Journal de connexions mondiales',
          badge: 'Objectif',
          desc: 'Gloko est votre atlas personnalisé et le journal de votre réseau global. Cartographiez l’endroit où se trouvent vos amis, vos proches et vos contacts à travers les continents.',
        },
        {
          title: 'Ajouter un ami par pays',
          subtitle: 'Vos tampons de passeport',
          badge: 'Facile',
          desc: 'Cliquez sur n’importe quel pays de la carte interactive pour ouvrir ses détails. Ajoutez un ami avec son nom, sa ville / région, ses coordonnées, ses notes, sa photo, et personnalisez la couleur esthétique du pays.',
        },
        {
          title: "Recherche d'amis",
          subtitle: 'Retrouvez vos amis en un clic',
          badge: 'Instantané',
          desc: "Cliquez sur le bouton flottant de Recherche d'amis pour afficher la barre latérale. Filtrez instantanément par nom, ville, notes ou pays au fur et à mesure que vous tapez.",
        },
        {
          title: 'Statistiques Globales',
          subtitle: 'Suivez vos métriques',
          badge: 'Tableau',
          desc: "Consultez vos progrès de carte dans le panneau des Statistiques Globales. Suivez le nombre d'amis, les pays visités, le pourcentage de la Terre couvert, et les entrées récentes.",
        },
        {
          title: "Exporter le livre d'amis",
          subtitle: 'Sauvegarde CSV',
          badge: 'Sécurité',
          desc: "Téléchargez l’intégralité de votre livre d’amis au format tableur CSV standard depuis les Paramètres pour Excel ou Google Sheets, idéal pour les sauvegardes.",
        },
      ];
    }
    if (language === 'de') {
      return [
        {
          title: 'Das Ziel der Karte',
          subtitle: 'Globales Netzwerk-Tagebuch',
          badge: 'Ziel',
          desc: 'Gloko ist Ihr persönlicher Reiseatlas und globales Freundes-Journal. Zeichnen Sie auf, wo sich Ihre Freunde, Familie und beruflichen Kontakte über Ozeane und Kontinente hinweg befinden.',
        },
        {
          title: 'Freund eintragen',
          subtitle: 'Reisepass-Stempel sammeln',
          badge: 'Einfach',
          desc: 'Klicken Sie auf ein beliebiges Land auf der Karte, um die Länderdetails zu öffnen. Tragen Sie Freunde mit Name, Stadt / Region, Kontaktdaten, Notizen und Foto ein und personalisieren Sie die ästhetische Länderfarbe.',
        },
        {
          title: 'Freundesuche',
          subtitle: 'Finde jeden Kontakt sofort',
          badge: 'Schnell',
          desc: 'Klicken Sie auf das schwebende Symbol zur Freundesuche, um das Verzeichnis zu öffnen. Filtern Sie direkt beim Eintippen nach Name, Stadt, Notizen oder Land.',
        },
        {
          title: 'Gesamtstatistik',
          subtitle: 'Welterkundung im Blick',
          badge: 'Dashboard',
          desc: 'Verfolgen Sie Ihren Reisefortschritt in der Gesamtstatistik. Sehen Sie Ihre eingetragenen Freunde, die Anzahl besuchter Länder, die prozentuale Erdabdeckung und die neuesten Einträge.',
        },
        {
          title: 'Freundesbuch exportieren',
          subtitle: 'Datensicherung im CSV-Format',
          badge: 'Backup',
          desc: 'Laden Sie Ihr gesamtes Freundesbuch in den Einstellungen als unkomplizierte CSV-Tabelle herunter, perfekt für Excel, Google Sheets oder eine offline Sicherung.',
        },
      ];
    }
    if (language === 'zh') {
      return [
        {
          title: '全球足迹地图的目标',
          subtitle: '智能全球社交关系坐标网络',
          badge: '愿景',
          desc: 'Gloko 是一款属于您个人的全球关系网盘。旨在为您完美地记录下您的亲人、挚友、合作伙伴在宏伟的地球大陆和海洋之间的地理分布点。',
        },
        {
          title: '在指定国家添加和记录好友',
          subtitle: '点亮并丰富国家或地区详情',
          badge: '极简',
          desc: '只需在交互式地图上单击任意国家，即可浮现出详情面板。在其中您可以填写姓名、城市/地区、联系方式、旅行备注、添加朋友照片头像，并自定义该国家的美学视觉颜色。',
        },
        {
          title: '全局好友检索',
          subtitle: '在海量世界好友中闪电寻踪',
          badge: '秒级',
          desc: '点击闪电浮动的“搜索好友”按钮，即可调出目录控制面板。支持输入任何姓名、城市/地区、备注或国家名称，支持多维模糊查询。',
        },
        {
          title: '首屏整体统计面板',
          subtitle: '可视化您的世界网络指标',
          badge: '监控',
          desc: '在主页的“整体统计”卡片中掌握所有的足迹。自动统计您的全球好友总数、已记录的国家和地区、已覆盖的地球百分比，并可查看最新的动态明细。',
        },
        {
          title: '一键导出好友记录簿',
          subtitle: '无限制本地 CSV 数据备份',
          badge: '主权',
          desc: '不论何时您都可以在“设置”抽屉一键点击导出整个好友记录簿，生成标准 CSV 格式表格，以便直接导入 Excel 或 Google Sheets 中作离线存档。',
        },
      ];
    }
    
    // Default English
    return [
      {
        title: 'Goal of the Map',
        subtitle: 'Global Connections Atlas',
        badge: 'Core Goal',
        desc: 'Gloko is your personal interactive travel journal and global network. Beautifully catalog where your friends, family, and professional ties are located across continents and seas.',
      },
      {
        title: 'Add a Friend in any Country',
        subtitle: 'Stamping your Passport',
        badge: 'How-to',
        desc: "Click on any country on the interactive map to open its country details panel. Fill in their name, city / region, contact info, personal notes, optional image, and customize the country's aesthetic color.",
      },
      {
        title: 'Smart Search',
        subtitle: 'Locate anyone Instantly',
        badge: 'How-to',
        desc: 'Click the floating Search Friends button to open the sidebar. Instantly type name, city, notes, or country to search friends globally as you type.',
      },
      {
        title: 'Overall Statistics',
        subtitle: 'Watch Your Global Metrics',
        badge: 'Analytics',
        desc: 'Open Overall Statistics in the main dashboard view. Track your total friends count, countries visited count, percentage of Earth covered, and explore recent entries.',
      },
      {
        title: 'Download CSV Spreadsheet',
        subtitle: 'No Strings Attached Backup',
        badge: 'Utility',
        desc: 'Download your entire friends book repository sorted by destination in a standard CSV format under the Settings drawer to safely back up your directory for Excel or Sheets.',
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
      if (language === 'es') return '¡Entendido!';
      if (language === 'fr') return 'Compris !';
      if (language === 'de') return 'Verstanden!';
      if (language === 'zh') return '开启探险之旅！';
      return 'Let’s Go!';
    }
    if (language === 'es') return 'Siguiente';
    if (language === 'fr') return 'Suivant';
    if (language === 'de') return 'Weiter';
    if (language === 'zh') return '下一步';
    return 'Next';
  };

  // Inline CSS mockups helper to render ultra polished, fully high-fidelity visual representations of pages
  const renderSlideGraphic = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="w-full h-full bg-linear-to-b from-[#e1effc] to-[#d3e5f8] rounded-xl flex items-center justify-center relative overflow-hidden p-6 shadow-inner border border-white/60">
            <div className="absolute top-2 right-2 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-md text-[8px] font-bold text-slate-500 font-mono">
              GLOKO V0.9
            </div>
            {/* Elegant compass visual with glowing pins representing friend hubs */}
            <div className="relative w-28 h-28 bg-white border border-slate-150 rounded-full flex items-center justify-center p-3 shadow-md animate-pulse">
              <div className="absolute inset-0.5 rounded-full border border-dashed border-slate-200" />
              <Map className="w-10 h-10 text-indigo-600/90 stroke-[1.6]" />
              
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-150 shadow-sm flex items-center justify-center text-xs">🇺🇸</div>
              <div className="absolute bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-150 shadow-sm flex items-center justify-center text-xs">🇫🇷</div>
              <div className="absolute top-2 -right-3 w-6 h-6 rounded-full bg-slate-50 border border-slate-150 shadow-sm flex items-center justify-center text-xs">🇯🇵</div>
            </div>
            
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute bottom-2.5 bg-white/95 shadow-sm border border-slate-100 rounded-lg px-3 py-1 flex items-center gap-1.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-700 tracking-wider font-mono">6 DEGREES OF FRIENDSHIP</span>
            </motion.div>
          </div>
        );
      case 1:
        return (
          <div className="w-full h-full bg-linear-to-b from-[#e3fcf0] to-[#d0f4e3] rounded-xl flex items-center justify-center relative overflow-hidden p-5 shadow-inner border border-white/65">
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 w-11/12 max-w-[210px] space-y-2.5 relative">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">🇯🇵</span>
                  <span className="text-[10px] font-black text-slate-800">JAPAN</span>
                </div>
                <span className="text-[8px] bg-indigo-50 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded uppercase">
                  {language === 'zh' ? '添加' : 'New'}
                </span>
              </div>
              
              <div className="space-y-1.5">
                <div className="h-5 bg-slate-50 border border-slate-150 rounded-lg px-2 flex items-center justify-between text-[8px] font-medium text-slate-400">
                  <span>{language === 'zh' ? '姓名' : 'Name'}</span>
                  <span className="text-slate-800 font-bold">Yuki Tanaka</span>
                </div>
                
                <div className="h-5 bg-slate-50 border border-slate-150 rounded-lg px-2 flex items-center justify-between text-[8px] font-medium text-slate-400">
                  <span>{language === 'zh' ? '城市' : 'City'}</span>
                  <span className="text-slate-850 font-bold">Kyoto</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white shadow-sm ring-2 ring-red-500/20" />
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-white shadow-sm" />
                </div>
              </div>
              
              <div className="w-full py-1.5 bg-emerald-600/90 text-center text-white font-extrabold text-[8px] rounded-lg tracking-wider shadow-sm flex items-center justify-center gap-1">
                <PlusCircle className="w-2.5 h-2.5 shrink-0" />
                <span>{language === 'zh' ? '确认保存' : 'SAVE STAMP'}</span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full bg-[#f8fafc] rounded-xl flex flex-col justify-start relative overflow-hidden p-4 shadow-inner border border-white/60">
            {/* Mini search top mockup */}
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-1 bg-white shadow-xs">
              <Search className="w-3 h-3 text-indigo-600" />
              <div className="h-2.5 rounded-md w-[80px] text-[8px] text-indigo-650 font-bold flex items-center select-none">yuki</div>
              <X className="w-2.5 h-2.5 text-slate-350 ml-auto" />
            </div>
            
            <div className="mt-2.5 space-y-1.5 flex-1 overflow-hidden">
              <div className="bg-white border border-slate-100 p-2 rounded-lg shadow-xs flex items-center gap-2">
                <span className="text-xs">🇯🇵</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black text-slate-800 leading-none">Yuki Tanaka</div>
                  <div className="text-[7px] text-slate-400 font-semibold truncate mt-0.5">Kyoto • @yuki_travels</div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div className="bg-white border border-slate-100 p-2 rounded-lg shadow-xs flex items-center gap-2 opacity-70">
                <span className="text-xs">🇺🇸</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black text-slate-800 leading-none">Sophia Ramirez</div>
                  <div className="text-[7px] text-slate-400 font-semibold truncate mt-0.5">Austin, TX • +1 512-555-0143</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full bg-linear-to-b from-[#fffcf0] to-[#fef6dc] rounded-xl flex items-center justify-center relative overflow-hidden p-5 shadow-inner border border-white/60">
            <div className="bg-white border border-amber-100/50 rounded-xl p-4 w-11/12 max-w-[220px] shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-orange-50 pb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{language === 'zh' ? '关键指标' : 'OVERALL METRICS'}</span>
                <BarChart3 className="w-4 h-4 text-amber-500 stroke-[1.8]" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-2">
                  <div className="text-sm font-black text-indigo-700">3</div>
                  <div className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">{language === 'zh' ? '记录好友' : 'FRIENDS'}</div>
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-2">
                  <div className="text-sm font-black text-emerald-700">1.5%</div>
                  <div className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">{language === 'zh' ? '覆盖比例' : 'COVERAGE'}</div>
                </div>
              </div>
              
              <div className="bg-orange-50/50 border border-amber-100/40 rounded-lg px-2 py-1.5 flex items-center justify-between">
                <span className="text-[7px] text-orange-850 font-bold uppercase">{language === 'zh' ? '主要大洲伙伴' : 'GLOBAL HUBS'}</span>
                <span className="text-[8px] font-black text-amber-800 font-mono">AS, NA, EU</span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full bg-[#f3f4f6] rounded-xl flex items-center justify-center relative overflow-hidden p-5 shadow-inner border border-white/60">
            <div className="bg-white rounded-xl border border-slate-200/85 p-3.5 w-11/12 max-w-[210px] shadow-lg flex flex-col justify-between h-[125px] relative">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-800">gloko_friends.csv</h5>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5">CSV format compatible with Excel</p>
                </div>
                <Download className="w-4.5 h-4.5 text-indigo-500" />
              </div>
              
              {/* Mini visual table layout */}
              <div className="space-y-1 font-mono text-[5.5px] text-slate-400 my-1">
                <div className="flex border-b border-slate-100 pb-0.5 font-bold text-slate-700">
                  <span className="w-1/3">Name</span>
                  <span className="w-1/3">Country</span>
                  <span className="w-1/3">City</span>
                </div>
                <div className="flex">
                  <span className="w-1/3 truncate">Yuki Tanaka</span>
                  <span className="w-1/3 text-indigo-650">Japan</span>
                  <span className="w-1/3 truncate">Kyoto</span>
                </div>
                <div className="flex">
                  <span className="w-1/3 truncate">Lucas Dubois</span>
                  <span className="w-1/3 text-indigo-650">France</span>
                  <span className="w-1/3 truncate">Paris</span>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-1 text-center text-emerald-800 text-[8px] font-semibold flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>EXPORT_READY_SUCCESS.CSV</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
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
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/20">
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

            {/* Graphic Showcase Section */}
            <div className="p-6 pb-2 h-44 sm:h-52 shrink-0">
              {renderSlideGraphic(currentStep)}
            </div>

            {/* Informational Section */}
            <div className="flex-1 p-6 px-6.5 flex flex-col justify-between overflow-y-auto min-h-0">
              <div className="space-y-2">
                <span className="text-[9px] font-black tracking-widest text-indigo-650 uppercase font-mono">
                  {currentSlide.subtitle}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug">
                  {currentSlide.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                  {currentSlide.desc}
                </p>
              </div>

              {/* Steps indicator and button */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-5 bg-white shrink-0">
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

                {/* Left and Right directional arrows and CTA buttons */}
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
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    {getButtonText()}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
