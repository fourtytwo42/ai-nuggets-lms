'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/src/lib/auth/client';

interface WatchedFolder {
  id: string;
  path: string;
  enabled: boolean;
  fileTypes: string[];
  recursive: boolean;
  autoProcess: boolean;
  createdAt: string;
}

interface MonitoredURL {
  id: string;
  url: string;
  enabled: boolean;
  checkInterval: number;
  lastChecked: string | null;
  createdAt: string;
}

interface IngestionJob {
  id: string;
  type: string;
  source: string;
  status: string;
  nuggetCount: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export default function IngestionPage() {
  const [folders, setFolders] = useState<WatchedFolder[]>([]);
  const [urls, setUrls] = useState<MonitoredURL[]>([]);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [folderForm, setFolderForm] = useState({
    path: '',
    enabled: true,
    fileTypes: ['pdf', 'docx', 'txt'],
    recursive: true,
    autoProcess: true,
  });

  const [urlForm, setUrlForm] = useState({
    url: '',
    enabled: true,
    checkInterval: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [foldersRes, urlsRes, jobsRes] = await Promise.all([
        fetchWithAuth('/api/admin/ingestion/folders'),
        fetchWithAuth('/api/admin/ingestion/urls'),
        fetchWithAuth('/api/admin/ingestion/jobs?limit=20'),
      ]);

      if (!foldersRes.ok || !urlsRes.ok || !jobsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [foldersData, urlsData, jobsData] = await Promise.all([
        foldersRes.json(),
        urlsRes.json(),
        jobsRes.json(),
      ]);

      setFolders(foldersData);
      setUrls(urlsData);
      setJobs(jobsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth('/api/admin/ingestion/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add folder');
      }

      setSuccess('Folder added successfully');
      setShowFolderForm(false);
      setFolderForm({
        path: '',
        enabled: true,
        fileTypes: ['pdf', 'docx', 'txt'],
        recursive: true,
        autoProcess: true,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add folder');
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth('/api/admin/ingestion/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(urlForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add URL');
      }

      setSuccess('URL added successfully');
      setShowUrlForm(false);
      setUrlForm({
        url: '',
        enabled: true,
        checkInterval: 5,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add URL');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/ingestion/folders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete folder');
      }

      setSuccess('Folder deleted successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const handleDeleteUrl = async (id: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/ingestion/urls/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete URL');
      }

      setSuccess('URL deleted successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete URL');
    }
  };

  const handleToggleFolder = async (folder: WatchedFolder) => {
    try {
      const response = await fetchWithAuth(`/api/admin/ingestion/folders/${folder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !folder.enabled }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update folder');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder');
    }
  };

  const handleToggleUrl = async (url: MonitoredURL) => {
    try {
      const response = await fetchWithAuth(`/api/admin/ingestion/urls/${url.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !url.enabled }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update URL');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update URL');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Content Ingestion</h1>

        {(error || success) && (
          <div
            className={`mb-6 p-4 rounded-md ${
              error
                ? 'bg-red-50 border border-red-200 text-red-600'
                : 'bg-green-50 border border-green-200 text-green-600'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="space-y-6">
          {/* Watched Folders */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Watched Folders</h2>
              <button
                onClick={() => setShowFolderForm(!showFolderForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                {showFolderForm ? 'Cancel' : 'Add Folder'}
              </button>
            </div>

            {showFolderForm && (
              <form onSubmit={handleAddFolder} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Path
                  </label>
                  <input
                    type="text"
                    value={folderForm.path}
                    onChange={(e) => setFolderForm({ ...folderForm, path: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/path/to/folder"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={folderForm.enabled}
                        onChange={(e) =>
                          setFolderForm({ ...folderForm, enabled: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={folderForm.recursive}
                        onChange={(e) =>
                          setFolderForm({ ...folderForm, recursive: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Recursive</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={folderForm.autoProcess}
                        onChange={(e) =>
                          setFolderForm({ ...folderForm, autoProcess: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Auto Process</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Types (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={folderForm.fileTypes.join(', ')}
                    onChange={(e) =>
                      setFolderForm({
                        ...folderForm,
                        fileTypes: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="pdf, docx, txt"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Add Folder
                </button>
              </form>
            )}

            {folders.length === 0 ? (
              <p className="text-gray-500">No watched folders configured.</p>
            ) : (
              <div className="space-y-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            folder.enabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="font-medium">{folder.path}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Types: {folder.fileTypes.join(', ')} | Recursive:{' '}
                        {folder.recursive ? 'Yes' : 'No'} | Auto Process:{' '}
                        {folder.autoProcess ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFolder(folder)}
                        className={`px-3 py-1 text-sm rounded ${
                          folder.enabled
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {folder.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monitored URLs */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Monitored URLs</h2>
              <button
                onClick={() => setShowUrlForm(!showUrlForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                {showUrlForm ? 'Cancel' : 'Add URL'}
              </button>
            </div>

            {showUrlForm && (
              <form onSubmit={handleAddUrl} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={urlForm.url}
                    onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={urlForm.enabled}
                        onChange={(e) =>
                          setUrlForm({ ...urlForm, enabled: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={urlForm.checkInterval}
                      onChange={(e) =>
                        setUrlForm({ ...urlForm, checkInterval: parseInt(e.target.value) || 5 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Add URL
                </button>
              </form>
            )}

            {urls.length === 0 ? (
              <p className="text-gray-500">No URLs being monitored.</p>
            ) : (
              <div className="space-y-2">
                {urls.map((url) => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            url.enabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="font-medium">{url.url}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Check Interval: {url.checkInterval} minutes | Last Checked:{' '}
                        {url.lastChecked ? new Date(url.lastChecked).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleUrl(url)}
                        className={`px-3 py-1 text-sm rounded ${
                          url.enabled
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {url.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteUrl(url.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingestion Jobs */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingestion Jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs to display.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nuggets
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {job.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                          {job.source}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : job.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {job.nuggetCount ?? '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
