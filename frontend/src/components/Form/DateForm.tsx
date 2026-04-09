// Reusable date input field used across observation and session forms.
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateFormProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export default function DateForm({ label, value, onChange}: DateFormProps) {
  return (
    <div className={'w-full ml-[24px] mr-[24px] '}>
      {label && (
        <label className={"sr-only text-[16px] font-medium mb-1"}>
          {label}
        </label>
      )}
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat="EEEE, dd MMMM yyyy" // "Monday, 16 September 2024"
        className="text-[18px] font-medium bg-white w-[32ch]"
        onKeyDown={(e) => e.preventDefault()}
        popperPlacement="bottom-start"  
      />
    </div>
  );
}
