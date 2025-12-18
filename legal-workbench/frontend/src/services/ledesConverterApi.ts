import axios from 'axios';

const API_BASE_URL = '/api/ledes'; // Corresponds to Traefik route

interface ConvertLedesResponse {
  filename: string;
  status: string;
  message?: string;
  ledes_content?: string;
}

export const ledesConverterApi = {
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  convertDocxToLedes: async (file: File): Promise<ConvertLedesResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/convert/docx-to-ledes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // In a real implementation, you might have a job polling mechanism here
  // getConversionStatus: async (jobId: string): Promise<ConversionStatus> => { ... }
  // getConversionResult: async (jobId: string): Promise<LedesContent> => { ... }
};
