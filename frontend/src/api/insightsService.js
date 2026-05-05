import axiosClient from './axiosClient';

export const insightsService = {
  getSummary: (datasetId) =>
    axiosClient.get(`/insights/summary/${datasetId}`),

  getTrend: (datasetId, column) =>
    axiosClient.get(`/insights/trend/${datasetId}`, {
      params: { column },
    }),

  getAnomalies: (datasetId, column) =>
    axiosClient.get(`/insights/anomalies/${datasetId}`, {
      params: { column },
    }),

  runRegression: (datasetId, targetCol, featureCols) =>
    axiosClient.post(`/insights/regression/${datasetId}`, {
      target: targetCol,
      features: featureCols,
    }),

  runClustering: (datasetId, nClusters = 3) =>
    axiosClient.post(`/insights/cluster/${datasetId}`, {
      n_clusters: nClusters,
    }),
};
