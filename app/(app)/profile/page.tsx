export default function ProfilePage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                defaultValue="User Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                defaultValue="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                defaultValue="learner"
                disabled
              />
            </div>
            <div className="pt-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

