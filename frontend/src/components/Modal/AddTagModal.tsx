import {useState} from 'react';

interface AddTagProps {
    onClose: () => void;
    onAddTag: (key: string, value: string) => void;
    modalHeader: string;
    tagSection: string;
}

export default function AddTagModal({ onClose, tagSection, onAddTag, modalHeader }: AddTagProps) {
    //State to store new tag naem
    const [tagName, setTagName] = useState('');

    const handleSubmit = () => {
        if (tagName.trim() !== '') {
            onAddTag(tagSection, tagName);
            setTagName('');
        }
        onClose();
      };

    return (
        //Modal background overlay
        <div className="fixed inset-0 bg-grey flex items-center justify-center z-50 bg-[rgba(0,0,0,0.3)]">
            <div className="bg-white px-3 py-2" >
                <div className="flex flex-col">
                    <label className="py-1">{modalHeader}</label>
                    <input
                    type="text"
                    value={tagName}
                    onChange={e => setTagName(e.target.value)}
                    placeholder="Enter text"
                    className={`mt-1 pl-2 mb-3 border h-[30px] rounded-sm focus:outline-none`}
                    />
                </div>
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