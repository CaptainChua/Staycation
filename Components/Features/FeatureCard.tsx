'use client';

interface Feature {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface FeatureCardProps {
    feature: Feature
    index: number
}
const FeatureCard = ({feature, index}:FeatureCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-in fade-in slide-in-from-bottom duration-500"
        style={{ animationDelay: `${(index + 1) * 150}ms` }}
    >
        {/* Icon Container */}
        <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900 rounded-full flex items-center justify-center group hover:from-orange-200 hover:to-yellow-200 dark:hover:from-orange-800 dark:hover:to-yellow-800 transition-all duration-300 transform group hover:scale-110">
                <div className="text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-300">
                    {feature.icon}
                </div>
            </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">{feature.title}</h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
    </div>
  )
}

export default FeatureCard