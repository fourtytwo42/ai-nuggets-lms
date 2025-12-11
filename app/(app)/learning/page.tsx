export default function LearningPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Learning</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Start Learning Session
          </h2>
          <p className="text-gray-600 mb-4">
            Begin a new adaptive learning session with AI-powered tutoring.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
            Start Session
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Nuggets
          </h2>
          <p className="text-gray-500">No learning nuggets available yet.</p>
        </div>
      </div>
    </div>
  );
}

