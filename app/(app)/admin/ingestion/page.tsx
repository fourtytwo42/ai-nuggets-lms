export default function IngestionPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Content Ingestion
        </h1>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Watched Folders
            </h2>
            <p className="text-gray-500 mb-4">No watched folders configured.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
              Add Folder
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Monitored URLs
            </h2>
            <p className="text-gray-500 mb-4">No URLs being monitored.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
              Add URL
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ingestion Jobs
            </h2>
            <p className="text-gray-500">No jobs to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

