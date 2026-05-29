import React, { useState, useEffect, useRef } from 'react';
import { Contact } from '../types';
import { getCountryInfo, COUNTRY_LIST } from '../data/countries';
import { resizeImage } from '../utils/image';
import { X, Upload, Trash2, Globe, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ContactFormProps {
  countryId: string;
  countryName: string;
  editingContact: Contact | null;
  onSave: (contactData: Omit<Contact, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  onClose: () => void;
}

export default function ContactForm({
  countryId,
  countryName,
  editingContact,
  onSave,
  onClose,
}: ContactFormProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countryInfo = getCountryInfo(countryId);

  // Populate data if editing
  useEffect(() => {
    setIsSubmitting(false);
    if (editingContact) {
      setName(editingContact.name);
      setCity(editingContact.city || '');
      setContactInfo(editingContact.contactInfo || '');
      setNotes(editingContact.notes || '');
      setPhotoUrl(editingContact.photoUrl || '');
    } else {
      // Clear fields for new contact
      setName('');
      setCity('');
      setContactInfo('');
      setNotes('');
      setPhotoUrl('');
    }
    setError(null);
  }, [editingContact, countryId]);

  // Handle image upload and compression/resizing
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setError(null);

    try {
      if (!file.type.match(/image\/*/)) {
        throw new Error('Please upload an image file (png, jpg, jpeg).');
      }

      // Convert and resize dynamically
      const resizedBase64 = await resizeImage(file, 200);
      setPhotoUrl(resizedBase64);
    } catch (err: any) {
      setError(err?.message || 'Error processing image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setError(null);

    try {
      if (!file.type.match(/image\/*/)) {
        throw new Error('Please upload an image file (png, jpg, jpeg).');
      }
      const resizedBase64 = await resizeImage(file, 200);
      setPhotoUrl(resizedBase64);
    } catch (err: any) {
      setError(err?.message || 'Error processing dropped image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('A name is required to save a contact.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        ...(editingContact ? { id: editingContact.id, createdAt: editingContact.createdAt } : {}),
        name: name.trim(),
        countryId,
        countryName,
        city: city.trim() || '',
        contactInfo: contactInfo.trim() || '',
        notes: notes.trim() || '',
        photoUrl: photoUrl || undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Error saving. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col overflow-hidden max-h-full text-slate-800">
      {/* Form Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div>
          <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <span>{editingContact ? '✍️ Edit Travel Diary' : '➕ Add Travel Friend'}</span>
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm select-none">{countryInfo?.flag || '🗺️'}</span>
            <span className="text-xs text-slate-500 font-sans font-medium">{countryName}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form Fields container */}
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Input: Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Who did you meet?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans font-medium"
          />
        </div>

        {/* Double row: City and Contact method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Input: City */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
              City <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Paris, Kyoto"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans font-medium"
            />
          </div>

          {/* Input: Contact details */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
              Contact <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. email, phone, @handle"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans font-medium"
            />
          </div>
             {/* Drag and drop image upload widget */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
            Picture <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          </label>

          <div className="flex items-center gap-3">
            {photoUrl ? (
              <div className="relative group/photo flex-shrink-0">
                <img
                   src={photoUrl}
                   alt="Avatar preview"
                   referrerPolicy="no-referrer"
                   className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 border border-red-650 shadow text-white hover:bg-red-650 rounded-full transition-all"
                  title="Remove Photo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-2xl cursor-pointer transition-all gap-1.5 group text-center"
              >
                <div className="p-1.5 bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-500 rounded-xl transition-colors">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="text-center font-sans">
                  <span className="text-[11px] font-medium text-slate-600 group-hover:text-indigo-650 transition-colors">
                    Upload friend picture
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Drag and drop or edit file. Compressed for fast caching.
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {isProcessingImage && (
            <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1.5 mt-1 animate-pulse font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Compressing and resizing photo...
            </span>
          )}
        </div>     </div>

        {/* Input: Notes / Story */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
            Travel notes & memories <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Share a short note about how you met reference, what you did, or custom travel memories..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-sans leading-relaxed resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-slate-50 font-sans font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessingImage || isSubmitting}
            className={`px-4 py-2 text-white rounded-full text-xs font-sans font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
              isSubmitting 
                ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-205'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{editingContact ? 'Saving Changes...' : 'Adding Friend...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{editingContact ? 'Save Changes' : 'Add Travel Friend'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
