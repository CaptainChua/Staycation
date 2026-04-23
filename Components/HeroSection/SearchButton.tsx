'use client';
import { Search } from "lucide-react";

interface SearchButtonProps {
  onSearch: () => void;
}

const SearchButton = ({onSearch}:SearchButtonProps) => {
  return (
    <button
      onClick={onSearch}
      className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primaryDark border border-brand-primary text-white rounded-full focus:outline-none"
      aria-label="Search"
    >
      <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      <span className="text-sm sm:text-base font-semibold">Search</span>
    </button>
  );
};

export default SearchButton;