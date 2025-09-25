// TextInput.jsx
import React from 'react';

interface TextFormProps {
    label: string;
    id?: string; 
    name?: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; //Allows for error-checking when user leaves text field
    placeholder?: string;
    className?: string;

}
export default function SmallTextForm({ label, value, onChange, onBlur, placeholder, name, id, className }: TextFormProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id || name} className="text-[16px] font-medium">
        {label}
      </label>
      <input
        type={'text'}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`mt-1 bg-gray-300 border h-[30px] rounded-lg focus:outline-none ${className}`}
        style={{backgroundColor: 'var(--form-background)', borderColor: 'var(--grey-accent)'}}
      />
    </div>
  );
}
