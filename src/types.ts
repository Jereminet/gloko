export interface Contact {
  id: string;
  userId?: string;
  name: string;
  countryId: string; // ISO 3166-1 numeric or alpha-3 code
  countryName: string;
  city?: string;
  contactInfo?: string;
  photoUrl?: string; // base64 string
  notes?: string;
  createdAt: string;
  // Account Simulation Fields for Fixed vs Live Modes
  hasLinkedAccount?: boolean;
  homeCountryId?: string;
  geolocationEnabled?: boolean;
  liveCountryId?: string;
}

export interface CountryData {
  id: string; // ID used by map (numeric or alpha3)
  name: string;
  contacts: Contact[];
}
