
import React from 'react';

interface ToggleProps {
    isEnabled: boolean;
    onToggle: (isEnabled: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ isEnabled, onToggle }) => {
    return (
        <button
            type="button"
            className={`${
                isEnabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
            onClick={() => onToggle(!isEnabled)}
        >
            <span
                className={`${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
            />
        </button>
    );
};

export default Toggle;
