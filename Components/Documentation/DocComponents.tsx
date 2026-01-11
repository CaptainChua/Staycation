import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
}

export function InfoCard({ variant = 'info', icon: Icon, title, children }: InfoCardProps) {
  const variantStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const iconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const titleStyles = {
    info: 'text-blue-900 dark:text-blue-100',
    success: 'text-green-900 dark:text-green-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
    danger: 'text-red-900 dark:text-red-100',
  };

  const textStyles = {
    info: 'text-blue-800 dark:text-blue-200',
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    danger: 'text-red-800 dark:text-red-200',
  };

  return (
    <div className={`border rounded-lg p-6 ${variantStyles[variant]}`}>
      {(Icon || title) && (
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />}
          {title && <h3 className={`text-lg font-semibold ${titleStyles[variant]}`}>{title}</h3>}
        </div>
      )}
      <div className={textStyles[variant]}>{children}</div>
    </div>
  );
}

interface CodeBlockProps {
  children: React.ReactNode;
  title?: string;
}

export function CodeBlock({ children, title }: CodeBlockProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-800 dark:bg-gray-900 text-white px-6 py-3 border-b border-gray-700">
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
      )}
      <div className="bg-gray-900 text-gray-100 p-5 font-mono text-sm overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
        <div className="text-gray-700 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
}

export function FeatureCard({ icon: Icon, title, description, color = 'brand-primary' }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-l-4 border-brand-primary p-6 rounded-r-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-brand-primaryLight dark:bg-brand-primaryDark rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-primaryDark dark:text-brand-primaryLight" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  );
}
