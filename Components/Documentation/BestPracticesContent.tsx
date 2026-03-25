'use client';

/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import { Check, X, Lightbulb, RefreshCw, TestTube, HelpCircle, Target, BookOpen, ArrowRight } from 'lucide-react';

export default function BestPracticesContent() {
  return (
    <div className="prose max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Best Practices & Common Mistakes</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <p className="text-lg text-blue-900">
          Follow these best practices to work effectively with Git and avoid common mistakes that trip up beginners!
        </p>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Daily Workflow Best Practices</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center gap-2"><Check className="w-5 h-5" /> 1. Always Pull Before Starting Work</h3>
          <p className="text-gray-700 mb-3">
            Start each day (or work session) by pulling the latest changes from develop:
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">$</span>
              <span>git checkout develop</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git pull origin develop</span>
            </div>
          </div>
          <p className="text-green-800 mt-3 text-sm">
            <strong>Why?</strong> This ensures you have the latest code from your teammates.
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center gap-2"><Check className="w-5 h-5" /> 2. Commit Small and Often</h3>
          <p className="text-gray-700 mb-3">
            Make frequent, small commits instead of one huge commit at the end:
          </p>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Commit after completing each logical piece of work</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Each commit should do one thing</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>It's easier to find and fix bugs in small commits</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center gap-2"><Check className="w-5 h-5" /> 3. Write Meaningful Commit Messages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="bg-white border border-green-300 p-4 rounded">
              <p className="font-semibold text-green-800 mb-2">Good Examples:</p>
              <ul className="space-y-1 text-sm font-mono text-gray-700">
                <li>Add user authentication</li>
                <li>Fix navbar responsive bug</li>
                <li>Update footer social links</li>
                <li>Remove console.log statements</li>
              </ul>
            </div>
            <div className="bg-white border border-red-300 p-4 rounded">
              <p className="font-semibold text-red-800 mb-2">Bad Examples:</p>
              <ul className="space-y-1 text-sm font-mono text-gray-700">
                <li>stuff</li>
                <li>idk</li>
                <li>changes</li>
                <li>asdfsadf</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center gap-2"><Check className="w-5 h-5" /> 4. Check Your Branch Before Working</h3>
          <p className="text-gray-700 mb-3">
            Always verify you're on the right branch:
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git branch</span>
            </div>
          </div>
          <p className="text-green-800 text-sm">
            <strong>Why?</strong> Accidentally working on the wrong branch is a common mistake!
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center gap-2"><Check className="w-5 h-5" /> 5. One Feature Branch Per Task</h3>
          <p className="text-gray-700 mb-3">
            Create a separate branch for each task or feature:
          </p>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Don't mix unrelated changes in one branch</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Makes code review easier</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Easier to test and merge</span>
            </li>
          </ul>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center gap-2"><Check className="w-5 h-5" /> 6. Test Before Committing</h3>
          <p className="text-gray-700">
            Always test your changes locally before committing and pushing. Make sure:
          </p>
          <ul className="space-y-2 text-gray-700 text-sm mt-3">
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Code runs without errors</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Feature works as expected</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>No broken links or missing images</span>
            </li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Common Mistakes to Avoid</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-red-700 mb-3 flex items-center gap-2"><X className="w-5 h-5" /> 1. Working Directly on develop or main</h3>
          <p className="text-gray-700 mb-3">
            <strong>Never make commits directly to develop or main!</strong>
          </p>
          <div className="bg-white border border-red-300 p-4 rounded">
            <p className="text-sm text-red-900 mb-2">Wrong way:</p>
            <div className="font-mono text-sm text-gray-700">
              *on develop branch* → make changes → commit → push
            </div>
          </div>
          <div className="bg-green-100 border border-green-400 p-4 rounded mt-3">
            <p className="text-sm text-green-900 mb-2">Right way:</p>
            <div className="font-mono text-sm text-gray-700">
              *on develop* → create feature branch → make changes → commit → push → create PR
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-red-700 mb-3 flex items-center gap-2"><X className="w-5 h-5" /> 2. Forgetting to Pull Before Creating Branch</h3>
          <p className="text-gray-700 mb-3">
            Always pull the latest develop before creating a feature branch:
          </p>
          <div className="bg-white border border-red-300 p-4 rounded mb-3">
            <p className="text-sm text-red-900 mb-2 flex items-center gap-2"><X className="w-4 h-4" /> Wrong:</p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs">
              <div>git checkout develop</div>
              <div>git checkout -b feature-my-feature <span className="text-red-400"># Missing pull!</span></div>
            </div>
          </div>
          <div className="bg-green-100 border border-green-400 p-4 rounded">
            <p className="text-sm text-green-900 mb-2 flex items-center gap-2"><Check className="w-4 h-4" /> Right:</p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs">
              <div>git checkout develop</div>
              <div className="text-green-400">git pull origin develop</div>
              <div>git checkout -b feature-my-feature</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-red-700 mb-3 flex items-center gap-2"><X className="w-5 h-5" /> 3. Committing Without Staging</h3>
          <p className="text-gray-700 mb-3">
            Don't forget to run <code className="bg-gray-100 px-2 py-1 rounded text-sm">git add</code> before committing:
          </p>
          <div className="bg-white border border-red-300 p-4 rounded">
            <p className="text-sm text-red-900">
              If you skip <code className="bg-gray-100 px-2 py-1 rounded text-sm">git add</code>,
              your changes won't be included in the commit!
            </p>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-red-700 mb-3 flex items-center gap-2"><X className="w-5 h-5" /> 4. Pushing to Wrong Branch</h3>
          <p className="text-gray-700 mb-3">
            Always double-check you're pushing the correct branch:
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-3">
            <div className="text-gray-400 mb-2"># Check current branch first</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">$</span>
              <span>git branch</span>
            </div>
            <div className="text-gray-400 mb-2 mt-3"># Then push</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push origin feature-your-branch</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-red-700 mb-3 flex items-center gap-2"><X className="w-5 h-5" /> 5. Using Force Push</h3>
          <p className="text-gray-700 mb-3">
            <strong>NEVER use <code className="bg-gray-100 px-2 py-1 rounded text-sm">git push --force</code></strong> unless your team leader specifically tells you to.
          </p>
          <div className="bg-white border-2 border-red-400 p-4 rounded">
            <p className="text-red-900 font-semibold">
              Force pushing can delete other people's work. It's dangerous!
            </p>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
          <h3 className="text-xl font-semibold text-red-700 mb-3 flex items-center gap-2"><X className="w-5 h-5" /> 6. Merging Your Own Pull Requests</h3>
          <p className="text-gray-700">
            Don't merge your own PRs. Always wait for your team leader to review and approve them first.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Git Workflow Checklist</h2>
      <div className="bg-white border-2 border-blue-300 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Use this checklist for every new task:</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Switch to develop and pull latest changes</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Create a new feature branch with descriptive name</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Make changes and test locally</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Stage changes with <code className="bg-gray-100 px-2 py-1 rounded text-sm">git add .</code></span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Commit with clear, descriptive message</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Push feature branch to GitHub</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Create Pull Request to develop (not main!)</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Assign team leader as reviewer</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded">
            <input type="checkbox" className="mt-1" />
            <span className="text-gray-700">Wait for approval before merging</span>
          </label>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Tips for Success</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Communicate</h3>
          <p className="text-gray-700 text-sm">
            If you're unsure about something, ask your team leader or teammates. It's better to ask than to make mistakes!
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Read PR Comments</h3>
          <p className="text-gray-700 text-sm">
            When your team leader leaves feedback, read it carefully and ask questions if you don't understand.
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2"><RefreshCw className="w-5 h-5" /> Stay Updated</h3>
          <p className="text-gray-700 text-sm">
            Pull from develop regularly, especially if you're working on a feature for multiple days.
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2"><TestTube className="w-5 h-5" /> Test Everything</h3>
          <p className="text-gray-700 text-sm">
            Test your changes thoroughly before creating a PR. This saves time in the review process.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">What to Do When Things Go Wrong</h2>
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Don't Panic!</h3>
        <p className="text-yellow-900 mb-4">
          If you make a mistake or something doesn't work:
        </p>
        <ul className="space-y-2 text-yellow-900">
          <li className="flex gap-2">
            <span>1.</span>
            <span><strong>Don't try to fix it with random commands</strong> - this can make it worse!</span>
          </li>
          <li className="flex gap-2">
            <span>2.</span>
            <span><strong>Take a screenshot</strong> of the error message</span>
          </li>
          <li className="flex gap-2">
            <span>3.</span>
            <span><strong>Ask your team leader</strong> - they've seen it before and can help!</span>
          </li>
          <li className="flex gap-2">
            <span>4.</span>
            <span><strong>Learn from it</strong> - mistakes are how we improve</span>
          </li>
        </ul>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><Target className="w-5 h-5" /> Remember</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Git is a tool to help you, not to slow you down</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Everyone makes mistakes - even experienced developers!</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Following the workflow protects everyone's work</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Your team leader is there to help you succeed</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Need a Quick Reference?</h3>
        <p className="text-gray-700 mb-4">
          Check out our quick reference guide for a handy cheat sheet of all the Git commands you&apos;ll need!
        </p>
        <a
          href="/documentation/git-workflow/quick-reference"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View Quick Reference <ArrowRight className="w-4 h-4 inline ml-1" />
        </a>
      </div>
    </div>
  );
}
