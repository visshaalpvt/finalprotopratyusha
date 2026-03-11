'use client';

import { useState, useEffect, useRef, ChangeEvent, ClipboardEvent } from 'react';
import { Input } from './ui/input';
import { formatRoomCode, isValidRoomCodeFormat } from '@/lib/room-utils';

interface RoomCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onValidationChange?: (_isValid: boolean) => void;
}

const RoomCodeInput = ({ 
  value, 
  onChange, 
  placeholder = 'XXX-XXXX-XXX',
  className = '',
  onValidationChange
}: RoomCodeInputProps) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Format the value when it changes
    if (value) {
      const formatted = formatRoomCode(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    // Notify parent of validation status
    if (onValidationChange) {
      const isValid = displayValue.length === 12 && isValidRoomCodeFormat(displayValue);
      onValidationChange(isValid);
    }
  }, [displayValue, onValidationChange]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Format the input as user types
    const formatted = formatRoomCode(input);
    setDisplayValue(formatted);
    
    // Pass the formatted value to parent
    onChange(formatted);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const formatted = formatRoomCode(pasted);
    setDisplayValue(formatted);
    onChange(formatted);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        maxLength={12}
        className={`uppercase tracking-widest font-mono text-center ${className}`}
        style={{ letterSpacing: '0.1em' }}
      />
      {displayValue.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-gray-500 font-mono tracking-widest text-sm opacity-50">
            XXX-XXXX-XXX
          </span>
        </div>
      )}
    </div>
  );
};

export default RoomCodeInput;

