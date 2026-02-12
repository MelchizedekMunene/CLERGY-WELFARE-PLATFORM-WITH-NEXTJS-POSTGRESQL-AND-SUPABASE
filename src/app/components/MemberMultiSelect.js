'use client';

import { useState, useEffect, useRef } from 'react';

export default function MemberMultiSelect({ selectedMembers, onSelectionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // Update selectAll state based on selected members
    if (members.length > 0 && selectedMembers.length === members.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedMembers, members]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/members');
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberToggle = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      onSelectionChange(selectedMembers.filter(id => id !== memberId));
    } else {
      onSelectionChange([...selectedMembers, memberId]);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      onSelectionChange([]);
    } else {
      onSelectionChange(members.map(m => m.id));
    }
  };

  const selectedMemberNames = members
    .filter(m => selectedMembers.includes(m.id))
    .map(m => m.full_name)
    .slice(0, 2)
    .join(', ');

  const displayText = selectedMembers.length === 0 
    ? 'Select members...'
    : selectedMembers.length === 1
    ? selectedMemberNames
    : selectedMembers.length === members.length
    ? `All ${members.length} members`
    : `${selectedMemberNames}${selectedMembers.length > 2 ? ` +${selectedMembers.length - 2}` : ''}`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-2">Select Members *</label>
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition"
      >
        <span className="text-gray-700 truncate">
          {displayText}
        </span>
        <span className={`ml-2 transform transition ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-3">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Select All Option */}
          <label className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllToggle}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-3 font-medium text-gray-900">
              {selectAll ? 'Deselect All' : 'Select All'} ({members.length})
            </span>
          </label>

          {/* Member List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {members.length === 0 ? 'No members found' : 'No matching members'}
              </div>
            ) : (
              filteredMembers.map(member => (
                <label
                  key={member.id}
                  className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="block text-gray-900 font-medium">{member.full_name}</span>
                    <span className="text-xs text-gray-500">{member.email}</span>
                  </span>
                </label>
              ))
            )}
          </div>

          {/* Selection Count Footer */}
          {selectedMembers.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-600 rounded-b-lg">
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
