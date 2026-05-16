import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ options, value, onChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`select-field flex items-center justify-between gap-3 text-left transition-all duration-300
                    ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-lg' : 'hover:border-slate-300'}
                    !bg-white !pr-4`}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown 
                    size={18} 
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                                    ${value === option.value 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <Check size={16} className="text-blue-600 animate-in zoom-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
