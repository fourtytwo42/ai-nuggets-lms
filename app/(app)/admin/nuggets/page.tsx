export default function NuggetsPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nugget Store</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
            Create Nugget
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search nuggets..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-gray-500">No nuggets found.</p>
        </div>
      </div>
    </div>
  );
}

