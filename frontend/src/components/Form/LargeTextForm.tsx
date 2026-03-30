// Used for large text inputs present on onboarding screens
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
export default function LargeTextForm({ label, value, onChange, onBlur, placeholder, name, id, className }: TextFormProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id || name} className="text-md lg:text-lg font-medium">
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
        className={`mt-1 pl-5 py-3 border rounded-lg focus:outline-none ${className} text-md lg:text-lg`}
        style={{borderColor: 'black'}}
      />
    </div>
  );
}
