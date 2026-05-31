export type AppLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh';

export interface TranslationSet {
  settings: string;
  appLanguage: string;
  languageSelect: string;
  userAccountSync: string;
  guestModeExplanation: string;
  connectGoogle: string;
  cloudLocked: string;
  synced: string;
  signOut: string;
  dataUtilities: string;
  exportFriendsBook: string;
  exportFriendsDesc: string;
  downloadCsv: string;
  dangerManagement: string;
  resetMapNetwork: string;
  resetMapDesc: string;
  purgeAllFriends: string;
  glokoBeta: string;
  friendsBook: string;
  clickToExpand: string;
  hideList: string;
  searchFriends: string;
  searchFriendsPlaceHolder: string;
  searchCountriesPlaceHolder: string;
  addFriend: string;
  cityRegion: string;
  contactInfo: string;
  notes: string;
  saveDetail: string;
  countryColor: string;
  noFriendsLogged: string;
  selectedText: string;
  cancel: string;
  resetEverything: string;
  confirmResetTitle: string;
  confirmResetMessageUser: string;
  confirmResetMessageGuest: string;
  overallStats: string;
  howItWorks: string;
  howItWorksDesc: string;
  showMeAround: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationSet> = {
  en: {
    settings: "Settings",
    appLanguage: "Language",
    languageSelect: "App Language",
    userAccountSync: "User Account & Sync",
    guestModeExplanation: "You are in Guest Mode (saving locally on your browser). Connect with Google to sync stats and friends in real-time across your devices.",
    connectGoogle: "Connect Google Account",
    cloudLocked: "Cloud Locked",
    synced: "Synced",
    signOut: "Sign Out Account",
    dataUtilities: "Data Utilities",
    exportFriendsBook: "Export Friends Book",
    exportFriendsDesc: "Compile the friends directory grouped by country in a CSV table compatible with Excel and Google Sheets.",
    downloadCsv: "Download CSV spreadsheet",
    dangerManagement: "Danger Management",
    resetMapNetwork: "Reset Map Network",
    resetMapDesc: "Permanently purge your entire travel directory logs, custom country styles, colors and stats. Safe backups can be exported first.",
    purgeAllFriends: "Purge All Friends Book",
    glokoBeta: "Gloko Beta Version",
    friendsBook: "Friends Book",
    clickToExpand: "Click to expand",
    hideList: "Hide list",
    searchFriends: "Search Friends",
    searchFriendsPlaceHolder: "Search friend details...",
    searchCountriesPlaceHolder: "Search countries...",
    addFriend: "Add Friend",
    cityRegion: "City / Region",
    contactInfo: "Contact Info",
    notes: "Notes",
    saveDetail: "Save Details",
    countryColor: "Country Aesthetic Color",
    noFriendsLogged: "No friends are logged in this country yet.",
    selectedText: "Selected",
    cancel: "Cancel",
    resetEverything: "Reset Everything",
    confirmResetTitle: "Reset Map Data",
    confirmResetMessageUser: "Are you sure you want to reset your travel network? This will permanently delete all your registered friends and custom country colors, leaving a completely blank slate map.",
    confirmResetMessageGuest: "Are you sure you want to reset your travel network? This will permanently delete all your registered friends and custom country colors, leaving a completely blank slate map.",
    overallStats: "Overall Statistics",
    howItWorks: "How It Works",
    howItWorksDesc: "Learn how to use Gloko to track your friends and connections around the world.",
    showMeAround: "Show Me Around"
  },
  es: {
    settings: "Ajustes",
    appLanguage: "Idioma",
    languageSelect: "Idioma de la aplicación",
    userAccountSync: "Cuenta de Usuario y Sincronización",
    guestModeExplanation: "Estás en Modo Invitado (guardando localmente en tu navegador). Conéctate con Google para sincronizar estadísticas y amigos en tiempo real.",
    connectGoogle: "Conectar cuenta de Google",
    cloudLocked: "Nube Asegurada",
    synced: "Sincronizado",
    signOut: "Cerrar sesión de la cuenta",
    dataUtilities: "Utilidades de datos",
    exportFriendsBook: "Exportar libro de amigos",
    exportFriendsDesc: "Compila el directorio de amigos agrupado por país en una tabla CSV compatible con Excel y Google Sheets.",
    downloadCsv: "Descargar hoja de cálculo CSV",
    dangerManagement: "Gestión de peligros",
    resetMapNetwork: "Restablecer red de mapas",
    resetMapDesc: "Purga permanentemente todos tus registros de viaje, estilos de países personalizados, colores y estadísticas. Puedes exportar copias de seguridad primero.",
    purgeAllFriends: "Purgar todo el libro de amigos",
    glokoBeta: "Gloko Versión Beta",
    friendsBook: "Libro de Amigos",
    clickToExpand: "Clic para expandir",
    hideList: "Ocultar lista",
    searchFriends: "Buscar amigos",
    searchFriendsPlaceHolder: "Buscar detalles de amigos...",
    searchCountriesPlaceHolder: "Buscar países...",
    addFriend: "Agregar Amigo",
    cityRegion: "Ciudad / Región",
    contactInfo: "Información de contacto",
    notes: "Notas",
    saveDetail: "Guardar detalles",
    countryColor: "Color estético del país",
    noFriendsLogged: "Aún no se han registrado amigos en este país.",
    selectedText: "Seleccionado",
    cancel: "Cancelar",
    resetEverything: "Restablecer todo",
    confirmResetTitle: "Restablecer datos del mapa",
    confirmResetMessageUser: "¿Estás seguro de que deseas restablecer tu red de viajes? Esto borrará permanentemente todos tus amigos registrados y colores personalizados, dejando un mapa completamente vacío.",
    confirmResetMessageGuest: "¿Estás seguro de que deseas restablecer tu red de viajes? Esto borrará permanentemente todos tus amigos registrados y colores personalizados, dejando un mapa completamente vacío.",
    overallStats: "Estadísticas Generales",
    howItWorks: "¿Cómo funciona?",
    howItWorksDesc: "Aprende a usar Gloko para seguir a tus amigos y conexiones en todo el mundo.",
    showMeAround: "Mostrarme el mapa"
  },
  fr: {
    settings: "Paramètres",
    appLanguage: "Langue",
    languageSelect: "Langue de l'application",
    userAccountSync: "Compte d'utilisateur & Synchronisation",
    guestModeExplanation: "Vous êtes en mode Invité (enregistrement local sur votre navigateur). Connectez-vous avec Google pour synchroniser vos amis en temps réel.",
    connectGoogle: "Connecter un compte Google",
    cloudLocked: "Verrouillé sur le Cloud",
    synced: "Synchronisé",
    signOut: "Se déconnecter",
    dataUtilities: "Utilitaires de données",
    exportFriendsBook: "Exporter le carnet d'amis",
    exportFriendsDesc: "Compiler le répertoire d'amis groupé par pays dans un tableau CSV compatible avec Excel et Google Sheets.",
    downloadCsv: "Télécharger le tableur CSV",
    dangerManagement: "Zone de danger",
    resetMapNetwork: "Réinitialiser le réseau",
    resetMapDesc: "Purger définitivement vos journaux de voyage, styles personnalisés, couleurs de pays et statistiques. Sauvegardez d'abord vos données.",
    purgeAllFriends: "Purger tout le carnet d'amis",
    glokoBeta: "Version bêta de Gloko",
    friendsBook: "Carnet d'amis",
    clickToExpand: "Cliquez pour agrandir",
    hideList: "Masquer la liste",
    searchFriends: "Rechercher des amis",
    searchFriendsPlaceHolder: "Rechercher des détails...",
    searchCountriesPlaceHolder: "Rechercher des pays...",
    addFriend: "Ajouter un ami",
    cityRegion: "Ville / Région",
    contactInfo: "Coordonnées",
    notes: "Remarques",
    saveDetail: "Enregistrer les détails",
    countryColor: "Couleur esthétique du pays",
    noFriendsLogged: "Aucun ami enregistré dans ce pays pour le moment.",
    selectedText: "Sélectionné",
    cancel: "Annuler",
    resetEverything: "Réinitialiser tout",
    confirmResetTitle: "Réinitialiser les données",
    confirmResetMessageUser: "Êtes-vous sûr de vouloir réinitialiser votre réseau ? Cela effacera définitivement tous vos amis enregistrés et vos couleurs personnalisées, laissant une carte complètement vide.",
    confirmResetMessageGuest: "Êtes-vous sûr de vouloir réinitialiser votre réseau ? Cela effacera définitivement tous vos amis enregistrés et vos couleurs personnalisées, laissant une carte complètement vide.",
    overallStats: "Statistiques Globales",
    howItWorks: "Comment ça marche ?",
    howItWorksDesc: "Apprenez à utiliser Gloko pour suivre vos amis et vos connexions à travers le monde.",
    showMeAround: "Guide touristique"
  },
  de: {
    settings: "Einstellungen",
    appLanguage: "Sprache",
    languageSelect: "App-Sprache",
    userAccountSync: "Benutzerkonto & Synchronisierung",
    guestModeExplanation: "Sie befinden sich im Gastmodus (lokale Speicherung in Ihrem Browser). Melden Sie sich bei Google an, um Daten in Echtzeit zu synchronisieren.",
    connectGoogle: "Mit Google-Konto verbinden",
    cloudLocked: "In Cloud gesichert",
    synced: "Synchronisiert",
    signOut: "Abmelden",
    dataUtilities: "Daten-Dienstprogramme",
    exportFriendsBook: "Freundesbuch exportieren",
    exportFriendsDesc: "Erstellen Sie das nach Ländern gruppierte Freundesverzeichnis in einer Excel-kompatiblen CSV-Tabelle.",
    downloadCsv: "CSV-Tabelle herunterladen",
    dangerManagement: "Gefahrenbereich",
    resetMapNetwork: "Kartendaten zurücksetzen",
    resetMapDesc: "Löschen Sie dauerhaft Ihre Reisetagebücher, benutzerdefinierten Länderstile, Farben und Statistiken. Backups können vorher exportiert werden.",
    purgeAllFriends: "Gesamtes Freundesbuch löschen",
    glokoBeta: "Gloko Beta-Version",
    friendsBook: "Freundesbuch",
    clickToExpand: "Klicken zum Aufklappen",
    hideList: "Liste ausblenden",
    searchFriends: "Freunde suchen",
    searchFriendsPlaceHolder: "Freunde-Details durchsuchen...",
    searchCountriesPlaceHolder: "Länder suchen...",
    addFriend: "Freund hinzufügen",
    cityRegion: "Stadt / Region",
    contactInfo: "Kontaktinformationen",
    notes: "Notizen",
    saveDetail: "Details speichern",
    countryColor: "Ästhetische Länderfarbe",
    noFriendsLogged: "In diesem Land sind noch keine Freunde eingetragen.",
    selectedText: "Ausgewählt",
    cancel: "Abbrechen",
    resetEverything: "Alles zurücksetzen",
    confirmResetTitle: "Kartendaten zurücksetzen",
    confirmResetMessageUser: "Sind Sie sicher, dass Sie Ihr Reisenetzwerk zurücksetzen möchten? Dadurch werden all Ihre eingetragenen Freunde und benutzerdefinierten Länderfarben dauerhaft gelöscht und eine völlig leere Karte hinterlassen.",
    confirmResetMessageGuest: "Sind Sie sicher, dass Sie Ihr Reisenetzwerk zurücksetzen möchten? Dadurch werden all Ihre eingetragenen Freunde und benutzerdefinierten Länderfarben dauerhaft gelöscht und eine völlig leere Karte hinterlassen.",
    overallStats: "Gesamtstatistik",
    howItWorks: "Wie es funktioniert",
    howItWorksDesc: "Erfahren Sie, wie Sie mit Gloko Ihre Freunde und Kontakte auf der ganzen Welt verfolgen können.",
    showMeAround: "Rundgang starten"
  },
  zh: {
    settings: "设置",
    appLanguage: "语言",
    languageSelect: "应用语言",
    userAccountSync: "用户账户与同步",
    guestModeExplanation: "您目前处于访客模式（保存在本地浏览器）。连接Google账户即可在所有设备间实时同步统计数据与好友名单。",
    connectGoogle: "连接 Google 账户",
    cloudLocked: "云端已锁定",
    synced: "已同步",
    signOut: "退出账户",
    dataUtilities: "数据工具",
    exportFriendsBook: "导出好友名录",
    exportFriendsDesc: "将按国家/地区分组的好友名录导出为与 Excel 和 Google 表格兼容的 CSV 表格。",
    downloadCsv: "下载 CSV 电子表格",
    dangerManagement: "危险区域管理",
    resetMapNetwork: "重置地图数据",
    resetMapDesc: "永久清除您的所有旅行日志、自定义国家样式、颜色和统计。请确保在此操作前已进行安全备份。",
    purgeAllFriends: "清除整个好友名录",
    glokoBeta: "Gloko 测试版本",
    friendsBook: "好友录",
    clickToExpand: "点击展开",
    hideList: "隐藏列表",
    searchFriends: "搜索好友",
    searchFriendsPlaceHolder: "搜索好友详情...",
    searchCountriesPlaceHolder: "搜索省/国家/地区...",
    addFriend: "添加好友",
    cityRegion: "城市 / 地区",
    contactInfo: "联系方式",
    notes: "备注信息",
    saveDetail: "保存信息",
    countryColor: "国家配色方案",
    noFriendsLogged: "该国家/地区目前尚未记录任何好友。",
    selectedText: "已选择",
    cancel: "取消",
    resetEverything: "重置所有内容",
    confirmResetTitle: "重置地图数据",
    confirmResetMessageUser: "确认要重置旅行名录吗？这将会永久删除您添加的所有好友记录及自定义国家配色，留下一张完全空白的地图。",
    confirmResetMessageGuest: "确认要重置旅行名录吗？这将会永久删除您添加的所有好友记录及自定义国家配色，留下一张完全空白的地图。",
    overallStats: "整体统计",
    howItWorks: "功能介绍",
    howItWorksDesc: "了解如何使用 Gloko 记录和追踪您在全球各地的朋友与社交网络关系。",
    showMeAround: "带我逛逛"
  }
};

export function getAppLanguage(): AppLanguage {
  const saved = localStorage.getItem('gloko_app_language');
  if (saved === 'en' || saved === 'es' || saved === 'fr' || saved === 'de' || saved === 'zh') {
    return saved as AppLanguage;
  }
  return 'en';
}

export function getTranslation(): TranslationSet {
  const lang = getAppLanguage();
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

export function getTranslatedOcean(name: string, lang: AppLanguage): string {
  const translations: Record<string, Record<Exclude<AppLanguage, 'en'>, string>> = {
    'Arctic Ocean': {
      es: 'Océano Ártico',
      fr: 'Océan Arctique',
      de: 'Arktischer Ozean',
      zh: '北冰洋'
    },
    'Pacific Ocean': {
      es: 'Océano Pacífico',
      fr: 'Océan Pacifique',
      de: 'Pazifischer Ozean',
      zh: '太平洋'
    },
    'Atlantic Ocean': {
      es: 'Océano Atlántico',
      fr: 'Océan Atlantique',
      de: 'Atlantischer Ozean',
      zh: '大西洋'
    },
    'Indian Ocean': {
      es: 'Océano Índico',
      fr: 'Océan Indien',
      de: 'Indischer Ozean',
      zh: '印度洋'
    },
    'Southern Ocean': {
      es: 'Océano Antártico',
      fr: 'Océan Austral',
      de: 'Südlicher Ozean',
      zh: '南冰洋'
    }
  };
  if (lang === 'en') return name;
  return translations[name]?.[lang as Exclude<AppLanguage, 'en'>] || name;
}
