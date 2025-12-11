export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              AI Model Configuration
            </h2>
            <p className="text-gray-500">Configure AI models and settings.</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Voice Configuration
            </h2>
            <p className="text-gray-500">Configure voice settings for audio generation.</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              System Settings
            </h2>
            <p className="text-gray-500">Manage system-wide settings and preferences.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

