"use client";

interface LoadingAnimationProps {
  variant?: "default" | "csr";
  fullScreen?: boolean;
}

const LoadingAnimation = ({
  variant = "csr",
  fullScreen = true
}: LoadingAnimationProps) => {
  // Color schemes based on variant - using CSR colors (brand-primary)
  const colorScheme = {
    default: {
      bg: "bg-white dark:bg-gray-900",
      spinner: "border-brand-primary dark:border-brand-primaryDark",
      spinnerTrack: "border-brand-primaryLighter dark:border-gray-700",
      text: "text-brand-primary dark:text-brand-primaryDark",
    },
    csr: {
      bg: "bg-white dark:bg-gray-900",
      spinner: "border-brand-primary dark:border-brand-primaryDark",
      spinnerTrack: "border-brand-primaryLighter dark:border-gray-700",
      text: "text-brand-primary dark:text-brand-primaryDark",
    },
  };

  const colors = colorScheme[variant];

  const containerClass = fullScreen
    ? `fixed inset-0 z-[9999] flex items-center justify-center ${colors.bg}`
    : `flex items-center justify-center p-8 ${colors.bg} rounded-lg`;

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-6">
        {/* Loading spinner */}
        <div className="relative w-16 h-16">
          <div className={`absolute inset-0 border-4 ${colors.spinnerTrack} rounded-full`}></div>
          <div className={`absolute inset-0 border-4 border-transparent border-t-brand-primary dark:border-t-brand-primaryDark rounded-full animate-spin`}></div>
        </div>

        {/* Animated Loading text with dots */}
        <div className="flex items-center gap-1">
          <span className={`text-lg font-semibold ${colors.text}`}>
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
