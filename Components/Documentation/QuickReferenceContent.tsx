'use client';

import React from 'react';
import { Rocket, Save, Cloud, RefreshCw, AlertTriangle, Terminal, BookOpen, Target, ArrowRight, Check } from 'lucide-react';

export default function QuickReferenceContent() {
  return (
    <div className="prose max-w-none">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Quick Reference Guide</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <p className="text-lg text-blue-900">
          A handy cheat sheet of all the Git commands you'll need for your daily work. Bookmark this page!
        </p>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Essential Git Commands</h2>

      <div className="space-y-6 mb-8">
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-6 py-3">
            <h3 className="text-lg font-semibold">Checking Status & Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git status
              </div>
              <p className="text-gray-700 text-sm">Check which branch you're on and what files have changed</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git branch
              </div>
              <p className="text-gray-700 text-sm">List all local branches (* shows current branch)</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git log
              </div>
              <p className="text-gray-700 text-sm">View commit history (press 'q' to exit)</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-blue-300 rounded-lg overflow-hidden">
          <div className="bg-blue-700 text-white px-6 py-3">
            <h3 className="text-lg font-semibold">Switching & Creating Branches</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git checkout develop
              </div>
              <p className="text-gray-700 text-sm">Switch to develop branch</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git checkout -b feature/branch-name
              </div>
              <p className="text-gray-700 text-sm">Create and switch to a new feature branch</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-green-300 rounded-lg overflow-hidden">
          <div className="bg-green-700 text-white px-6 py-3">
            <h3 className="text-lg font-semibold">Getting Latest Changes</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git pull origin develop
              </div>
              <p className="text-gray-700 text-sm">Download and merge latest changes from develop branch</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git fetch origin
              </div>
              <p className="text-gray-700 text-sm">Download changes from GitHub without merging</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-purple-300 rounded-lg overflow-hidden">
          <div className="bg-purple-700 text-white px-6 py-3">
            <h3 className="text-lg font-semibold">Saving Changes (Staging & Committing)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git add .
              </div>
              <p className="text-gray-700 text-sm">Stage all changed files</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git add filename.tsx
              </div>
              <p className="text-gray-700 text-sm">Stage a specific file</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git commit -m "Your descriptive message"
              </div>
              <p className="text-gray-700 text-sm">Commit staged changes with a message</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-orange-300 rounded-lg overflow-hidden">
          <div className="bg-orange-700 text-white px-6 py-3">
            <h3 className="text-lg font-semibold">Pushing to GitHub</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git push -u origin feature/branch-name
              </div>
              <p className="text-gray-700 text-sm">Push a new branch for the first time</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-2">
                git push
              </div>
              <p className="text-gray-700 text-sm">Push commits to existing branch (after using -u)</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Complete Workflows</h2>

      <div className="space-y-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2"><Rocket className="w-5 h-5" /> Starting a New Feature</h3>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-lg font-mono text-sm space-y-2">
            <div className="text-gray-400"># 1. Switch to develop</div>
            <div>git checkout develop</div>
            <div className="text-gray-400 mt-3"># 2. Get latest changes</div>
            <div>git pull origin develop</div>
            <div className="text-gray-400 mt-3"># 3. Create your feature branch</div>
            <div>git checkout -b feature/your-task-name</div>
            <div className="text-gray-400 mt-3"># 4. Verify you're on the new branch</div>
            <div>git branch</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2"><Save className="w-5 h-5" /> Saving Your Work</h3>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-lg font-mono text-sm space-y-2">
            <div className="text-gray-400"># 1. Check what changed</div>
            <div>git status</div>
            <div className="text-gray-400 mt-3"># 2. Stage all changes</div>
            <div>git add .</div>
            <div className="text-gray-400 mt-3"># 3. Verify files are staged (green)</div>
            <div>git status</div>
            <div className="text-gray-400 mt-3"># 4. Commit with descriptive message</div>
            <div>git commit -m "Add contact form with validation"</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-400 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2"><Cloud className="w-5 h-5" /> Pushing to GitHub</h3>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-lg font-mono text-sm space-y-2">
            <div className="text-gray-400"># First time pushing this branch</div>
            <div>git push -u origin feature/your-branch-name</div>
            <div className="text-gray-400 mt-3"># Future pushes (after using -u once)</div>
            <div>git push</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-orange-900 mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5" /> Making Changes After Creating PR</h3>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-lg font-mono text-sm space-y-2">
            <div className="text-gray-400"># 1. Make the requested changes in your editor</div>
            <div className="text-gray-400"># 2. Stage and commit</div>
            <div>git add .</div>
            <div>git commit -m "Fix issues from code review"</div>
            <div className="text-gray-400 mt-3"># 3. Push (PR automatically updates!)</div>
            <div>git push</div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Helpful Commands</h2>

      <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-2">
                git diff
              </div>
              <p className="text-gray-700 text-sm">See what you changed (before staging)</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-2">
                git log --oneline
              </div>
              <p className="text-gray-700 text-sm">View commit history in compact format</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-2">
                git branch -a
              </div>
              <p className="text-gray-700 text-sm">List all branches (local and remote)</p>
            </div>
            <div>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-2">
                git remote -v
              </div>
              <p className="text-gray-700 text-sm">Show remote repository URLs</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Commands to AVOID</h2>

      <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Dangerous Commands - Don't Use!</h3>
        <div className="space-y-3">
          <div className="bg-white border border-red-300 rounded p-4">
            <div className="font-mono text-sm text-red-700 mb-2">git push --force</div>
            <p className="text-sm text-red-900">Can delete other people's work. Never use unless team leader tells you to.</p>
          </div>
          <div className="bg-white border border-red-300 rounded p-4">
            <div className="font-mono text-sm text-red-700 mb-2">git reset --hard</div>
            <p className="text-sm text-red-900">Permanently deletes uncommitted changes. Very dangerous!</p>
          </div>
          <div className="bg-white border border-red-300 rounded p-4">
            <div className="font-mono text-sm text-red-700 mb-2">git clean -fd</div>
            <p className="text-sm text-red-900">Deletes untracked files permanently. Ask team leader first.</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Git Terminology</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Repository (Repo)</h3>
          <p className="text-gray-700 text-sm">A project folder tracked by Git, contains all files and history</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Branch</h3>
          <p className="text-gray-700 text-sm">A separate version of the code where you can work independently</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Commit</h3>
          <p className="text-gray-700 text-sm">A saved snapshot of your code at a specific point in time</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Staging Area</h3>
          <p className="text-gray-700 text-sm">Where you prepare files before committing (like a shopping cart)</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Origin</h3>
          <p className="text-gray-700 text-sm">The default name for your remote repository on GitHub</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Pull Request (PR)</h3>
          <p className="text-gray-700 text-sm">A request to merge your changes into another branch, requires review</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Merge</h3>
          <p className="text-gray-700 text-sm">Combining changes from one branch into another</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Clone</h3>
          <p className="text-gray-700 text-sm">Download a copy of a repository from GitHub to your computer</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Troubleshooting Quick Fixes</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Problem: "I'm on the wrong branch!"</h3>
          <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-2">
            git checkout correct-branch-name
          </div>
          <p className="text-sm text-yellow-900">Note: Commit or stash your changes first!</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Problem: "I forgot to pull before creating my branch!"</h3>
          <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm space-y-1">
            <div>git checkout develop</div>
            <div>git pull origin develop</div>
            <div>git checkout your-feature-branch</div>
            <div>git merge develop</div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Problem: "I made changes on develop instead of a feature branch!"</h3>
          <p className="text-sm text-yellow-900 mb-2">
            <strong>Don't panic!</strong> Take a screenshot and ask your team leader. They can help you move the changes to a new branch.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><Terminal className="w-5 h-5" /> Pro Tip: Create a Personal Cheat Sheet</h3>
        <p className="text-gray-700 mb-4">
          Keep a note on your desk or desktop with the commands you use most often. The more you use Git, the more these will become second nature!
        </p>
        <div className="bg-white border border-blue-300 rounded p-4">
          <p className="text-sm text-gray-700 font-semibold mb-2">Most used commands (in order):</p>
          <ol className="text-sm font-mono text-gray-700 space-y-1">
            <li>1. git status</li>
            <li>2. git add .</li>
            <li>3. git commit -m "message"</li>
            <li>4. git push</li>
            <li>5. git checkout develop</li>
            <li>6. git pull origin develop</li>
          </ol>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><Target className="w-5 h-5" /> You're All Set!</h3>
        <p className="text-gray-700 mb-4">
          You now have everything you need to work with Git confidently. Remember, practice makes perfect!
        </p>
        <div className="flex gap-3">
          <a
            href="/documentation/git-workflow/overview"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            ← Back to Overview
          </a>
          <a
            href="/documentation/git-workflow/best-practices"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Review Best Practices
          </a>
        </div>
      </div>
    </div>
  );
}
