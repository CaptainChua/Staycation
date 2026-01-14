'use client';

import React from 'react';
import {
  Target,
  RefreshCw,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Play,
  Code2,
  Save,
  Upload,
  GitPullRequest,
  Shield,
  Users,
  RotateCcw,
  Eye,
  Info
} from 'lucide-react';

export default function OverviewContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Git Workflow Overview</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            <strong>Welcome to the team!</strong> This guide will teach you our Git workflow step-by-step.
            Don't worry if you're new to Git - we'll explain everything in simple terms.
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">What is Git?</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Git is like a "save game" system for code. It helps multiple people work on the same project without
        overwriting each other's work. Think of it as Google Docs version history, but for code!
      </p>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Our Branch Strategy</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Our project uses three main branches:
      </p>

      <div className="space-y-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border-l-4 border-green-500 dark:border-green-400 p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-400">main (Production)</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            This is the <strong>live version</strong> of our website that users see. We NEVER make changes
            directly to main. This keeps our production site stable and safe.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-blue-700 dark:text-blue-400">develop (Testing)</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            This is where all completed features come together for testing. You'll <strong>start here</strong> when
            creating new features. After your feature is reviewed and approved, it gets merged into develop.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border-l-4 border-purple-500 dark:border-purple-400 p-4 md:p-5 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3 mb-2">
            <GitBranch className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-purple-700 dark:text-purple-400">feature-your-feature-name (Your Work)</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            This is <strong>your personal workspace</strong>. You'll create a new feature branch for each task.
            You can experiment, make mistakes, and fix them without affecting anyone else's work!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">The Workflow in Simple Steps</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Here's what you'll do every time you work on a new feature:
      </p>

      <ol className="space-y-4 mb-8">
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Start with develop branch</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Get the latest code from the team</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Create your feature branch</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Make your own workspace for the task</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Work on your code</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Edit files, test your changes</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Save your changes (commit)</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Create a checkpoint of your work</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">5</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Push to GitHub</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Upload your branch to the cloud</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">6</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Create a Pull Request</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Ask team leader to review your work</p>
          </div>
        </li>
      </ol>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Why This Workflow?</h2>
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 md:p-6 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">Benefits of Using Feature Branches</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2 items-start">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Safe experimentation:</strong> Your work won't break anyone else's code</span>
          </li>
          <li className="flex gap-2 items-start">
            <Eye className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Quality control:</strong> Team leader reviews code before it's merged</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Protected production:</strong> main branch stays stable for users</span>
          </li>
          <li className="flex gap-2 items-start">
            <RotateCcw className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Easy to undo:</strong> If something goes wrong, we can easily revert</span>
          </li>
          <li className="flex gap-2 items-start">
            <Users className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span><strong>Team collaboration:</strong> Everyone knows what others are working on</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Important Rule</h3>
            <p className="text-sm md:text-base text-yellow-900 dark:text-yellow-200">
              <strong>NEVER push directly to main or develop!</strong> Always create a feature branch and
              make a pull request. This protects our live website and ensures code quality.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <Play className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Ready to Get Started?</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Continue to the next section to learn how to check out the develop branch and start working!
        </p>
        <a
          href="/documentation/git-workflow/getting-started"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Next: Getting Started →
        </a>
      </div>
    </div>
  );
}
