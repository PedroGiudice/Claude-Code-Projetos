import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportButtons, ExportButtonsDropdown } from '@/components/stj/ExportButtons';
import { useSTJStore } from '@/store/stjStore';

// Mock the store
jest.mock('@/store/stjStore');

const mockUseSTJStore = useSTJStore as jest.MockedFunction<typeof useSTJStore>;

// Default mock state
const createMockState = (overrides = {}) => ({
  exportResults: jest.fn(),
  total: 100,
  ...overrides,
});

describe('ExportButtons Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSTJStore.mockReturnValue(createMockState());
  });

  describe('Rendering', () => {
    it('renders CSV and JSON buttons', () => {
      render(<ExportButtons />);
      expect(screen.getByRole('button', { name: /CSV/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /JSON/i })).toBeInTheDocument();
    });

    it('renders as a button group with proper role', () => {
      render(<ExportButtons />);
      expect(screen.getByRole('group', { name: /Exportar resultados/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<ExportButtons className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders compact version without text', () => {
      render(<ExportButtons compact />);
      expect(screen.queryByText('CSV')).not.toBeInTheDocument();
      expect(screen.queryByText('JSON')).not.toBeInTheDocument();
    });

    it('shows tooltip on compact buttons', () => {
      render(<ExportButtons compact />);
      const csvButton = screen.getAllByRole('button')[0];
      expect(csvButton).toHaveAttribute('title', 'Exportar CSV');
    });
  });

  describe('Export Actions', () => {
    it('calls exportResults with csv format when clicking CSV button', async () => {
      const exportResults = jest.fn().mockResolvedValue(undefined);
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        expect(exportResults).toHaveBeenCalledWith('csv');
      });
    });

    it('calls exportResults with json format when clicking JSON button', async () => {
      const exportResults = jest.fn().mockResolvedValue(undefined);
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /JSON/i }));

      await waitFor(() => {
        expect(exportResults).toHaveBeenCalledWith('json');
      });
    });

    it('shows loading state while exporting', async () => {
      const exportResults = jest.fn(() => new Promise(() => {})); // Never resolves
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        const csvButton = screen.getByRole('button', { name: /CSV/i });
        expect(csvButton.querySelector('.animate-spin')).toBeInTheDocument();
      });
    });

    it('disables both buttons while exporting', async () => {
      const exportResults = jest.fn(() => new Promise(() => {})); // Never resolves
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /CSV/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /JSON/i })).toBeDisabled();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables buttons when disabled prop is true', () => {
      render(<ExportButtons disabled />);
      expect(screen.getByRole('button', { name: /CSV/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /JSON/i })).toBeDisabled();
    });

    it('disables buttons when total is 0', () => {
      mockUseSTJStore.mockReturnValue(createMockState({ total: 0 }));

      render(<ExportButtons />);
      expect(screen.getByRole('button', { name: /CSV/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /JSON/i })).toBeDisabled();
    });

    it('shows hint when disabled due to no results', () => {
      mockUseSTJStore.mockReturnValue(createMockState({ total: 0 }));

      render(<ExportButtons />);
      expect(screen.getByText(/sem resultados/i)).toBeInTheDocument();
    });

    it('does not call exportResults when disabled', () => {
      const exportResults = jest.fn();
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults, total: 0 }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      expect(exportResults).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when export fails', async () => {
      const exportResults = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Erro ao exportar CSV/i);
      });
    });

    it('clears error after timeout', async () => {
      jest.useFakeTimers();
      const exportResults = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('re-enables buttons after error', async () => {
      const exportResults = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /CSV/i })).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /JSON/i })).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<ExportButtons />);
      const csvButton = screen.getByRole('button', { name: /CSV/i });
      expect(csvButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('associates error message with buttons', async () => {
      const exportResults = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtons />);
      fireEvent.click(screen.getByRole('button', { name: /CSV/i }));

      await waitFor(() => {
        const csvButton = screen.getByRole('button', { name: /CSV/i });
        expect(csvButton).toHaveAttribute('aria-describedby', 'export-error');
      });
    });
  });
});

describe('ExportButtonsDropdown Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSTJStore.mockReturnValue(createMockState());
  });

  describe('Rendering', () => {
    it('renders the dropdown trigger button', () => {
      render(<ExportButtonsDropdown />);
      expect(screen.getByRole('button', { name: /Exportar/i })).toBeInTheDocument();
    });

    it('does not show dropdown menu initially', () => {
      render(<ExportButtonsDropdown />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('opens dropdown on click', () => {
      render(<ExportButtonsDropdown />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /CSV/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /JSON/i })).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', () => {
      render(<ExportButtonsDropdown />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));

      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside (backdrop)
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes dropdown after selecting option', async () => {
      const exportResults = jest.fn().mockResolvedValue(undefined);
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtonsDropdown />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /CSV/i }));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('has proper aria-expanded attribute', () => {
      render(<ExportButtonsDropdown />);
      const trigger = screen.getByRole('button', { name: /Exportar/i });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper aria-haspopup attribute', () => {
      render(<ExportButtonsDropdown />);
      expect(screen.getByRole('button', { name: /Exportar/i })).toHaveAttribute(
        'aria-haspopup',
        'menu'
      );
    });
  });

  describe('Export Actions', () => {
    it('exports CSV when clicking CSV option', async () => {
      const exportResults = jest.fn().mockResolvedValue(undefined);
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtonsDropdown />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /CSV/i }));

      await waitFor(() => {
        expect(exportResults).toHaveBeenCalledWith('csv');
      });
    });

    it('exports JSON when clicking JSON option', async () => {
      const exportResults = jest.fn().mockResolvedValue(undefined);
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtonsDropdown />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /JSON/i }));

      await waitFor(() => {
        expect(exportResults).toHaveBeenCalledWith('json');
      });
    });

    it('shows loading state while exporting', async () => {
      const exportResults = jest.fn(() => new Promise(() => {})); // Never resolves
      mockUseSTJStore.mockReturnValue(createMockState({ exportResults }));

      render(<ExportButtonsDropdown />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /CSV/i }));

      await waitFor(() => {
        const trigger = screen.getByRole('button', { name: /Exportar/i });
        expect(trigger.querySelector('.animate-spin')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables trigger when disabled prop is true', () => {
      render(<ExportButtonsDropdown disabled />);
      expect(screen.getByRole('button', { name: /Exportar/i })).toBeDisabled();
    });

    it('disables trigger when total is 0', () => {
      mockUseSTJStore.mockReturnValue(createMockState({ total: 0 }));

      render(<ExportButtonsDropdown />);
      expect(screen.getByRole('button', { name: /Exportar/i })).toBeDisabled();
    });

    it('does not open dropdown when disabled', () => {
      render(<ExportButtonsDropdown disabled />);
      fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
