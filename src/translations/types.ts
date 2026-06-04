export type AppLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh';

export interface TranslationSet {
  // Existing Settings & general keys
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

  // ContactForm keys
  editFriendDetails: string;
  addTravelFriend: string;
  nameLabel: string;
  whoDidYouMeet: string;
  cityLabel: string;
  cityPlaceholder: string;
  contactLabel: string;
  contactPlaceholder: string;
  optional: string;
  pictureLabel: string;
  uploadFriendPicture: string;
  dragAndDropText: string;
  compressingPhoto: string;
  travelNotesLabel: string;
  notesPlaceholder: string;
  savingChanges: string;
  addingFriend: string;
  saveBtn: string;
  addTravelFriendBtn: string;

  // ContactCard keys
  addedOnFormat: string; // e.g. "Added on {date}" or "Am {date} hinzugefügt"

  // CountryDetails keys
  addFriendInCountry: string; // e.g. "Add Friend in {countryName}"
  searchFriendsPlaceholder: string;
  friendsRegisteredLabel: string; // e.g. "Friends registered ({num})"
  filteredLabel: string;
  noFriendsMatch: string; // e.g. "No friends match \"{query}\" in this country."
  noFriendsInCountry: string;
  resetBtn: string;
  sortFriendsLabel: string;

  sortAlphabeticalAsc: string;
  sortAlphabeticalDesc: string;
  sortDateDesc: string;
  sortDateAsc: string;
  sortActiveNameAsc: string;
  sortActiveNameDesc: string;
  sortActiveDateAsc: string;
  sortActiveDateDesc: string;

  // WorldMap keys
  noFriendsRecorded: string;
  friendSingular: string;
  friendPlural: string;
  countriesLabel: string;
  searchMapPlaceholder: string;
  noMatchesFound: string;

  // LoginView keys
  connectWithGoogleAccount: string;
  logoSubtitle: string;
  termsNotice: string;

  // GuideTourModal slides
  tourSlide_0_title: string;
  tourSlide_0_subtitle: string;
  tourSlide_0_badge: string;
  tourSlide_0_desc: string;

  tourSlide_1_title: string;
  tourSlide_1_subtitle: string;
  tourSlide_1_badge: string;
  tourSlide_1_desc: string;

  tourSlide_2_title: string;
  tourSlide_2_subtitle: string;
  tourSlide_2_badge: string;
  tourSlide_2_desc: string;

  tourSlide_3_title: string;
  tourSlide_3_subtitle: string;
  tourSlide_3_badge: string;
  tourSlide_3_desc: string;

  tourNext: string;
  tourClose: string;
  loaderStatuses: string[];
}
