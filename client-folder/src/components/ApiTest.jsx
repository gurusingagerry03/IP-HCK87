import { useState } from 'react';
import toast from 'react-hot-toast';
import http from '../helpers/http';

export default function ApiTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test basic connection
      const response = await http.get('/leagues');
      setResult(response.data);
      toast.success('API connection test successful!');
    } catch (err) {
      setError(err.message);
      toast.error(`API test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSpecificLeague = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await http.get('/leagues/2');
      setResult(response.data);
      toast.success('League API test successful!');
    } catch (err) {
      setError(err.message);
      toast.error(`League test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">API Test Component</h1>

        <div className="space-y-4 mb-6">
          <button
            onClick={testApi}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test All Leagues API'}
          </button>

          <button
            onClick={testSpecificLeague}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test League ID 2'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success!</strong>
            <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
