'use client';

/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Play
} from 'lucide-react';

export default function GettingStartedContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            Before creating your feature branch, you need to start with the <strong>develop</strong> branch.
            This ensures you have the latest code from the team.
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 1: Check Your Current Branch</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        First, let&apos;s see which branch you&apos;re currently on:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git branch</span>
        </div>
      </div>

      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
        This command shows all your local branches. The one with a <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">*</code> (asterisk)
        is your current branch.
      </p>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 2: Switch to the develop Branch</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Now, let&apos;s switch to the develop branch:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git checkout develop</span>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 md:p-5 rounded-lg mb-6">
        <div className="flex items-start gap-3 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">What you&apos;ll see:</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700 font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300">
          Switched to branch 'develop'
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300">Don't have develop branch locally?</h3>
        </div>
        <p className="text-sm md:text-base text-yellow-900 dark:text-yellow-200 mb-3">
          If you get an error saying the branch doesn't exist, you might need to fetch it first:
        </p>
        <div className="bg-gray-900 text-gray-100 p-3 md:p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400">$</span>
            <span>git fetch origin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">$</span>
            <span>git checkout develop</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 3: Pull the Latest Changes</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Now that you're on the develop branch, get the latest code from GitHub:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git pull origin develop</span>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Download className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300">What does this command do?</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">git pull</code> = Download and merge changes</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">origin</code> = The GitHub repository (remote server)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">develop</code> = The branch name</span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 4: Verify You're Up to Date</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Check that you have the latest code:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git status</span>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">You should see:</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700 font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300">
          On branch develop<br />
          Your branch is up to date with 'origin/develop'.<br />
          <br />
          nothing to commit, working tree clean
        </div>
        <p className="text-sm md:text-base text-green-800 dark:text-green-300 mt-3">
          This means you have the latest code and you're ready to create your feature branch!
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Quick Command Summary</h2>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-8">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Complete workflow to get started:</h3>
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-3 overflow-x-auto">
          <div>
            <div className="text-gray-400 text-xs mb-1"># Check current branch</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git branch</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># Switch to develop</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git checkout develop</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># Get latest changes</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git pull origin develop</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># Verify everything is up to date</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git status</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-red-800 dark:text-red-300">Common Mistakes to Avoid</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-red-900 dark:text-red-200">
          <li className="flex gap-2">
            <span>✗</span>
            <span>Forgetting to pull before creating a feature branch (you might miss recent changes)</span>
          </li>
          <li className="flex gap-2">
            <span>✗</span>
            <span>Creating a feature branch from main instead of develop</span>
          </li>
          <li className="flex gap-2">
            <span>✗</span>
            <span>Not checking which branch you're on before starting work</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <Play className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Great! You're Ready!</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Now that you&apos;re on the develop branch with the latest code, let&apos;s learn how to create your feature branch.
        </p>
        <a
          href="/documentation/git-workflow/creating-branches"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Next: Creating Feature Branches →
        </a>
      </div>
    </div>
  );
}
