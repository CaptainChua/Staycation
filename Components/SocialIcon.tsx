'use client';

import Link from "next/link";

interface FooterProps {
    icon: React.ReactNode;
    label: string;
    href: string;
}

const SocialIcon = ({icon, label, href}:FooterProps) => {
  return (
    <Link 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
        aria-label={label}
    >{icon}</Link>
  )
}

export default SocialIcon