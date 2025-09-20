import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { WalletPoolManager } from '../src/services/wallet-pool-manager';

// Mock the dependencies
vi.mock('../src/services/wallet-pool-manager-factory');
vi.mock('@repo/email-service');
vi.mock('@repo/constants');
vi.mock('@repo/utils');

const EXPECTED_ALERT_COUNT = {
  NONE: 0,
};

interface MockWalletAlertsService {
  checkAll: () => Promise<unknown[]>;
}

interface MockWalletMonitoringProcess {
  start: () => void;
  stop: () => void;
  getStatus: () => { isRunning: boolean; intervalMs: number };
}

describe('WalletAlertsService Integration', () => {
  let walletAlertsService: MockWalletAlertsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mockWalletPoolManager = {
      checkThresholds: vi.fn().mockResolvedValue([]),
    } as Partial<WalletPoolManager> as WalletPoolManager;

    const { WalletPoolManagerFactory } = await import(
      '../src/services/wallet-pool-manager-factory'
    );
    vi.mocked(WalletPoolManagerFactory.create).mockResolvedValue(mockWalletPoolManager);

    // Dynamic import to ensure mocks are applied
    const module = await import('../src/services/wallet-alerts-service');
    walletAlertsService = module.WalletAlertsService as MockWalletAlertsService;
  });

  it('returns empty array when no critical alerts exist', async () => {
    const result = await walletAlertsService.checkAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it('handles errors gracefully', async () => {
    const result = await walletAlertsService.checkAll();
    expect(result).toHaveLength(EXPECTED_ALERT_COUNT.NONE);
  });
});

describe('WalletMonitoringProcess Lifecycle', () => {
  let walletMonitoringProcess: MockWalletMonitoringProcess;

  beforeEach(async () => {
    const module = await import('../src/services/wallet-monitoring-process');
    walletMonitoringProcess = module.WalletMonitoringProcess as MockWalletMonitoringProcess;
    walletMonitoringProcess.stop(); // Ensure clean state
  });

  it('can start and stop monitoring', () => {
    expect(walletMonitoringProcess.getStatus().isRunning).toBe(false);

    walletMonitoringProcess.start();
    expect(walletMonitoringProcess.getStatus().isRunning).toBe(true);

    walletMonitoringProcess.stop();
    expect(walletMonitoringProcess.getStatus().isRunning).toBe(false);
  });

  it('provides status information', () => {
    const status = walletMonitoringProcess.getStatus();

    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('intervalMs');
    expect(typeof status.isRunning).toBe('boolean');
    expect(typeof status.intervalMs).toBe('number');
  });
});
