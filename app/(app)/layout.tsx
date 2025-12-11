import Link from 'next/link';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href="/dashboard"
                className="flex items-center px-4 text-xl font-bold text-gray-900 hover:text-blue-600"
              >
                AI Microlearning LMS
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/learning"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
                >
                  Learning
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
                >
                  Admin
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Profile
              </Link>
              <Link
                href="/api/auth/logout"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

