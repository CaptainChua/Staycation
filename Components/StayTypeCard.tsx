"use client";



interface StayType {
  id: string;
  duration: string;
  price: string;
  description: string;
}


interface StayTypeCardProps {
  stay: StayType;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const StayTypeCard = ({ stay, isSelected, onSelect, disabled = false }: StayTypeCardProps) => {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
        disabled
          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
          : isSelected
          ? "border-orange-500 bg-orange-50 shadow-lg transform hover:scale-105"
          : "border-gray-200 bg-white hover:border-orange-300 transform hover:scale-105"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Radio Button */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
          disabled
            ? "border-gray-300"
            : isSelected
            ? "border-orange-500"
            : "border-gray-400"
        }`}>
          {isSelected && !disabled && (
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <h3 className={`font-semibold text-base sm:text-lg mb-1 ${
            disabled ? "text-gray-500" : "text-gray-800"
          }`}>
            {stay.duration}
          </h3>
          <p className={`text-sm sm:text-base font-bold ${
            disabled ? "text-gray-400" : "text-orange-600"
          }`}>
            {stay.price}
          </p>
          {stay.description && (
            <p className="text-xs text-gray-500 mt-1">{stay.description}</p>
          )}
        </div>
      </div>
    </button>
  );
};

export default StayTypeCard;
