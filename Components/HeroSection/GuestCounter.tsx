'use client';

import { Minus, Plus } from "lucide-react";

interface GuestCounterProps {
    label: string;
    description?: string;
    count: number;
    onIncrement: () => void;
    onDecrement: () => void;
    minValue?: number;
}

const GuestCounter = ({label, description, count, onIncrement, onDecrement, minValue = 0}: GuestCounterProps) => {
  const isMinimum = count <= minValue;

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
        <div className="flex-1">
            <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{label}</p>
            {description && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
            <button
                onClick={onDecrement}
                disabled={isMinimum}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${isMinimum
                        ? 'border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed'
                        : 'border-orange-400 text-orange-500 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 hover:text-white hover:border-transparent active:scale-95 hover:shadow-md'
                    }`}
            >
                <Minus className="w-4 h-4" strokeWidth={2.5}/>
            </button>
            <span className="w-8 text-center font-semibold text-sm sm:text-base bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400">
                {count}
            </span>
            <button
                onClick={onIncrement}
                className="w-8 h-8 rounded-full border-2 border-orange-400 text-orange-500
                    hover:bg-gradient-to-r hover:from-yellow-500 hover:to-orange-500 hover:text-white hover:border-transparent
                    flex items-center justify-center transition-all duration-300 active:scale-95 hover:shadow-md"
            >
                <Plus className="w-4 h-4" strokeWidth={2.5}/>
            </button>
        </div>
    </div>
  )
}

export default GuestCounter