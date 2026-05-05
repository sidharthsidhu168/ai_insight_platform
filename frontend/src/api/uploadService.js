import axiosClient from './axiosClient';

export const uploadService = {
  uploadFile: (formData) =>
    axiosClient.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getDatasets: () =>
    axiosClient.get('/upload/datasets'),

  getDatasetDetails: (datasetId) =>
    axiosClient.get(`/upload/datasets/${datasetId}`),
};
