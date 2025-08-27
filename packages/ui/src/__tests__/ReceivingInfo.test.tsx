import { getBankReserve } from '@repo/constants';
import { render, screen } from '@testing-library/react';

import { ReceivingInfo } from '../components/exchange/ReceivingInfo';

// Mock dependencies
jest.mock('@repo/constants', () => ({
  getBankReserve: jest.fn(),
}));

const mockGetBankReserve = getBankReserve as jest.MockedFunction<typeof getBankReserve>;

interface MockFormType {
  values: Record<string, unknown>;
}

const createMockForm = (values: Record<string, unknown>): MockFormType => ({
  values,
});

const mockT = (key: string): string => {
  const translations = new Map([
    ['receiving.reserve', 'Резерв'],
    ['receiving.processing', 'Обработка до 30 минут'],
  ]);
  return translations.get(key) ?? key;
};

const renderReceivingInfo = (form: MockFormType, props = {}) =>
  render(<ReceivingInfo form={form as never} t={mockT} {...props} />);

const setupBasicTest = () => {
  mockGetBankReserve.mockReturnValue(10000000);
  return createMockForm({
    toCurrency: 'UAH',
    selectedBankId: 'privatbank',
  });
};

const setupCustomFieldsTest = () => {
  mockGetBankReserve.mockReturnValue(5000000);
  return createMockForm({
    customCurrency: 'UAH',
    customBank: 'privatbank',
  });
};

describe('ReceivingInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders correctly with currency and bank', () => {
      const mockForm = setupBasicTest();

      renderReceivingInfo(mockForm, {
        currencyFieldName: 'toCurrency',
        bankFieldName: 'selectedBankId',
      });

      expect(screen.getByText(/Резерв: 10,000,000 UAH/)).toBeInTheDocument();
      expect(screen.getByText('Обработка до 30 минут')).toBeInTheDocument();
    });

    it('does not render when no currency selected', () => {
      const mockForm = createMockForm({
        toCurrency: null,
        selectedBankId: 'privatbank',
      });

      const { container } = renderReceivingInfo(mockForm);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Custom configuration', () => {
    it('uses custom field names', () => {
      const mockForm = setupCustomFieldsTest();

      renderReceivingInfo(mockForm, {
        currencyFieldName: 'customCurrency',
        bankFieldName: 'customBank',
      });

      expect(mockGetBankReserve).toHaveBeenCalledWith('privatbank', 'UAH');
      expect(screen.getByText(/Резерв: 5,000,000 UAH/)).toBeInTheDocument();
    });

    it('uses custom processing time when provided', () => {
      mockGetBankReserve.mockReturnValue(1000000);
      const mockForm = createMockForm({
        toCurrency: 'UAH',
        selectedBankId: 'privatbank',
      });

      renderReceivingInfo(mockForm, {
        processingTime: 'Мгновенно',
      });

      expect(screen.getByText('Мгновенно')).toBeInTheDocument();
      expect(screen.queryByText('Обработка до 30 минут')).not.toBeInTheDocument();
    });
  });

  describe('Number formatting', () => {
    it('formats large numbers correctly', () => {
      mockGetBankReserve.mockReturnValue(1234567890);
      const mockForm = createMockForm({
        toCurrency: 'UAH',
        selectedBankId: 'privatbank',
      });

      renderReceivingInfo(mockForm);

      expect(screen.getByText(/Резерв: 1,234,567,890 UAH/)).toBeInTheDocument();
    });
  });
});
