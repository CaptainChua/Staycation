'use client';

import React from 'react';
import {
  GitBranch,
  Check,
  X,
  AlertTriangle,
  Info,
  Lightbulb,
  Target,
  Play
} from 'lucide-react';

export default function CreatingBranchesContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Creating Feature Branches</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            A feature branch is your personal workspace for a specific task. Let's learn how to create one properly!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 1: Choose a Good Branch Name</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Your branch name should be clear and descriptive. Use this naming format:
      </p>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-6 rounded-lg mb-6">
        <div className="font-mono text-base md:text-lg text-purple-900 dark:text-purple-200 mb-4">
          feature-&lt;short-description&gt;
        </div>
        <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">Good Examples:</h3>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2 items-start">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">feature-add-login-button</span>
          </li>
          <li className="flex gap-2 items-start">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">feature-fix-booking-form</span>
          </li>
          <li className="flex gap-2 items-start">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">feature-update-navbar-design</span>
          </li>
          <li className="flex gap-2 items-start">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">feature-add-room-search</span>
          </li>
        </ul>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 md:p-6 rounded-lg mb-8">
        <h3 className="text-base md:text-lg font-semibold text-red-800 dark:text-red-300 mb-3">Bad Examples (Don't do this!):</h3>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-center">
              <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">my-branch</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400">(not descriptive)</span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-center">
              <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">test</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400">(too vague)</span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-center">
              <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">feature-lots-of-changes-to-the-website</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400">(spaces, too long)</span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-center">
              <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">john-work</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400">(use task description, not name)</span>
            </div>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 2: Make Sure You're on develop</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Before creating a new branch, always verify you're on the develop branch:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git branch</span>
        </div>
      </div>

      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
        You should see <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">* develop</code>. If not, run:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-8 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git checkout develop</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <span>git pull origin develop</span>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 3: Create Your Feature Branch</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Now create your new branch with a descriptive name:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git checkout -b feature-your-task-name</span>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300">What does this command do?</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">git checkout</code> = Switch branches</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">-b</code> = Create a new branch</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">feature-your-task-name</code> = The name of your new branch</span>
          </li>
        </ul>
        <p className="text-sm md:text-base text-purple-900 dark:text-purple-200 mt-3 font-semibold">
          This creates a new branch AND switches to it in one command!
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Real Example</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Let's say your task is to "Add a contact form to the contact page". Here's what you'd do:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-3 overflow-x-auto">
          <div>
            <div className="text-gray-400 text-xs mb-1"># 1. Make sure you're on develop and it's up to date</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git checkout develop</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git pull origin develop</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-4"># 2. Create your feature branch</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git checkout -b feature-add-contact-form</span>
            </div>
          </div>
          <div className="mt-4 text-green-300">
            Switched to a new branch 'feature-add-contact-form'
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 4: Verify Your New Branch</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Confirm you're on the correct branch:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git branch</span>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-2">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">You should see:</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700 font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300">
          develop<br />
          * feature-add-contact-form
        </div>
        <p className="text-sm md:text-base text-green-800 dark:text-green-300 mt-3">
          The <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">*</code> shows you're on the feature branch. Perfect!
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Naming Convention Tips</h2>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6 mb-8">
        <ul className="space-y-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            Always start with <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">feature-</code>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Use lowercase letters</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Use hyphens (-) instead of spaces or underscores</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Be specific but concise (3-5 words is ideal)</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Describe what you're doing, not who is doing it</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300">Important Reminders</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-yellow-900 dark:text-yellow-200">
          <li className="flex gap-2">
            <span>•</span>
            <span>Create ONE feature branch per task (don't mix multiple tasks)</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Always create feature branches from the latest develop branch</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Never create a feature branch from main</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <Play className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Branch Created!</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Now you have your own workspace to code freely. Let's learn how to work on your feature branch!
        </p>
        <a
          href="/documentation/git-workflow/working-on-features"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Next: Working on Feature Branches →
        </a>
      </div>
    </div>
  );
}
