'use client';

import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";

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

  const stats = [
    { label: "Average Rating", value: "4.5", icon: Star, color: "text-yellow-500" },
    { label: "Total Reviews", value: "156", icon: MessageSquare, color: "text-blue-500" },
    { label: "5-Star Reviews", value: "89%", icon: TrendingUp, color: "text-green-500" },
    { label: "Response Rate", value: "92%", icon: ThumbsUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reviews & Feedback</h1>
        <p className="text-gray-600">Monitor and respond to guest reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{review.guestName}</h3>
                <p className="text-sm text-gray-600">{review.haven}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.comment}</p>

            {review.response ? (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Your Response:</p>
                <p className="text-sm text-blue-800">{review.response}</p>
              </div>
            ) : (
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                Respond to Review
              </button>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
              <button className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                {review.helpful} found this helpful
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsPage;
