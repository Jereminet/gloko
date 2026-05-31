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
    confirmResetMessageUser: "Are you sure you want to reset your travel network? This will clear all custom database entries, clear custom colors, and restore the initial example friends.",
    confirmResetMessageGuest: "Are you sure you want to reset your travel network? This will restore the initial examples, clear all custom colors, and clear all custom entries!",
    overallStats: "Overall Statistics"
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
    confirmResetMessageUser: "¿Estás seguro de que deseas restablecer tu red de viajes? Esto borrará todas las entradas personalizadas, los colores personalizados y restaurará los amigos de ejemplo iniciales.",
    confirmResetMessageGuest: "¿Estás seguro de que deseas restablecer tu red de viajes? Esto restaurará los ejemplos iniciales, borrará todos los colores y las entradas personalizadas.",
    overallStats: "Estadísticas Generales"
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
    confirmResetMessageUser: "Êtes-vous sûr de vouloir réinitialiser votre réseau ? Cela effacera toutes les entrées personnalisées, les couleurs et restaurera les exemples d'amis.",
    confirmResetMessageGuest: "Êtes-vous sûr de vouloir réinitialiser votre réseau ? Cela restaurera les exemples initiaux, effacera les couleurs et les entrées personnalisées.",
    overallStats: "Statistiques Globales"
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
    confirmResetMessageUser: "Sind Sie sicher, dass Sie Ihr Reisenetzwerk zurücksetzen möchten? Dadurch werden alle benutzerdefinierten Einträge und Farben gelöscht und die Beispiel-Freunde wiederhergestellt.",
    confirmResetMessageGuest: "Sind Sie sicher, dass Sie Ihr Reisenetzwerk zurücksetzen möchten? Dadurch werden die ursprünglichen Beispiele wiederhergestellt und alle benutzerdefinierten Farben und Einträge gelöscht.",
    overallStats: "Gesamtstatistik"
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
    confirmResetMessageUser: "确认要重置旅行名录吗？这会清除所有自定义数据库记录、自定义配色，并恢复初始示例好友。",
    confirmResetMessageGuest: "确认要重置旅行名录吗？这会恢复初始示例，清除所有自定义省市配色及好友记录！",
    overallStats: "整体统计"
  }
};
