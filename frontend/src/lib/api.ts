export interface PredictRequest {
  country: string;
  crop: string;
  year: number;
  rainfall: number;
  pesticides: number;
  temp: number;
}

export interface PredictResponse {
  prediction: number;
  metrics: {
    country_avg: number;
    global_avg: number;
  };
  confidence_interval?: [number, number];
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

export const api = {
  predict: (data: PredictRequest) => fetchApi<PredictResponse>('/predict', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCrops: () => fetchApi<string[]>('/crops'),
  getCountries: () => fetchApi<string[]>('/countries'),
  getEda: () => fetchApi<any>('/eda'),
  getModelComparison: () => fetchApi<any>('/models/comparison'),
  getScenario: (params: any) => fetchApi<any>('/scenarios', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  getSurface: (crop: string) => fetchApi<any>(`/visuals/surface?crop=${encodeURIComponent(crop)}`),
  getActualVsPredicted: () => fetchApi<any>('/models/actual-vs-predicted'),
  getResiduals: () => fetchApi<any>('/models/residuals'),
  getBiasVariance: () => fetchApi<any>('/models/bias-variance'),
  getFeatureImportance: () => fetchApi<any>('/models/feature-importance'),
  getNonlinearFits: () => fetchApi<any>('/models/nonlinear-fits'),
  getDatasetInfo: () => fetchApi<any>('/dataset/info'),
  uploadDataset: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/dataset/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  }
};
