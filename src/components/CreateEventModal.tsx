'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Nightclub & VIP Lounge');
  const [startDate, setStartDate] = useState('2026-09-15');
  const [venue, setVenue] = useState('');
  const [absorbPlatformFee, setAbsorbPlatformFee] = useState(false);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Insert into parties table
      const { data, error } = await supabase
        .from('parties')
        .insert({
          title,
          host_id: user.id,
          date: new Date(startDate).toISOString(),
          location: venue,
          is_published: false, // create as draft
          ticket_price: 0,
          ticket_quantity: 80,
          currency_code: 'NGN'
        })
        .select()
        .single();

      if (error) throw error;

      if (onSubmit) {
        onSubmit(data);
      }
      alert('Event created successfully as a Draft!');
      onClose();
      // Optional: Refresh page to see new event
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-slate-900">
              Create New Event
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up tickets, VVIP tables & concierges in under 2 minutes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Decked Night — House Party"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_14px_center] bg-no-repeat pr-9"
              >
                <option>Nightclub & VIP Lounge</option>
                <option>Themed & House Parties</option>
                <option>Concert & Live Show</option>
                <option>Private Dinner & Gala</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Venue Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hard Rock Beach Club, Lagos"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>

          <hr className="my-5 border-slate-200" />

          {/* Cover Commission & Fees Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="pr-4">
              <div className="text-[13px] font-bold text-slate-900">
                Cover commission & processing fees (7%)?
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                OFF by default — fee is added to guest checkout price. Toggle ON to absorb it yourself.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={absorbPlatformFee}
                onChange={(e) => setAbsorbPlatformFee(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-heading text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-5 py-2.5 font-heading text-xs font-bold text-white hover:bg-violet-700 transition"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
