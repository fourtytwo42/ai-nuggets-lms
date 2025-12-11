export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Console</h1>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <a
            href="/admin/ingestion"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Content Ingestion
              </h3>
              <p className="text-sm text-gray-500">
                Manage file watchers, URL monitoring, and ingestion jobs
              </p>
            </div>
          </a>

          <a
            href="/admin/nuggets"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nugget Store
              </h3>
              <p className="text-sm text-gray-500">
                Browse, edit, and manage learning nuggets
              </p>
            </div>
          </a>

          <a
            href="/admin/settings"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Settings
              </h3>
              <p className="text-sm text-gray-500">
                Configure AI models, voice settings, and system preferences
              </p>
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Analytics
              </h3>
              <p className="text-sm text-gray-500">
                View usage metrics, cost tracking, and learner analytics
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

