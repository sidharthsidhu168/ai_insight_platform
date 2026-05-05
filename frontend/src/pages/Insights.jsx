// frontend/src/pages/Insights.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { insightsService } from "../api/insightsService";
import './Insights.css';

const Insights = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const datasetId = searchParams.get('id');

  // State
  const [summary, setSummary] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  // Analysis results
  const [trendData, setTrendData] = useState(null);
  const [clusteringResult, setClusteringResult] = useState(null);
  const [anomaliesResult, setAnomaliesResult] = useState(null);

  // Loading states for each analysis
  const [analyzingTrend, setAnalyzingTrend] = useState(false);
  const [analyzingClustering, setAnalyzingClustering] = useState(false);
  const [analyzingAnomalies, setAnalyzingAnomalies] = useState(false);

  useEffect(() => {
    if (!datasetId) {
      setError('No dataset selected');
      return;
    }
    loadSummary();
  }, [datasetId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await insightsService.getSummary(datasetId);
      const data = response.data;

      setSummary(data);
      const numericCols = data.stats
        ? Object.keys(data.stats).filter(
          (col) =>
            typeof data.stats[col].mean === 'number' ||
            typeof data.stats[col].type === 'string'
        )
        : [];
      setColumns(numericCols);
      if (numericCols.length > 0) {
        setSelectedColumn(numericCols[0]);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to load dataset summary. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTrendAnalysis = async () => {
    if (!selectedColumn) {
      setError('Please select a column');
      return;
    }

    try {
      setAnalyzingTrend(true);
      setError('');
      const response = await insightsService.getTrend(datasetId, selectedColumn);
      const data = response.data;

      // Handle different response structures
      const values = data.trend?.values || data.values || [];
      const rollingMean = data.trend?.rolling_mean || data.rolling_mean || [];

      const chartData = values.map((val, idx) => ({
        index: idx,
        value: val,
        rolling: rollingMean[idx] || null,
      }));

      setTrendData(chartData);
      setActiveTab('trend');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to analyze trend. Please try again.'
      );
    } finally {
      setAnalyzingTrend(false);
    }
  };

  const handleClustering = async () => {
    try {
      setAnalyzingClustering(true);
      setError('');
      const response = await insightsService.runClustering(datasetId, 3);
      const data = response.data;

      // Handle nested response structure
      const analysis = data.analysis || data;
      setClusteringResult(analysis);
      setActiveTab('clustering');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to run clustering. Please try again.'
      );
    } finally {
      setAnalyzingClustering(false);
    }
  };

  const handleAnomalies = async () => {
    if (!selectedColumn) {
      setError('Please select a column');
      return;
    }

    try {
      setAnalyzingAnomalies(true);
      setError('');
      const response = await insightsService.getAnomalies(datasetId, selectedColumn);
      const data = response.data;

      setAnomaliesResult(data);
      setActiveTab('anomalies');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to detect anomalies. Please try again.'
      );
    } finally {
      setAnalyzingAnomalies(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="insights-container">
        <div className="error-page">
          <h2>❌ No Dataset Selected</h2>
          <p>Please select a dataset from the dashboard</p>
          <button onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="insights-container">
        <div className="loading-page">
          <p>⏳ Loading dataset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>🔍 Data Insights</h1>
        <p>Dataset ID: {datasetId.substring(0, 12)}...</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="insights-controls">
        <div className="column-select">
          <label>Select Column:</label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
          >
            <option value="">-- Choose a column --</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        <div className="analysis-buttons">
          <button
            className="btn btn-primary"
            onClick={handleTrendAnalysis}
            disabled={analyzingTrend || !selectedColumn}
          >
            {analyzingTrend ? '⏳ Analyzing...' : '📈 Trend Analysis'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleClustering}
            disabled={analyzingClustering}
          >
            {analyzingClustering ? '⏳ Clustering...' : '🎯 Clustering'}
          </button>

          <button
            className="btn btn-tertiary"
            onClick={handleAnomalies}
            disabled={analyzingAnomalies || !selectedColumn}
          >
            {analyzingAnomalies ? '⏳ Detecting...' : '⚠️ Anomalies'}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        {trendData && (
          <button
            className={`tab ${activeTab === 'trend' ? 'active' : ''}`}
            onClick={() => setActiveTab('trend')}
          >
            Trend
          </button>
        )}
        {clusteringResult && (
          <button
            className={`tab ${activeTab === 'clustering' ? 'active' : ''}`}
            onClick={() => setActiveTab('clustering')}
          >
            Clustering
          </button>
        )}
        {anomaliesResult && (
          <button
            className={`tab ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            Anomalies
          </button>
        )}
      </div>

      <div className="tab-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && summary && (
          <div className="summary-tab">
            <div className="summary-stats">
              <div className="stat-box">
                <span className="stat-icon">📊</span>
                <div>
                  <p className="stat-value">{summary.row_count}</p>
                  <p className="stat-label">Total Rows</p>
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-icon">🔤</span>
                <div>
                  <p className="stat-value">{summary.columns?.length}</p>
                  <p className="stat-label">Total Columns</p>
                </div>
              </div>
            </div>

            <div className="columns-info">
              <h3>📋 Column Details</h3>
              {summary.stats && Object.keys(summary.stats).length > 0 ? (
                <div className="stats-grid">
                  {Object.entries(summary.stats).map(([col, stats]) => (
                    <div key={col} className="stat-card">
                      <h4>{col}</h4>
                      {typeof stats.mean === 'number' ? (
                        <>
                          <p>
                            <strong>Mean:</strong> {stats.mean?.toFixed(2)}
                          </p>
                          <p>
                            <strong>Min:</strong> {stats.min?.toFixed(2)}
                          </p>
                          <p>
                            <strong>Max:</strong> {stats.max?.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong>Type:</strong> {typeof stats.type === 'string' ? stats.type : 'numeric'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No statistics available</p>
              )}
            </div>
          </div>
        )}

        {/* Trend Tab */}
        {activeTab === 'trend' && trendData && trendData.length > 0 && (
          <div className="trend-tab">
            <h3>📈 Trend: {selectedColumn}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#667eea"
                  name="Value"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="rolling"
                  stroke="#f59e0b"
                  name="5-period avg"
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Clustering Tab */}
        {activeTab === 'clustering' && clusteringResult && (
          <div className="clustering-tab">
            <h3>🎯 Clustering Analysis</h3>
            <div className="clustering-info">
              <div className="info-box">
                <p className="label">Number of Clusters</p>
                <p className="value">{clusteringResult.n_clusters}</p>
              </div>
              <div className="info-box">
                <p className="label">Total Samples</p>
                <p className="value">{clusteringResult.samples}</p>
              </div>
              <div className="info-box">
                <p className="label">Inertia</p>
                <p className="value">{clusteringResult.inertia}</p>
              </div>
            </div>

            <div className="cluster-distribution">
              <h4>Cluster Distribution</h4>
              {clusteringResult.cluster_sizes && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(clusteringResult.cluster_sizes).map(
                      ([cluster, size]) => ({
                        cluster: `Cluster ${cluster}`,
                        size,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cluster" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="size" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && anomaliesResult && (
          <div className="anomalies-tab">
            <h3>⚠️ Anomaly Detection: {anomaliesResult.column}</h3>
            <div className="anomalies-count">
              <p>Found: <strong>{anomaliesResult.count}</strong> anomalies</p>
            </div>

            {anomaliesResult.count > 0 ? (
              <div className="anomalies-list">
                {anomaliesResult.anomalies?.slice(0, 10).map((anomaly, idx) => (
                  <div key={idx} className="anomaly-item">
                    <pre>{JSON.stringify(anomaly, null, 2)}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-anomalies">✅ No anomalies detected in this column</p>
            )}
          </div>
        )}

        {/* Empty state */}
        {activeTab === 'summary' && (!summary || Object.keys(summary.stats || {}).length === 0) && (
          <div className="empty-tab">
            <p>📭 No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;