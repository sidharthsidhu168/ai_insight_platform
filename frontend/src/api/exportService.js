import axiosClient from './axiosClient';

export const exportService = {
  exportCSV: (datasetId) =>
    axiosClient.get(`/export/csv/${datasetId}`, {
      responseType: 'blob',
    }),

  exportPDF: (datasetId) =>
    axiosClient.get(`/export/pdf/${datasetId}`, {
      responseType: 'blob',
    }),
};
