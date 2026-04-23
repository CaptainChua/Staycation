'use client';

/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import {
  GitPullRequest,
  Eye,
  Check,
  X,
  AlertTriangle,
  Info,
  Lightbulb,
  MessageCircle,
  Shield,
  Sparkles,
  Play
} from 'lucide-react';

export default function PullRequestsContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Pull Requests & Assigning Reviewer</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            A Pull Request (PR) is how you ask your team leader to review and merge your code into the develop branch.
            Think of it as saying "Hey, I finished my feature. Can you check it before we add it to the main codebase?"
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">What is a Pull Request?</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        A Pull Request is a way to:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400 p-4 md:p-5 rounded-r-lg">
          <div className="flex items-start gap-3 mb-2">
            <Eye className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-purple-700 dark:text-purple-400">Show Your Work</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Let others see what you changed, why you changed it, and how it works
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4 md:p-5 rounded-r-lg">
          <div className="flex items-start gap-3 mb-2">
            <Check className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-400">Get Approval</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Team leader reviews your code and approves it before it's merged
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-5 rounded-r-lg">
          <div className="flex items-start gap-3 mb-2">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-blue-700 dark:text-blue-400">Discuss Changes</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Have conversations about the code and make improvements
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 dark:border-orange-400 p-4 md:p-5 rounded-r-lg">
          <div className="flex items-start gap-3 mb-2">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-lg md:text-xl font-semibold text-orange-700 dark:text-orange-400">Protect Production</h3>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Ensures no unreviewed code goes to production (main branch)
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 1: Go to GitHub</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        After pushing your branch, go to your repository on GitHub. You&apos;ll likely see a yellow banner at the top:
      </p>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 md:p-5 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-yellow-400 dark:border-yellow-600 rounded p-4 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">
              <strong>feature-add-contact-form</strong> had recent pushes 2 minutes ago
            </span>
            <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold text-sm md:text-base">
              Compare & pull request
            </button>
          </div>
        </div>
        <p className="text-xs md:text-sm text-yellow-900 dark:text-yellow-200">
          Click the green <strong>"Compare & pull request"</strong> button!
        </p>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300">Don't see the yellow banner?</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3">No problem! You can create a PR manually:</p>
        <ol className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li>1. Click the <strong>"Pull requests"</strong> tab at the top</li>
          <li>2. Click the green <strong>"New pull request"</strong> button</li>
          <li>3. Select your feature branch from the "compare" dropdown</li>
          <li>4. Make sure "base" is set to <strong>develop</strong> (not main!)</li>
        </ol>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 2: Fill Out the Pull Request Form</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        You&apos;ll see a form to describe your changes. Here&apos;s what to fill in:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Title</h3>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-600 mb-4">
          <input
            type="text"
            placeholder="Add contact form to contact page"
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm md:text-base"
            readOnly
          />
        </div>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-6">
          Write a clear, concise title that describes what this PR does
        </p>

        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Description</h3>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-600 overflow-x-auto">
          <textarea
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 font-mono text-xs md:text-sm"
            rows={8}
            readOnly
            value={`## What does this PR do?
This PR adds a contact form component to the contact page with email validation.

## Changes made:
- Created ContactForm component
- Added form validation for email and message
- Added success/error messages
- Updated contact page styling

## Testing:
- Tested form submission with valid and invalid emails
- Verified error messages display correctly
- Checked mobile responsiveness`}
          />
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">Good PR Description Template:</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-300 dark:border-green-700 font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 mb-3 overflow-x-auto">
          ## What does this PR do?<br />
          [Brief explanation of the feature or fix]<br />
          <br />
          ## Changes made:<br />
          - [List the main changes]<br />
          - [Be specific]<br />
          <br />
          ## Testing:<br />
          - [What you tested]<br />
          - [How you tested it]
        </div>
        <p className="text-xs md:text-sm text-green-800 dark:text-green-300">
          This helps your team leader understand what you did and how to review it!
        </p>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 3: Verify the Base Branch</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        This is <strong>CRITICAL</strong>! Make sure you're merging into the correct branch:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="flex-1 w-full">
            <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">base:</label>
            <select className="w-full border-2 border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 rounded px-3 py-2 font-semibold text-sm md:text-base">
              <option>develop</option>
            </select>
          </div>
          <div className="text-xl md:text-2xl text-gray-400">←</div>
          <div className="flex-1 w-full">
            <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">compare:</label>
            <select className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm md:text-base">
              <option>feature-add-contact-form</option>
            </select>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4">
          <p className="text-sm md:text-base text-green-900 dark:text-green-200 font-semibold">
            <Check className="w-4 h-4 inline mr-2" />
            Correct: base = <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">develop</code>, compare = <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">your feature branch</code>
          </p>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-red-800 dark:text-red-300">NEVER DO THIS:</h3>
        </div>
        <p className="text-sm md:text-base text-red-900 dark:text-red-200 mb-3">
          Don't merge your feature branch into <strong>main</strong>! Always merge into <strong>develop</strong>.
        </p>
        <div className="bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 rounded p-4">
          <p className="text-sm md:text-base text-red-900 dark:text-red-300">
            <X className="w-4 h-4 inline mr-2" />
            base = <code className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">main</code> ← WRONG!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 4: Assign the Team Leader as Reviewer</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        On the right side of the PR form, you&apos;ll see a &quot;Reviewers&quot; section:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded p-4 mb-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3 text-sm md:text-base">Reviewers</h4>
          <div className="bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-600 p-3">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">Click to assign a reviewer</p>
            <div className="flex items-center gap-2 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded cursor-pointer">
              <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                TL
              </div>
              <span className="font-semibold text-sm md:text-base">Team Leader Name</span>
            </div>
          </div>
        </div>
        <p className="text-xs md:text-sm text-purple-900 dark:text-purple-200">
          <strong>Important:</strong> Always assign your team leader as the reviewer. They need to approve all PRs before merging!
        </p>
      </div>

      <ol className="space-y-4 mb-8">
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
          <div className="flex-1">
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">Click on the <strong>"Reviewers"</strong> section</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
          <div className="flex-1">
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">Search for your team leader's name</p>
          </div>
        </li>
        <li className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
          <div className="flex-1">
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">Click on their name to assign them</p>
          </div>
        </li>
      </ol>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 5: Create the Pull Request</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Once everything is filled out correctly:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 md:p-6 mb-8">
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-base md:text-lg w-full">
          Create pull request
        </button>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
          Click this button to create your PR!
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">After Creating the PR:</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>Your team leader will receive a notification</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>They can review your code and leave comments</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>You&apos;ll be notified if they request changes</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>Once approved, they'll merge it into develop</span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">What Happens Next?</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-5 rounded-r-lg">
          <h3 className="text-lg md:text-xl font-semibold text-blue-700 dark:text-blue-400 mb-2">1. Team Leader Reviews</h3>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            They'll look at your code, test it, and may leave comments or suggestions
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-5 rounded-r-lg">
          <h3 className="text-lg md:text-xl font-semibold text-yellow-700 dark:text-yellow-400 mb-2">2. You Might Need to Make Changes</h3>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            If they request changes, make the updates on your local branch, commit, and push. The PR will automatically update!
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4 md:p-5 rounded-r-lg">
          <h3 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-400 mb-2">3. Approval & Merge</h3>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Once approved, your team leader will merge your branch into develop. Your feature is now part of the main codebase!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Making Changes After Creating PR</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        If your team leader requests changes, here's what to do:
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-3 overflow-x-auto">
          <div>
            <div className="text-gray-400 text-xs mb-1"># 1. Make the requested changes in your code editor</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1"># 2. Stage and commit the changes</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git add .</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git commit -m "Fix validation logic as requested"</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># 3. Push the changes</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git push</span>
            </div>
          </div>
          <div className="mt-3 text-green-300 text-xs">
            The PR will automatically update with your new commits!
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Why This Workflow Protects Production</h2>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">How Pull Requests Keep Main Branch Safe:</h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="text-2xl md:text-3xl">1</span>
            <div>
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100">No Direct Changes to Main</h4>
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                By working on feature branches and merging to develop first, main (production) stays stable
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl md:text-3xl">2</span>
            <div>
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100">Code Review Catches Bugs</h4>
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                Team leader reviews code before it's merged, finding issues before they reach production
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl md:text-3xl">3</span>
            <div>
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100">Testing in Develop First</h4>
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                Features are tested in develop branch before they ever touch main/production
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-2xl md:text-3xl">4</span>
            <div>
              <h4 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100">Easy to Revert</h4>
              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                If something goes wrong, we can easily undo a merge without affecting other work
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300">Important Reminders</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-yellow-900 dark:text-yellow-200">
          <li className="flex gap-2">
            <span>•</span>
            <span><strong>Always</strong> assign your team leader as reviewer</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span><strong>Never</strong> merge your own PRs (unless you're the team leader)</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span><strong>Always</strong> merge into develop, never into main</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Write clear PR descriptions so reviewers understand your changes</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <Play className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Pull Request Created!</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Great job! Now let&apos;s learn some best practices to make your Git workflow even smoother.
        </p>
        <a
          href="/documentation/git-workflow/best-practices"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Next: Best Practices →
        </a>
      </div>
    </div>
  );
}
