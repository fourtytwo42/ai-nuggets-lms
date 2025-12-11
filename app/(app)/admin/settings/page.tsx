'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/src/lib/auth/client';

interface AIModelConfig {
  id: string;
  contentGenerationModel: string;
  narrativePlanningModel: string;
  tutoringModel: string;
  metadataModel: string;
  embeddingModel: string;
  contentGenerationTemp?: number | null;
  narrativePlanningTemp?: number | null;
  tutoringTemp?: number | null;
}

interface VoiceConfig {
  id: string;
  ttsProvider: 'openai-standard' | 'openai-hd' | 'elevenlabs';
  ttsModel?: string | null;
  ttsVoice?: string | null;
  sttProvider: 'openai-whisper' | 'elevenlabs';
  sttModel?: string | null;
  qualityTier: 'low' | 'mid' | 'high';
}

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  scope?: string | null;
  scopeId?: string | null;
}

export default function SettingsPage() {
  const [aiConfig, setAiConfig] = useState<AIModelConfig | null>(null);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [aiRes, voiceRes, systemRes] = await Promise.all([
        fetchWithAuth('/api/admin/settings/ai-models'),
        fetchWithAuth('/api/admin/settings/voice'),
        fetchWithAuth('/api/admin/settings/system'),
      ]);

      if (!aiRes.ok || !voiceRes.ok || !systemRes.ok) {
        throw new Error('Failed to load settings');
      }

      const [aiData, voiceData, systemData] = await Promise.all([
        aiRes.json(),
        voiceRes.json(),
        systemRes.json(),
      ]);

      setAiConfig(aiData);
      setVoiceConfig(voiceData);
      setSystemSettings(systemData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('ai');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth('/api/admin/settings/ai-models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save AI model configuration');
      }

      const data = await response.json();
      setAiConfig(data);
      setSuccess('AI model configuration saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save AI model configuration');
    } finally {
      setSaving(null);
    }
  };

  const saveVoiceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('voice');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth('/api/admin/settings/voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceConfig),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save voice configuration');
      }

      const data = await response.json();
      setVoiceConfig(data);
      setSuccess('Voice configuration saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save voice configuration');
    } finally {
      setSaving(null);
    }
  };

  const saveSystemSetting = async (key: string, value: any) => {
    setSaving('system');
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth('/api/admin/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          scope: 'system',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save system setting');
      }

      const data = await response.json();
      setSystemSettings((prev) => {
        const index = prev.findIndex((s) => s.key === key);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
      setSuccess(`System setting "${key}" saved successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save system setting');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading settings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

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
          {/* AI Model Configuration */}
          {aiConfig && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                AI Model Configuration
              </h2>
              <form onSubmit={saveAIConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Generation Model
                    </label>
                    <input
                      type="text"
                      value={aiConfig.contentGenerationModel}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, contentGenerationModel: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Narrative Planning Model
                    </label>
                    <input
                      type="text"
                      value={aiConfig.narrativePlanningModel}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, narrativePlanningModel: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tutoring Model
                    </label>
                    <input
                      type="text"
                      value={aiConfig.tutoringModel}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, tutoringModel: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metadata Model
                    </label>
                    <input
                      type="text"
                      value={aiConfig.metadataModel}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, metadataModel: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Embedding Model
                    </label>
                    <input
                      type="text"
                      value={aiConfig.embeddingModel}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, embeddingModel: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Generation Temperature
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={aiConfig.contentGenerationTemp ?? 0.7}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          contentGenerationTemp: parseFloat(e.target.value) || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Narrative Planning Temperature
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={aiConfig.narrativePlanningTemp ?? 0.8}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          narrativePlanningTemp: parseFloat(e.target.value) || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tutoring Temperature
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={aiConfig.tutoringTemp ?? 0.7}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          tutoringTemp: parseFloat(e.target.value) || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving === 'ai'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === 'ai' ? 'Saving...' : 'Save AI Model Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Voice Configuration */}
          {voiceConfig && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Voice Configuration
              </h2>
              <form onSubmit={saveVoiceConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TTS Provider
                    </label>
                    <select
                      value={voiceConfig.ttsProvider}
                      onChange={(e) =>
                        setVoiceConfig({
                          ...voiceConfig,
                          ttsProvider: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="openai-standard">OpenAI Standard</option>
                      <option value="openai-hd">OpenAI HD</option>
                      <option value="elevenlabs">ElevenLabs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TTS Model
                    </label>
                    <input
                      type="text"
                      value={voiceConfig.ttsModel || ''}
                      onChange={(e) =>
                        setVoiceConfig({ ...voiceConfig, ttsModel: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., tts-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TTS Voice
                    </label>
                    <input
                      type="text"
                      value={voiceConfig.ttsVoice || ''}
                      onChange={(e) =>
                        setVoiceConfig({ ...voiceConfig, ttsVoice: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., alloy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      STT Provider
                    </label>
                    <select
                      value={voiceConfig.sttProvider}
                      onChange={(e) =>
                        setVoiceConfig({
                          ...voiceConfig,
                          sttProvider: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="openai-whisper">OpenAI Whisper</option>
                      <option value="elevenlabs">ElevenLabs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      STT Model
                    </label>
                    <input
                      type="text"
                      value={voiceConfig.sttModel || ''}
                      onChange={(e) =>
                        setVoiceConfig({ ...voiceConfig, sttModel: e.target.value || null })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., whisper-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Tier
                    </label>
                    <select
                      value={voiceConfig.qualityTier}
                      onChange={(e) =>
                        setVoiceConfig({
                          ...voiceConfig,
                          qualityTier: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving === 'voice'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === 'voice' ? 'Saving...' : 'Save Voice Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* System Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
            <div className="space-y-4">
              {systemSettings.length === 0 ? (
                <p className="text-gray-500">No system settings configured.</p>
              ) : (
                systemSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {setting.key}
                      </label>
                      <input
                        type="text"
                        value={
                          typeof setting.value === 'string'
                            ? setting.value
                            : JSON.stringify(setting.value)
                        }
                        onChange={(e) => {
                          try {
                            const value = JSON.parse(e.target.value);
                            saveSystemSetting(setting.key, value);
                          } catch {
                            saveSystemSetting(setting.key, e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
