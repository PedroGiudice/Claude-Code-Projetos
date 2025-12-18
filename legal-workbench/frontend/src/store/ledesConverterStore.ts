import { create } from 'zustand';
import { ledesConverterApi } from '../services/ledesConverterApi';

interface LedesConversionState {
  file: File | null;
  isConverting: boolean;
  conversionResult: string | null;
  conversionError: string | null;
  uploadProgress: number; // 0-100
  setFile: (file: File | null) => void;
  convertFile: () => Promise<void>;
  reset: () => void;
}

export const useLedesConverterStore = create<LedesConversionState>((set, get) => ({
  file: null,
  isConverting: false,
  conversionResult: null,
  conversionError: null,
  uploadProgress: 0,

  setFile: (file) => set({ file, conversionResult: null, conversionError: null, uploadProgress: 0 }),

  convertFile: async () => {
    const { file } = get();
    if (!file) {
      set({ conversionError: 'No file selected for conversion.' });
      return;
    }

    set({ isConverting: true, conversionResult: null, conversionError: null, uploadProgress: 0 });

    try {
      // Simulate upload progress (axios doesn't directly expose progress for multipart/form-data easily in this setup)
      // In a real scenario, you'd integrate with axios progress events.
      set({ uploadProgress: 50 });

      const response = await ledesConverterApi.convertDocxToLedes(file);

      if (response.status === 'success' && response.ledes_content) {
        set({ conversionResult: response.ledes_content, uploadProgress: 100, isConverting: false });
      } else if (response.message) {
        set({ conversionError: response.message, isConverting: false });
      } else {
        set({ conversionError: 'Unknown conversion error.', isConverting: false });
      }
    } catch (error: any) {
      set({ conversionError: error.message || 'Failed to convert file.', isConverting: false });
    }
  },

  reset: () => set({
    file: null,
    isConverting: false,
    conversionResult: null,
    conversionError: null,
    uploadProgress: 0,
  }),
}));
