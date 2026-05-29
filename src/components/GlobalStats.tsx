import React, { useState } from 'react';
import { Contact } from '../types';
import { getCountryInfo, COUNTRY_LIST } from '../data/countries';
import { Sparkles, Trophy, Users, Search, Calendar, MapPin, Compass, Globe } from 'lucide-react';

interface GlobalStatsProps {
  contacts: Contact[];
  onSelectCountry: (countryId: string | null, countryName: string) => void;
}

export default function GlobalStats({ contacts, onSelectCountry }: GlobalStatsProps) {
  const [globalSearch, setGlobalSearch] = useState('');

  // Stats calculation
  const totalContacts = contacts.length;

  // Set of unique countries visited
  const visitedCountrySet = new Set(contacts.map((c) => c.countryId.padStart(3, '0')));
  const totalCountriesVisited = visitedCountrySet.size;

  // Percentage of the world visited (approx 195 countries)
  const percentWorldVisited = Math.min(
    Math.round((totalCountriesVisited / 195) * 100),
    100
  );

  // Continent calculation
  const continentCounts = contacts.reduce<Record<string, number>>((acc, contact) => {
    const info = getCountryInfo(contact.countryId);
    if (info) {
      acc[info.continent] = (acc[info.continent] || 0) + 1;
    }
    return acc;
  }, {});

  // Sort continents by frequency
  const sortedContinents = Object.entries(continentCounts).sort((a, b) => b[1] - a[1]);

  // Retrieve 4 most recent entries across all locations
  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Global contacts search (full matches name, city, notes, or country name)
  const matchingContacts = globalSearch.trim()
    ? contacts.filter((c) => {
        const query = globalSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.countryName.toLowerCase().includes(query) ||
          (c.city && c.city.toLowerCase().includes(query)) ||
          (c.notes && c.notes.toLowerCase().includes(query))
        );
      })
    : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/85 shadow-sm overflow-hidden p-5 gap-5 min-h-[400px] text-slate-800">
      {/* Visual Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-indigo-600 font-sans font-bold text-[9px] uppercase tracking-widest">
          <Compass className="h-4 w-4" />
          <span>Dashboard summary</span>
        </div>
        <h3 className="font-sans font-semibold text-slate-800 text-base tracking-tight">
          Your Friends Book
        </h3>
        <p className="text-[11px] text-slate-400 font-sans">
          Your personal interactive archive of global friends and travel memories.
        </p>
      </div>

      {/* Numerical Stats Widgets */}
      <div className="grid grid-cols-2 gap-3">
        {/* Widget 1: Total Contacts */}
        <div className="bg-indigo-50/45 hover:bg-indigo-50 border border-indigo-150/40 rounded-2xl p-3.5 transition-all text-center flex flex-col items-center justify-center">
          <div className="p-2 bg-indigo-100/60 text-indigo-650 rounded-xl mb-2 flex-shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-2xl font-sans font-bold text-indigo-900 tracking-tight">
            {totalContacts}
          </span>
          <span className="text-[9px] font-bold font-sans text-indigo-700 uppercase tracking-widest mt-0.5">
            Total Friends
          </span>
        </div>

        {/* Widget 2: Countries Count */}
        <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/40 rounded-2xl p-3.5 transition-all text-center flex flex-col items-center justify-center">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-xl mb-2 flex-shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <span className="text-2xl font-sans font-bold text-slate-850 tracking-tight">
            {totalCountriesVisited}
          </span>
          <span className="text-[9px] font-bold font-sans text-slate-500 uppercase tracking-widest mt-0.5">
            Countries
          </span>
        </div>
      </div>

      {/* World Map Explorer Goal Progress bar */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-sans">
          <span className="font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
            <Trophy className="h-3 w-3 text-amber-500" /> Map Explorer Progress
          </span>
          <span className="font-mono text-slate-500 font-semibold">{percentWorldVisited}% of Earth</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentWorldVisited || 1}%` }}
          />
        </div>
      </div>

      {/* Global Contacts Search bar */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
          Quick Contacts Search
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search details, names, cities, notes..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full text-xs py-2 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans font-medium"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Global search entries list */}
        {globalSearch.trim() && (
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl mt-1.5 bg-white divide-y divide-slate-100 shadow-sm z-10 p-1">
            {matchingContacts.length > 0 ? (
              matchingContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelectCountry(contact.countryId, contact.countryName)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors group font-sans"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {contact.photoUrl ? (
                      <img
                        src={contact.photoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="truncate text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
                      {contact.name}
                      {contact.city && <span className="text-[10px] text-slate-400 font-normal"> ({contact.city})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <span>{contact.countryName}</span>
                    <span className="text-xs select-none">{getCountryInfo(contact.countryId)?.flag}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 font-sans">
                No friends match "{globalSearch}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Trips Feed */}
      <div className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-indigo-500" /> Recent entries recorded
        </div>

        {recentContacts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectCountry(contact.countryId, contact.countryName)}
                className="text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-xl flex items-center justify-between transition-all group font-sans"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl select-none leading-none flex-shrink-0">
                    {getCountryInfo(contact.countryId)?.flag || '🗺️'}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-650">
                      {contact.name}
                    </h4>
                    {contact.city ? (
                      <div className="flex items-center gap-0.5 text-[10px] text-slate-400 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{contact.city}, {contact.countryName}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                        {contact.countryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 flex items-center gap-1 font-sans flex-shrink-0">
                  <Calendar className="h-3 w-3 text-slate-350" />
                  <span>
                    {new Date(contact.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xl mb-1 select-none leading-none">🎒</span>
            <div className="text-[11px] text-slate-700 font-semibold font-sans">Ready for exploration</div>
            <p className="text-[11px] text-slate-400 max-w-[150px] leading-relaxed mt-0.5 mx-auto font-sans">
              No trips added yet. Start by tapping any country on the map!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
