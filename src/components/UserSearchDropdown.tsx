"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getOptimizedImageUrl } from '@/lib/media';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserSearchDropdownProps {
  onSelect: (user: Profile) => void;
  placeholder?: string;
}

export default function UserSearchDropdown({ onSelect, placeholder = "Search username..." }: UserSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const supabase = createClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    
    const searchUsers = async () => {
      setLoading(true);
      setIsOpen(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    };

    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input
          type="text"
          className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition-colors"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#121214] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-white/50 text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {results.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  onClick={() => {
                    onSelect(user);
                    setQuery('');
                    setIsOpen(false);
                  }}
                >
                  <img 
                    src={getOptimizedImageUrl(user.avatar_url, 100) || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-full bg-white/10"
                  />
                  <div>
                    <div className="font-semibold text-white">@{user.username}</div>
                    {user.full_name && <div className="text-xs text-white/50">{user.full_name}</div>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-white/50 text-sm">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
