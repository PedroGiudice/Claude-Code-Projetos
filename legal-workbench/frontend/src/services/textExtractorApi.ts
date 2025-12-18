import axios from 'axios';
import type {
  ExtractOptions,
  JobSubmitResponse,
  JobStatusResponse,
  ExtractionResult,
} from '@/types/textExtractor';

const API_BASE_URL = '/api/text/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const textExtractorApi = {
  /**
   * Submit extraction job
   */
  submitJob: async (file: File, options: ExtractOptions): Promise<JobSubmitResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('engine', options.engine);
    formData.append('use_gemini', String(options.useGemini));

    // Send options as JSON string
    const optionsPayload = {
      margins: options.margins,
      ignore_terms: options.ignoreTerms,
    };
    formData.append('options', JSON.stringify(optionsPayload));

    const response = await api.post<JobSubmitResponse>('/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Poll job status
   */
  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await api.get<JobStatusResponse>(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get extraction results
   */
  getJobResult: async (jobId: string): Promise<ExtractionResult> => {
    const response = await api.get<ExtractionResult>(`/jobs/${jobId}/result`);
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get<{ status: string }>('/health');
    return response.data;
  },
};
