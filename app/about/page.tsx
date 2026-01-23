import Image from "next/image";

import {
  Building2,
  Heart,
  Shield,
  Star,
  Users,
  Award,
  Clock,
  MapPin,
} from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | About",
  description: "Learn about Staycation Haven - your premier destination for flexible, comfortable, and affordable urban staycations in Quezon City.",
};

const AboutPage = () => {
  const stats = [
    {
      icon: <Building2 className="w-8 h-8" />,
      value: "10+",
      label: "Premium Havens",
    },
    {
      icon: <Users className="w-8 h-8" />,
      value: "5,000+",
      label: "Happy Guests",
    },
    {
      icon: <Star className="w-8 h-8" />,
      value: "4.8",
      label: "Average Rating",
    },
    {
      icon: <Award className="w-8 h-8" />,
      value: "100%",
      label: "Satisfaction Rate",
    },
  ];

  const values = [
    {
      icon: <Heart className="w-12 h-12 text-orange-500" />,
      title: "Guest-Centered",
      description:
        "Your comfort and satisfaction are at the heart of everything we do. We strive to exceed expectations.",
    },
    {
      icon: <Shield className="w-12 h-12 text-orange-500" />,
      title: "Safety First",
      description:
        "We maintain the highest standards of cleanliness and security to ensure your peace of mind.",
    },
    {
      icon: <Clock className="w-12 h-12 text-orange-500" />,
      title: "Flexible Options",
      description:
        "From 6-hour stays to multi-day bookings, we offer flexible options to fit your schedule.",
    },
    {
      icon: <MapPin className="w-12 h-12 text-orange-500" />,
      title: "Prime Locations",
      description:
        "Strategically located in the heart of the city for easy access to everything you need.",
    },
  ];

  const team = [
    {
      name: "Maria Santos",
      role: "Founder & CEO",
      image: "/Images/shlogo.png",
      description:
        "Passionate about creating unique urban staycation experiences.",
    },
    {
      name: "Juan Dela Cruz",
      role: "Operations Manager",
      image: "/Images/shlogo.png",
      description: "Ensuring every guest has a seamless and memorable stay.",
    },
    {
      name: "Ana Reyes",
      role: "Guest Relations",
      image: "/Images/shlogo.png",
      description: "Dedicated to making every guest feel welcome and valued.",
    },
  ];

  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-16 overflow-hidden border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <Building2 className="w-8 h-8 text-brand-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About Staycation Haven
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your premier destination for flexible, comfortable, and affordable
            urban staycations. We transform ordinary spaces into extraordinary
            experiences.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-orange-50 border border-orange-200 hover:border-brand-primary transition-all duration-300"
            >
              <div className="flex justify-center mb-4 text-brand-primary">
                {stat.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Our Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded in 2020, Staycation Haven was born from a simple idea:
                not everyone needs a full 24-hour hotel stay. Whether you&apos;re
                traveling through the city, need a comfortable place to rest
                between meetings, or want a quick getaway without breaking the
                bank, we&apos;re here for you.
              </p>
              <p>
                We&apos;ve revolutionized urban accommodation by offering flexible
                booking options – from 6-hour quick stays to multi-day retreats.
                Our havens are designed with modern travelers in mind, combining
                comfort, convenience, and affordability.
              </p>
              <p>
                Today, we&apos;re proud to serve thousands of guests across multiple
                premium locations, maintaining our commitment to quality,
                cleanliness, and exceptional service.
              </p>
            </div>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden border-2 border-gray-200">
            <Image
              src="/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg"
              alt="Staycation Haven Interior"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Our Values Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Values
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The principles that guide us in delivering exceptional staycation
            experiences
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl border border-gray-200 hover:border-brand-primary transition-all duration-300"
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dedicated professionals committed to making your stay exceptional
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-brand-primary transition-all duration-300"
              >
                <div className="h-64 bg-orange-50 flex items-center justify-center">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-brand-primary font-semibold mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-brand-primary text-white rounded-xl p-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg sm:text-xl leading-relaxed">
            To redefine urban accommodation by providing flexible, high-quality
            staycation options that fit modern lifestyles. We believe everyone
            deserves a comfortable retreat, whether for a few hours or several
            days, without compromising on quality or breaking the bank.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AboutPage;