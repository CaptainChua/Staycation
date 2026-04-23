'use client';

/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import {
  CloudUpload,
  Check,
  X,
  AlertTriangle,
  Info,
  Lightbulb,
  BookOpen,
  Monitor,
  Rocket,
  Play
} from 'lucide-react';

export default function PushingToGitHubContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Pushing to GitHub</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            Your commits are currently only on <strong>your computer</strong>. Let&apos;s upload them to GitHub
            so your team can see your work and you have a backup in the cloud!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">What is Pushing?</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Think of pushing like uploading files to Google Drive. Your commits are saved locally on your computer,
        and pushing uploads them to GitHub's servers where the whole team can access them.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400 p-4 md:p-5 rounded-r-lg">
          <div className="flex items-start gap-3 mb-2">
            <Monitor className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-purple-700 dark:text-purple-400">Before Push</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Your commits exist only on your local machine. If your computer crashes, they're gone!
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4 md:p-5 rounded-r-lg">
          <div className="flex items-start gap-3 mb-2">
            <CloudUpload className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-400">After Push</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Your commits are safely stored on GitHub. Team can see them and they're backed up!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 1: Verify You Have Commits</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Before pushing, make sure you've actually committed your changes:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git status</span>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">You should see:</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-300 dark:border-green-700 font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          On branch feature-add-contact-form<br />
          nothing to commit, working tree clean
        </div>
        <p className="text-sm md:text-base text-green-800 dark:text-green-300 mt-3">
          "working tree clean" means all your changes are committed and ready to push!
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300">If you see uncommitted changes:</h3>
        </div>
        <p className="text-sm md:text-base text-yellow-900 dark:text-yellow-200 mb-3">
          Go back and commit them first! You can't push uncommitted changes.
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400">$</span>
            <span>git add .</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">$</span>
            <span>git commit -m "Your commit message"</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 2: Push Your Feature Branch</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Now push your feature branch to GitHub:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git push origin feature-your-branch-name</span>
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
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">git push</code> = Upload commits to GitHub</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">origin</code> = GitHub repository (the remote server)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">feature-your-branch-name</code> = The branch you want to push</span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">First Time Pushing This Branch?</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        If this is the first time pushing this branch, you might see a message like this:
      </p>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-lg mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          fatal: The current branch feature-add-contact-form has no upstream branch.
        </div>
      </div>

      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Don't panic! This just means GitHub doesn't know about this branch yet. Use this command instead:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git push -u origin feature-your-branch-name</span>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-blue-800 dark:text-blue-300">What does <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">-u</code> do?</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
          The <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">-u</code> flag (or <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">--set-upstream</code>)
          creates a connection between your local branch and the remote branch on GitHub.
          You only need this the first time you push a new branch!
        </p>
        <p className="text-sm md:text-base text-blue-900 dark:text-blue-200 mt-3 font-semibold">
          After using <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">-u</code> once, you can just use <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">git push</code> for future pushes.
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Real Example</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Let&apos;s say you&apos;re on <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">feature-add-contact-form</code>.
        Here's the complete workflow:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-3 overflow-x-auto">
          <div>
            <div className="text-gray-400 text-xs mb-1"># 1. Check everything is committed</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git status</span>
            </div>
          </div>
          <div className="mt-3 text-gray-300 text-xs">
            On branch feature-add-contact-form<br />
            nothing to commit, working tree clean
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-4"># 2. Push to GitHub (first time)</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push -u origin feature-add-contact-form</span>
            </div>
          </div>
          <div className="mt-3 text-green-300 text-xs">
            Enumerating objects: 12, done.<br />
            Counting objects: 100% (12/12), done.<br />
            Delta compression using up to 8 threads<br />
            Compressing objects: 100% (8/8), done.<br />
            Writing objects: 100% (8/8), 1.23 KiB | 1.23 MiB/s, done.<br />
            Total 8 (delta 4), reused 0 (delta 0)<br />
            To https://github.com/your-team/Staycation.git<br />
            * [new branch]      feature-add-contact-form -&gt; feature-add-contact-form
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Pushing Additional Commits</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        After you've pushed once with <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">-u</code>,
        you can make more commits and push them easily:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 md:p-6 mb-8">
        <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300 mb-4">Later, after making more changes:</h3>
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-3 overflow-x-auto">
          <div>
            <div className="text-gray-400 text-xs mb-1"># Make changes, stage, and commit</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git add .</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git commit -m "Fix validation bug in contact form"</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># Push (no -u needed anymore!)</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Verify Your Push on GitHub</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        After pushing, you should verify it worked:
      </p>

      <ol className="space-y-4 mb-8">
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Go to your GitHub repository</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Open your browser and navigate to the project on GitHub</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Click the branch dropdown</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">It usually says "main" or "develop" by default</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
          <div className="flex-1">
            <strong className="text-sm md:text-base text-gray-900 dark:text-white">Find your feature branch</strong>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">You should see your branch name in the list!</p>
          </div>
        </li>
      </ol>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">Success Indicators:</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>Your branch appears in the branch list on GitHub</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>Your commits are visible when you click on the branch</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>GitHub might show a yellow banner saying "Compare & pull request"</span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Quick Command Reference</h2>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-4 overflow-x-auto">
          <div>
            <div className="text-gray-400 mb-1">First time pushing a new branch:</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push -u origin feature-branch-name</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Subsequent pushes (after using -u):</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Or be explicit every time:</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push origin feature-branch-name</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-red-800 dark:text-red-300">Common Mistakes to Avoid</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-red-900 dark:text-red-200">
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Trying to push without committing changes first</span>
          </li>
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Accidentally pushing to develop or main instead of your feature branch</span>
          </li>
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Not verifying the push succeeded on GitHub</span>
          </li>
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Forgetting the <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">-u</code> flag on first push (you&apos;ll get an error)</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300">Important Safety Rules</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-yellow-900 dark:text-yellow-200">
          <li className="flex gap-2">
            <span>•</span>
            <span><strong>NEVER</strong> use <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">git push --force</code> unless you know exactly what you're doing</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Always double-check you're on the right branch before pushing</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Push your feature branch, not develop or main!</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <Play className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Branch Pushed Successfully!</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Your code is now on GitHub! Next, let&apos;s create a Pull Request so your team leader can review your work.
        </p>
        <a
          href="/documentation/git-workflow/pull-requests"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Next: Creating Pull Requests →
        </a>
      </div>
    </div>
  );
}
