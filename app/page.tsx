import Link from 'next/link';

export default function SplashPage() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-6xl font-bold tracking-wide mb-4">
          AI Microlearning LMS
        </h1>
        <p className="text-white text-xl text-gray-300 mb-8">
          Zero-human-authoring adaptive microlearning platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/learning"
            className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-black transition-colors"
          >
            Start Learning
          </Link>
        </div>
      </div>
    </div>
  );
}
