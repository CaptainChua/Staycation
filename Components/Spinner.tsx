"use client";

interface SpinnerProps {
  label: string;
  variant?: "default" | "csr";
}

const Spinner = ({ label, variant = "default" }: SpinnerProps) => {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center animate-scale-in shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className={`w-12 h-12 border-4 ${
              variant === "csr"
                ? "border-brand-primaryLighter dark:border-gray-700"
                : "border-orange-200 dark:border-gray-700"
            } rounded-full`}></div>
            <div className={`w-12 h-12 border-4 border-transparent border-t-4 ${
              variant === "csr"
                ? "border-t-brand-primary dark:border-t-brand-primaryDark"
                : "border-t-orange-500 dark:border-t-orange-400"
            } rounded-full animate-spin absolute`}></div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            {label}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Spinner;