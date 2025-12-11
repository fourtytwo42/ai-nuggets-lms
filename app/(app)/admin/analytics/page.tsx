export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Nuggets</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">API Cost</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">$0.00</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Usage Metrics
          </h2>
          <p className="text-gray-500">No usage data available yet.</p>
        </div>
      </div>
    </div>
  );
}

