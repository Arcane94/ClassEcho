import {useState} from 'react';
import { X } from 'lucide-react'

interface ChangeTimeProps {
    onClose: () => void;
    onTimeUpdate: (time: string) => void;
    currentTime: string;
}

export default function ChangeTimeModal({ onClose, onTimeUpdate, currentTime }: ChangeTimeProps) {

    //State to store chosen timezone, automatically stores 'America/New_York' since that is NC State's timezone
    const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
    //State to store manually updated time stamp
    const [manualTime, setManualTime] = useState(currentTime);
    //State to store whether timezone view is open or not
    const [timezoneViewOpen, setTimezoneViewOpen] = useState(true);

    //Constant array of available timezones **May need to update with global zones**
    const timezones = [
        "UTC",
        "America/New_York",
        "America/Chicago",
        "America/Los_Angeles",
    ];

    //Function to handle changes if modal is submitted
    const handleSubmit =() => {
        if (!timezoneViewOpen) {
            //Split time into "HH:MM"
            const [hoursStr, minutes] = manualTime.split(':');  
            //Ensure hours is a number for math operations
            let hours = parseInt(hoursStr, 10);            
            //Determine if is in AM or PM
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const timeStr = `${hours}:${minutes} ${ampm}`;
            //Update to new manual time if the field was updated
            onTimeUpdate(timeStr);
        } else {
            //Otherwise conform to selected timezone
            const now = new Date();
            const timezoneTime = now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: selectedTimezone,
            });
            //Update time
            onTimeUpdate(timezoneTime);
        }
        onClose();
    };

    return (
        //Modal background overlay
        <div className="fixed inset-0 bg-grey flex items-center justify-center z-50 bg-[rgba(0,0,0,0.3)]">
            {/*Modal content */}
            <div className="bg-white px-3 w-9/12 h-[350px]">
                <div className='border-b flex justify-between pt-3 pb-2'>
                    <p className='text-lg'>Update System Time</p>
                    <button onClick={onClose}>
                        <X size={16}/>
                    </button>
                </div>
                <p className='mb-1 mt-5 text-sm text-left'>What would you like to change?</p>
                <div className="flex flex-col items-center">
                    <button onClick={() => setTimezoneViewOpen(true)} className={`w-full py-3 mb-1 border-3 ${timezoneViewOpen  ? "border-[var(--accent-color)] bg-blue-100" : "border-[var(--accent-color)] bg-white"}`}>
                        Timezone
                    </button>
                    <button onClick={() => setTimezoneViewOpen(false)} className={`w-full py-3 mb-1 border-3 ${!timezoneViewOpen  ? "border-[var(--accent-color)] bg-blue-100" : "border-[var(--accent-color)] bg-white"}`}>
                        Manual Time
                    </button>
                </div>
                {/* Conditional Views */}
                {timezoneViewOpen ? (
                    <div className='flex flex-col my-3'>
                        <label>Select Timezone:</label>
                        <select value={selectedTimezone} className='my-1' onChange={(e) => setSelectedTimezone(e.target.value)}>
                            {timezones.map((zone) => (
                                <option key={zone} value={zone}>
                                    {zone}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="flex flex-col my-3">
                        <label>Time:</label>
                        <div className="inline-flex">
                            <input type="time" className="inline-block w-full my-1" value={manualTime} onChange={(e) => setManualTime(e.target.value)}/>
                        </div>
                    </div>

                )}
                {/*Bottom bar with 'Cancel' and 'Apply' options*/}
                <div className="flex justify-end items-center gap-2 mb-2">
                    <button onClick={() => onClose()} className='border-1 border-[var(--grey-accent)] p-1.5'>
                        Cancel
                    </button>
                    <button onClick={() => handleSubmit()} className='bg-[var(--accent-color)] p-1.5'>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    )

}