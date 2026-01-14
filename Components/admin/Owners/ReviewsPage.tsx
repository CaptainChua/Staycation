'use client';

import { Star, ThumbsUp, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";

const ReviewsPage = () => {
  const reviews = [
    {
      id: 1,
      guestName: "Juan Dela Cruz",
      haven: "Haven A - City View",
      rating: 5,
      comment: "Amazing experience! The haven was spotless and the view was breathtaking. Staff was very accommodating. Will definitely come back!",
      date: "2024-12-15",
      helpful: 12,
      response: null
    },
    {
      id: 2,
      guestName: "Maria Santos",
      haven: "Haven B - Ocean View",
      rating: 4,
      comment: "Great place overall. The ocean view was stunning. Only minor issue was the WiFi was a bit slow, but everything else was perfect.",
      date: "2024-12-14",
      helpful: 8,
      response: "Thank you for your feedback! We've upgraded our WiFi to provide better service."
    },
    {
      id: 3,
      guestName: "Pedro Reyes",
      haven: "Haven C - Pool View",
      rating: 5,
      comment: "Perfect for families! The kids loved the pool. Very clean and well-maintained. Highly recommended!",
      date: "2024-12-13",
      helpful: 15,
      response: "We're thrilled to hear your family had a great time! Thank you!"
    },
    {
      id: 4,
      guestName: "Ana Garcia",
      haven: "Haven D - Garden View",
      rating: 3,
      comment: "Good location but the AC needs fixing. Garden view was nice and peaceful. Service was okay.",
      date: "2024-12-12",
      helpful: 5,
      response: null
    },
  ];

  // Stats cards matching Analytics page style with colored backgrounds
  const stats = [
    { label: "Average Rating", value: "4.5", icon: Star, color: "bg-yellow-500", change: "+0.2", trending: "up" },
    { label: "Total Reviews", value: "156", icon: MessageSquare, color: "bg-blue-500", change: "+12", trending: "up" },
    { label: "5-Star Reviews", value: "89%", icon: TrendingUp, color: "bg-green-500", change: "+5%", trending: "up" },
    { label: "Response Rate", value: "92%", icon: ThumbsUp, color: "bg-indigo-500", change: "+3%", trending: "up" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching Analytics page style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reviews & Feedback</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and respond to guest reviews</p>
        </div>
      </div>

      {/* Stats Cards - Matching Analytics page style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  {/* Show trend indicator below value */}
                  <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${stat.trending === 'up' ? 'text-green-100' : 'text-red-100'}`}>
                    {stat.trending === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews - Matching Analytics page table container style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Guest Reviews</h2>
        </div>
        <div className="p-6 space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No reviews available.
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{review.guestName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{review.haven}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>

                {review.response ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 mb-3 rounded">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Your Response:</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">{review.response}</p>
                  </div>
                ) : (
                  <button className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors text-sm mb-3">
                    Respond to Review
                  </button>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <button className="flex items-center gap-1 hover:text-brand-primary dark:hover:text-brand-primaryLighter transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    {review.helpful} found this helpful
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
