import React from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchToggleProps {
  on: boolean;
  onToggle: () => void;
}

export default function SearchToggle({ on, onToggle }: SearchToggleProps) {
  return (
    <div className="search-toggle">
      <FiSearch className="search-icon" />
      <button type="button" onClick={onToggle} className="switch-button">
        <span className={`switch-knob ${on ? 'on' : ''}`} />
      </button>
    </div>
  );
}