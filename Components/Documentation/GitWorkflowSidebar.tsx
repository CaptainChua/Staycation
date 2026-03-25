'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Play,
  GitBranch,
  Code2,
  Upload,
  GitPullRequest,
  Sparkles,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  GitMerge,
  Compass,
  Lock,
  Server
} from 'lucide-react';

interface SidebarSection {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
}

const gitSections: SidebarSection[] = [
  { id: 'overview', title: 'Overview', path: '/documentation/git-workflow/overview', icon: BookOpen },
  { id: 'getting-started', title: 'Getting Started', path: '/documentation/git-workflow/getting-started', icon: Play },
  { id: 'creating-branches', title: 'Creating Feature Branches', path: '/documentation/git-workflow/creating-branches', icon: GitBranch },
  { id: 'working-on-features', title: 'Working on Feature Branches', path: '/documentation/git-workflow/working-on-features', icon: Code2 },
  { id: 'pushing-to-github', title: 'Pushing to GitHub', path: '/documentation/git-workflow/pushing-to-github', icon: Upload },
  { id: 'pull-requests', title: 'Pull Requests & Review', path: '/documentation/git-workflow/pull-requests', icon: GitPullRequest },
  { id: 'best-practices', title: 'Best Practices', path: '/documentation/git-workflow/best-practices', icon: Sparkles },
  { id: 'quick-reference', title: 'Quick Reference', path: '/documentation/git-workflow/quick-reference', icon: Zap },
];

const apiSections: SidebarSection[] = [
  { id: 'api-overview', title: 'Overview', path: '/documentation/api/overview', icon: BookOpen },
  { id: 'api-admin', title: 'Admin Management', path: '/documentation/api/admin', icon: Code2 },
  { id: 'api-booking', title: 'Booking Management', path: '/documentation/api/booking', icon: Code2 },
  { id: 'api-payment', title: 'Payment Management', path: '/documentation/api/payment', icon: Code2 },
  { id: 'api-authentication', title: 'Authentication', path: '/documentation/api/authentication', icon: Lock },
  { id: 'api-properties', title: 'Properties', path: '/documentation/api/properties', icon: Code2 },
  { id: 'api-inventory', title: 'Inventory', path: '/documentation/api/inventory', icon: Code2 },
  { id: 'api-cleaning-tasks', title: 'Cleaning Tasks', path: '/documentation/api/cleaning-tasks', icon: Code2 },
  { id: 'api-messaging', title: 'Messaging', path: '/documentation/api/messaging', icon: Code2 },
  { id: 'api-notifications', title: 'Notifications', path: '/documentation/api/notifications', icon: Code2 },
  { id: 'api-discounts', title: 'Discounts', path: '/documentation/api/discounts', icon: Code2 },
  { id: 'api-user-profile', title: 'User Profile', path: '/documentation/api/user-profile', icon: Code2 },
  { id: 'api-reviews', title: 'Reviews', path: '/documentation/api/reviews', icon: Code2 },
  { id: 'api-reports', title: 'Issue Reports', path: '/documentation/api/reports', icon: Code2 },
  { id: 'api-wishlist', title: 'Wishlist', path: '/documentation/api/wishlist', icon: Code2 },
  { id: 'api-email', title: 'Email Services', path: '/documentation/api/email-services', icon: Code2 },
  { id: 'api-pdf', title: 'PDF Generation', path: '/documentation/api/pdf', icon: Code2 },
  { id: 'api-oauth', title: 'OAuth', path: '/documentation/api/oauth', icon: Lock },
];

export default function GitWorkflowSidebar() {
  const pathname = usePathname();

  // Check if current page is in each section
  const isGitPage = gitSections.some(section => pathname === section.path);
  const isApiPage = apiSections.some(section => pathname === section.path);
  const isWebsiteNavPage = pathname === '/documentation/website-navigation';

  // Dropdowns open when their section contains the active page, can be toggled manually
  const [isGitOpen, setIsGitOpen] = useState(true);
  const [isApiOpen, setIsApiOpen] = useState(false);
  const [isWebsiteNavOpen, setIsWebsiteNavOpen] = useState(false);

  // Keep dropdowns open if they contain the active page
  const gitShouldBeOpen = isGitOpen || isGitPage;
  const apiShouldBeOpen = isApiOpen || isApiPage;
  const websiteNavShouldBeOpen = isWebsiteNavOpen || isWebsiteNavPage;

  return (
    <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-6 sticky top-0 h-screen overflow-y-auto scrollbar-thin">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Documentation</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">For OJT Team</p>
      </div>

      <nav className="space-y-2">
        {/* Website Navigation Dropdown */}
        <div>
          <button
            onClick={() => setIsWebsiteNavOpen(!isWebsiteNavOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-brand-primary" />
              <span className="text-sm">Website Navigation</span>
            </div>
            {websiteNavShouldBeOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>

          {/* Website Navigation Content */}
          {websiteNavShouldBeOpen && (
            <div className="mt-1 ml-4 space-y-1">
              <Link
                href="/documentation/website-navigation"
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
                  ${pathname === '/documentation/website-navigation'
                    ? 'bg-brand-primaryLight/20 text-brand-primaryDark dark:text-brand-primaryLight font-semibold border-l-4 border-brand-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-primary dark:hover:text-brand-primaryLight'
                  }
                `}
              >
                <Compass className={`w-4 h-4 ${pathname === '/documentation/website-navigation' ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-brand-primary'}`} />
                <span className="text-sm">All Pages</span>
              </Link>
            </div>
          )}
        </div>

        {/* Git Dropdown */}
        <div>
          <button
            onClick={() => setIsGitOpen(!isGitOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
          >
            <div className="flex items-center gap-3">
              <GitMerge className="w-5 h-5 text-brand-primary" />
              <span className="text-sm">Git</span>
            </div>
            {gitShouldBeOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>

          {/* Git Subsections */}
          {gitShouldBeOpen && (
            <div className="mt-1 ml-4 space-y-1">
              {gitSections.map((section) => {
                const isActive = pathname === section.path;
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    href={section.path}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
                      ${isActive
                        ? 'bg-brand-primaryLight/20 text-brand-primaryDark dark:text-brand-primaryLight font-semibold border-l-4 border-brand-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-primary dark:hover:text-brand-primaryLight'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-brand-primary'}`} />
                    <span className="text-sm">{section.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* API Dropdown */}
        <div>
          <button
            onClick={() => setIsApiOpen(!isApiOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-brand-primary" />
              <span className="text-sm">API Documentation</span>
            </div>
            {apiShouldBeOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>

          {/* API Subsections */}
          {apiShouldBeOpen && (
            <div className="mt-1 ml-4 space-y-1">
              {apiSections.map((section) => {
                const isActive = pathname === section.path;
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    href={section.path}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
                      ${isActive
                        ? 'bg-brand-primaryLight/20 text-brand-primaryDark dark:text-brand-primaryLight font-semibold border-l-4 border-brand-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-primary dark:hover:text-brand-primaryLight'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-brand-primary'}`} />
                    <span className="text-sm">{section.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-8 p-4 bg-brand-primaryLighter dark:bg-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0 mt-0.5" />
          <h3 className="text-sm font-semibold text-brand-primaryDark dark:text-brand-primaryLight">Need Help?</h3>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300">
          If you encounter any issues, ask your team leader or refer to the Quick Reference section.
        </p>
      </div>
    </aside>
  );
}
