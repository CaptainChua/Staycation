'use client';

import React from 'react';
import {
  Save,
  Check,
  X,
  AlertTriangle,
  Info,
  Lightbulb,
  FileText,
  Target,
  Play
} from 'lucide-react';

export default function WorkingOnFeaturesContent() {
  return (
    <div className="w-full">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Working on Feature Branches</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <p className="text-base md:text-lg text-blue-900 dark:text-blue-100">
            Now that you have your feature branch, let's learn how to make changes and save them properly!
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">The Save Process (Staging & Committing)</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        In Git, saving your work is a two-step process:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400 p-4 md:p-5 rounded-r-lg">
          <h3 className="text-lg md:text-xl font-semibold text-purple-700 dark:text-purple-400 mb-2">Step 1: Staging</h3>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Select which changes you want to save (like adding items to a shopping cart)
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4 md:p-5 rounded-r-lg">
          <h3 className="text-lg md:text-xl font-semibold text-green-700 dark:text-green-400 mb-2">Step 2: Committing</h3>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Actually save the changes with a message describing what you did (like checking out)
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 1: Make Your Changes</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Edit your code files in VS Code or your favorite editor. For example:
      </p>

      <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6">
        <li className="flex gap-2">
          <span className="text-blue-600 dark:text-blue-400">•</span>
          <span>Add new components</span>
        </li>
        <li className="flex gap-2">
          <span className="text-blue-600 dark:text-blue-400">•</span>
          <span>Fix bugs</span>
        </li>
        <li className="flex gap-2">
          <span className="text-blue-600 dark:text-blue-400">•</span>
          <span>Update styles</span>
        </li>
        <li className="flex gap-2">
          <span className="text-blue-600 dark:text-blue-400">•</span>
          <span>Modify existing features</span>
        </li>
      </ul>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Pro Tip</h3>
            <p className="text-sm md:text-base text-yellow-900 dark:text-yellow-200">
              Test your changes locally before committing! Make sure everything works as expected.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 2: Check What Changed</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        See which files you modified:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git status</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 md:p-5 rounded-lg mb-8">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">You'll see something like:</h3>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          On branch feature/add-contact-form<br />
          Changes not staged for commit:<br />
          <span className="text-red-600 ml-4">modified:   app/contact/page.tsx</span><br />
          <span className="text-red-600 ml-4">modified:   Components/ContactForm.tsx</span><br />
          <br />
          Untracked files:<br />
          <span className="text-red-600 ml-4">Components/NewComponent.tsx</span>
        </div>
        <div className="mt-4 space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
          <p><span className="text-red-600 font-semibold">Red files</span> = Changes not yet staged (not in the "shopping cart")</p>
          <p><span className="text-green-600 font-semibold">Green files</span> = Changes staged and ready to commit</p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 3: Stage Your Changes</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Add your changes to the staging area. You have two options:
      </p>

      <div className="space-y-6 mb-8">
        <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">Option 1: Stage All Changes (Most Common)</h3>
          <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm mb-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git add .</span>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            The <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.</code> (dot) means "add all changed files"
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">Option 2: Stage Specific Files</h3>
          <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm mb-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git add app/contact/page.tsx</span>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            Use this when you only want to commit certain files
          </p>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 4: Verify Staged Changes</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Check that your files are staged (in green):
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
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">Now you should see:</h3>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-300 dark:border-green-700 font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          On branch feature/add-contact-form<br />
          Changes to be committed:<br />
          <span className="text-green-600 ml-4">modified:   app/contact/page.tsx</span><br />
          <span className="text-green-600 ml-4">modified:   Components/ContactForm.tsx</span><br />
          <span className="text-green-600 ml-4">new file:   Components/NewComponent.tsx</span>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Step 5: Commit Your Changes</h2>
      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Save your staged changes with a descriptive message:
      </p>

      <div className="bg-gray-900 text-gray-100 p-4 md:p-6 rounded-lg mb-6 font-mono text-xs md:text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-400">$</span>
          <span>git commit -m "Add contact form to contact page"</span>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 md:p-5 rounded-lg mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300">What does this mean?</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">git commit</code> = Save the changes</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">-m</code> = Add a message</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">"..."</code> = Your commit message (always in quotes!)</span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Writing Good Commit Messages</h2>
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 md:p-6 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-300">Good Commit Messages:</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 font-mono">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>"Add login button to navbar"</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>"Fix booking form validation error"</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>"Update room card design with new colors"</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
            <span>"Remove unused imports from dashboard"</span>
          </li>
        </ul>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-red-800 dark:text-red-300">Bad Commit Messages:</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300 font-mono">
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <span>"Fixed stuff"</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400 not-font-mono">(too vague)</span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <span>"asdfasdf"</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400 not-font-mono">(meaningless)</span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <span>"Changes"</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400 not-font-mono">(not descriptive)</span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <span>"Update"</span>
              <span className="text-xs md:text-sm text-red-700 dark:text-red-400 not-font-mono">(what did you update?)</span>
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-blue-800 dark:text-blue-300">Commit Message Tips:</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Start with a verb (Add, Fix, Update, Remove, etc.)</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Be specific about what changed</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Keep it short but descriptive (under 50 characters is ideal)</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Use present tense ("Add feature" not "Added feature")</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <span>Don't end with a period</span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">Complete Workflow Example</h2>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 mb-8">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Making and saving changes:</h3>
        <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-lg font-mono text-xs md:text-sm space-y-3 overflow-x-auto">
          <div>
            <div className="text-gray-400 text-xs mb-1"># 1. Check what you changed</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git status</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># 2. Stage all changes</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git add .</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># 3. Verify files are staged (should be green)</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git status</span>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1 mt-3"># 4. Commit with a descriptive message</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>git commit -m "Add contact form with email validation"</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 md:p-6 mb-8 rounded-r-lg">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-300">Common Mistakes to Avoid</h3>
        </div>
        <ul className="space-y-2 text-sm md:text-base text-yellow-900 dark:text-yellow-200">
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Forgetting to stage files before committing (they won't be saved!)</span>
          </li>
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Using unclear commit messages like "update" or "fix"</span>
          </li>
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Committing too many unrelated changes at once</span>
          </li>
          <li className="flex gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-1" />
            <span>Not testing your code before committing</span>
          </li>
        </ul>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <Target className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <h3 className="text-base md:text-lg font-semibold text-purple-800 dark:text-purple-300">Best Practice: Commit Often!</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-3">
          Don't wait until the end of the day to commit. Make small, logical commits as you complete each part:
        </p>
        <ul className="space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
            <span>Commit #1: "Add contact form component"</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
            <span>Commit #2: "Add form validation logic"</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
            <span>Commit #3: "Add success message after submission"</span>
          </li>
          <li className="flex gap-2 items-start">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
            <span>Commit #4: "Update contact page styling"</span>
          </li>
        </ul>
        <p className="text-sm md:text-base text-purple-900 dark:text-purple-200 mt-3 font-semibold">
          This makes it easier to track changes and undo specific parts if needed!
        </p>
      </div>

      <div className="mt-12 p-4 md:p-6 bg-gradient-to-r from-brand-primaryLighter to-brand-primarySoft dark:from-gray-800 dark:to-gray-700 rounded-lg border border-brand-primaryLight dark:border-gray-600">
        <div className="flex items-start gap-3 mb-3">
          <Play className="w-6 h-6 text-brand-primaryDark dark:text-brand-primaryLight flex-shrink-0" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Changes Saved Locally!</h3>
        </div>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
          Your commits are saved on your computer. Next, let's learn how to push them to GitHub!
        </p>
        <a
          href="/documentation/git-workflow/pushing-to-github"
          className="inline-block bg-brand-primary hover:bg-brand-primaryDark text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
        >
          Next: Pushing to GitHub →
        </a>
      </div>
    </div>
  );
}
