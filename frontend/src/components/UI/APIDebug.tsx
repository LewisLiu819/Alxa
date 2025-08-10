import React, { useState } from 'react';
import { ndviApi } from '@/services/api';

const APIDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAPI = async () => {
    setIsLoading(true);
    try {
      // Test basic health check
      const health = await ndviApi.healthCheck();
      console.log('Health check:', health);
      
      // Test files endpoint
      const files = await ndviApi.getAvailableFiles();
      console.log('Files:', files);
      
      // Test time series with coordinates within dataset bounds (103-105.2°E, 37.5-39.0°N)
      const timeSeries = await ndviApi.getTimeSeries(38.2, 104.0, 2017, 2019);
      console.log('Time series:', timeSeries);
      
      setTestResult({
        status: 'success',
        health,
        filesCount: files.count,
        timeSeriesPoints: timeSeries.data.length,
        sampleData: timeSeries.data[0] || null
      });
    } catch (error) {
      console.error('API Test Error:', error);
      setTestResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">API Debug</h3>
      <button
        onClick={testAPI}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test API'}
      </button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">Result:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default APIDebug;