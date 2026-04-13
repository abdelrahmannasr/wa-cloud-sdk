/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppMultiAccount } from '../../src/multi-account/multi-account.js';
import type { AccountConfig } from '../../src/multi-account/types.js';
import { ValidationError } from '../../src/errors/errors.js';
import { WhatsApp } from '../../src/whatsapp.js';

// Mock the WhatsApp class
vi.mock('../../src/whatsapp.js', () => ({
  WhatsApp: vi.fn().mockImplementation((config) => ({
    config,
    destroy: vi.fn(),
  })),
}));

describe('WhatsAppMultiAccount', () => {
  const validAccounts: AccountConfig[] = [
    {
      name: 'business-a',
      accessToken: 'TOKEN_A',
      phoneNumberId: 'PHONE_A',
      businessAccountId: 'WABA_A',
    },
    {
      name: 'business-b',
      accessToken: 'TOKEN_B',
      phoneNumberId: 'PHONE_B',
      businessAccountId: 'WABA_B',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        apiVersion: 'v21.0',
        timeoutMs: 30000,
      });

      expect(manager).toBeInstanceOf(WhatsAppMultiAccount);
    });

    it('should throw ValidationError when accounts array is empty', () => {
      expect(
        () =>
          new WhatsAppMultiAccount({
            accounts: [],
          }),
      ).toThrow(ValidationError);

      try {
        new WhatsAppMultiAccount({
          accounts: [],
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('accounts');
      }
    });

    it('should throw ValidationError when account missing name', () => {
      expect(
        () =>
          new WhatsAppMultiAccount({
            accounts: [
              {
                name: '',
                accessToken: 'TOKEN',
                phoneNumberId: 'PHONE',
              },
            ],
          }),
      ).toThrow('account name is required and cannot be empty');

      try {
        new WhatsAppMultiAccount({
          accounts: [
            {
              name: '   ',
              accessToken: 'TOKEN',
              phoneNumberId: 'PHONE',
            },
          ],
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });

    it('should throw ValidationError when account missing accessToken', () => {
      expect(
        () =>
          new WhatsAppMultiAccount({
            accounts: [
              {
                name: 'business-a',
                accessToken: '',
                phoneNumberId: 'PHONE',
              },
            ],
          }),
      ).toThrow('account accessToken is required and cannot be empty');
    });

    it('should throw ValidationError when account missing phoneNumberId', () => {
      expect(
        () =>
          new WhatsAppMultiAccount({
            accounts: [
              {
                name: 'business-a',
                accessToken: 'TOKEN',
                phoneNumberId: '',
              },
            ],
          }),
      ).toThrow('account phoneNumberId is required and cannot be empty');
    });

    it('should throw ValidationError for duplicate account names', () => {
      expect(
        () =>
          new WhatsAppMultiAccount({
            accounts: [
              {
                name: 'business-a',
                accessToken: 'TOKEN_A',
                phoneNumberId: 'PHONE_A',
              },
              {
                name: 'business-a',
                accessToken: 'TOKEN_B',
                phoneNumberId: 'PHONE_B',
              },
            ],
          }),
      ).toThrow('duplicate account name: business-a');

      try {
        new WhatsAppMultiAccount({
          accounts: [
            {
              name: 'duplicate',
              accessToken: 'TOKEN_1',
              phoneNumberId: 'PHONE_1',
            },
            {
              name: 'duplicate',
              accessToken: 'TOKEN_2',
              phoneNumberId: 'PHONE_2',
            },
          ],
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });

    it('should throw ValidationError for duplicate phoneNumberIds', () => {
      expect(
        () =>
          new WhatsAppMultiAccount({
            accounts: [
              {
                name: 'business-a',
                accessToken: 'TOKEN_A',
                phoneNumberId: 'PHONE_DUPLICATE',
              },
              {
                name: 'business-b',
                accessToken: 'TOKEN_B',
                phoneNumberId: 'PHONE_DUPLICATE',
              },
            ],
          }),
      ).toThrow('phoneNumberId PHONE_DUPLICATE is already registered to account "business-a"');

      try {
        new WhatsAppMultiAccount({
          accounts: [
            {
              name: 'account-1',
              accessToken: 'TOKEN_1',
              phoneNumberId: 'PHONE_SAME',
            },
            {
              name: 'account-2',
              accessToken: 'TOKEN_2',
              phoneNumberId: 'PHONE_SAME',
            },
          ],
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('phoneNumberId');
      }
    });
  });

  describe('get', () => {
    let manager: WhatsAppMultiAccount;

    beforeEach(() => {
      manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        apiVersion: 'v21.0',
        timeoutMs: 30000,
      });
    });

    it('should lazily create WhatsApp instance by name', () => {
      const wa = manager.get('business-a');

      expect(WhatsApp).toHaveBeenCalledTimes(1);
      expect(WhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'TOKEN_A',
          phoneNumberId: 'PHONE_A',
          businessAccountId: 'WABA_A',
          apiVersion: 'v21.0',
          timeoutMs: 30000,
        }),
      );
      expect(wa).toBeDefined();
    });

    it('should lazily create WhatsApp instance by phoneNumberId', () => {
      const wa = manager.get('PHONE_B');

      expect(WhatsApp).toHaveBeenCalledTimes(1);
      expect(WhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'TOKEN_B',
          phoneNumberId: 'PHONE_B',
          businessAccountId: 'WABA_B',
        }),
      );
      expect(wa).toBeDefined();
    });

    it('should return cached instance on second call', () => {
      const wa1 = manager.get('business-a');
      const wa2 = manager.get('business-a');

      expect(WhatsApp).toHaveBeenCalledTimes(1);
      expect(wa1).toBe(wa2);
    });

    it('should return cached instance when called by name then phoneNumberId', () => {
      const waByName = manager.get('business-a');
      const waByPhone = manager.get('PHONE_A');

      expect(WhatsApp).toHaveBeenCalledTimes(1);
      expect(waByName).toBe(waByPhone);
    });

    it('should throw ValidationError for unknown name', () => {
      expect(() => manager.get('unknown')).toThrow('account not found: unknown');

      try {
        manager.get('nonexistent');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('nameOrPhoneNumberId');
      }
    });

    it('should throw ValidationError for unknown phoneNumberId', () => {
      expect(() => manager.get('PHONE_UNKNOWN')).toThrow('account not found: PHONE_UNKNOWN');
    });

    it('should throw ValidationError after destroy', () => {
      manager.destroy();

      expect(() => manager.get('business-a')).toThrow('manager has been destroyed');

      try {
        manager.get('business-a');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('manager');
      }
    });
  });

  describe('has', () => {
    let manager: WhatsAppMultiAccount;

    beforeEach(() => {
      manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });
    });

    it('should return true for existing account name', () => {
      expect(manager.has('business-a')).toBe(true);
      expect(manager.has('business-b')).toBe(true);
    });

    it('should return true for existing phoneNumberId', () => {
      expect(manager.has('PHONE_A')).toBe(true);
      expect(manager.has('PHONE_B')).toBe(true);
    });

    it('should return false for non-existent account', () => {
      expect(manager.has('unknown')).toBe(false);
      expect(manager.has('PHONE_UNKNOWN')).toBe(false);
    });
  });

  describe('addAccount', () => {
    let manager: WhatsAppMultiAccount;

    beforeEach(() => {
      manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });
    });

    it('should add valid account', () => {
      const newAccount: AccountConfig = {
        name: 'business-c',
        accessToken: 'TOKEN_C',
        phoneNumberId: 'PHONE_C',
      };

      manager.addAccount(newAccount);

      expect(manager.has('business-c')).toBe(true);
      expect(manager.has('PHONE_C')).toBe(true);
    });

    it('should throw ValidationError for duplicate name', () => {
      expect(() =>
        manager.addAccount({
          name: 'business-a',
          accessToken: 'TOKEN_NEW',
          phoneNumberId: 'PHONE_NEW',
        }),
      ).toThrow('duplicate account name: business-a');
    });

    it('should throw ValidationError for duplicate phoneNumberId', () => {
      expect(() =>
        manager.addAccount({
          name: 'business-new',
          accessToken: 'TOKEN_NEW',
          phoneNumberId: 'PHONE_A',
        }),
      ).toThrow('phoneNumberId PHONE_A is already registered to account "business-a"');
    });

    it('should throw ValidationError for missing name', () => {
      expect(() =>
        manager.addAccount({
          name: '',
          accessToken: 'TOKEN',
          phoneNumberId: 'PHONE',
        }),
      ).toThrow('account name is required and cannot be empty');
    });

    it('should throw ValidationError for missing accessToken', () => {
      expect(() =>
        manager.addAccount({
          name: 'new-account',
          accessToken: '',
          phoneNumberId: 'PHONE',
        }),
      ).toThrow('account accessToken is required and cannot be empty');
    });

    it('should throw ValidationError for missing phoneNumberId', () => {
      expect(() =>
        manager.addAccount({
          name: 'new-account',
          accessToken: 'TOKEN',
          phoneNumberId: '',
        }),
      ).toThrow('account phoneNumberId is required and cannot be empty');
    });
  });

  describe('removeAccount', () => {
    let manager: WhatsAppMultiAccount;

    beforeEach(() => {
      manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });
    });

    it('should remove account without instance', () => {
      manager.removeAccount('business-a');

      expect(manager.has('business-a')).toBe(false);
      expect(manager.has('PHONE_A')).toBe(false);
    });

    it('should remove account with instance and call destroy', () => {
      const wa = manager.get('business-a');
      const destroySpy = vi.spyOn(wa, 'destroy');

      manager.removeAccount('business-a');

      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(manager.has('business-a')).toBe(false);
      expect(manager.has('PHONE_A')).toBe(false);
    });

    it('should throw ValidationError for unknown account', () => {
      expect(() => manager.removeAccount('unknown')).toThrow('account not found: unknown');

      try {
        manager.removeAccount('nonexistent');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });
  });

  describe('getAccounts', () => {
    let manager: WhatsAppMultiAccount;

    beforeEach(() => {
      manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });
    });

    it('should return all account configs', () => {
      const accounts = manager.getAccounts();

      expect(accounts.size).toBe(2);
      expect(accounts.get('business-a')).toEqual(validAccounts[0]);
      expect(accounts.get('business-b')).toEqual(validAccounts[1]);
    });

    it('should not trigger lazy initialization', () => {
      manager.getAccounts();

      expect(WhatsApp).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    let manager: WhatsAppMultiAccount;

    beforeEach(() => {
      manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });
    });

    it('should destroy all instantiated WhatsApp instances', () => {
      const waA = manager.get('business-a');
      const waB = manager.get('business-b');
      const destroyA = vi.spyOn(waA, 'destroy');
      const destroyB = vi.spyOn(waB, 'destroy');

      manager.destroy();

      expect(destroyA).toHaveBeenCalledTimes(1);
      expect(destroyB).toHaveBeenCalledTimes(1);
    });

    it('should not error when destroying without instances', () => {
      expect(() => manager.destroy()).not.toThrow();
    });

    it('should clear all maps', () => {
      manager.get('business-a'); // Create one instance
      manager.destroy();

      expect(manager.getAccounts().size).toBe(0);
      expect(manager.has('business-a')).toBe(false);
      expect(manager.has('PHONE_A')).toBe(false);
    });

    it('should set destroyed flag', () => {
      manager.destroy();

      expect(() => manager.get('business-a')).toThrow('manager has been destroyed');
    });
  });

  describe('getNext', () => {
    it('should return WhatsApp instance using strategy selection', () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const wa = manager.getNext();

      expect(mockStrategy.select).toHaveBeenCalledWith(['business-a', 'business-b'], undefined);
      expect(wa).toBeDefined();
      expect(typeof wa.destroy).toBe('function');
    });

    it('should pass recipient to strategy when provided', () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-b'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const wa = manager.getNext('1234567890');

      expect(mockStrategy.select).toHaveBeenCalledWith(['business-a', 'business-b'], '1234567890');
      expect(wa).toBeDefined();
      expect(typeof wa.destroy).toBe('function');
    });

    it('should throw ValidationError when no strategy configured', () => {
      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });

      expect(() => manager.getNext()).toThrow(ValidationError);
      expect(() => manager.getNext()).toThrow('strategy is required for getNext()');
    });

    it('should throw ValidationError when manager is destroyed', () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      manager.destroy();

      expect(() => manager.getNext()).toThrow(ValidationError);
      expect(() => manager.getNext()).toThrow('cannot call getNext() on destroyed manager');
    });

    it('should throw ValidationError when no accounts registered', () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      // Remove all accounts
      manager.removeAccount('business-a');
      manager.removeAccount('business-b');

      expect(() => manager.getNext()).toThrow(ValidationError);
      expect(() => manager.getNext()).toThrow('cannot call getNext() with zero accounts');
    });
  });

  describe('broadcast', () => {
    it('should distribute sends across accounts using strategy', async () => {
      const selections = ['business-a', 'business-b', 'business-a'];
      let callIndex = 0;

      const mockStrategy = {
        select: vi.fn().mockImplementation(() => selections[callIndex++]),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn().mockResolvedValue({
        success: true,
        data: { messaging_product: 'whatsapp', messages: [{ id: 'msg_1' }] },
      });

      const recipients = ['1111111111', '2222222222', '3333333333'];
      const result = await manager.broadcast(recipients, mockFactory);

      expect(result.total).toBe(3);
      expect(result.successes.length).toBe(3);
      expect(result.failures.length).toBe(0);

      expect(mockStrategy.select).toHaveBeenCalledTimes(3);
      expect(mockFactory).toHaveBeenCalledTimes(3);

      // Verify factory was called with correct arguments
      expect(mockFactory.mock.calls[0]![1]).toBe('1111111111');
      expect(mockFactory.mock.calls[1]![1]).toBe('2222222222');
      expect(mockFactory.mock.calls[2]![1]).toBe('3333333333');
    });

    it('should collect successes and failures separately', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn().mockImplementation((_wa, recipient) => {
        if (recipient === '2222222222') {
          return Promise.reject(new Error('Send failed'));
        }
        return Promise.resolve({
          success: true,
          data: { messaging_product: 'whatsapp', messages: [{ id: 'msg_1' }] },
        });
      });

      const recipients = ['1111111111', '2222222222', '3333333333'];
      const result = await manager.broadcast(recipients, mockFactory);

      expect(result.total).toBe(3);
      expect(result.successes.length).toBe(2);
      expect(result.failures.length).toBe(1);

      expect(result.failures[0]!.recipient).toBe('2222222222');
      expect(result.failures[0]!.error).toBeInstanceOf(Error);
    });

    it('should return empty result for empty recipients array', async () => {
      const mockStrategy = {
        select: vi.fn(),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn();

      const result = await manager.broadcast([], mockFactory);

      expect(result.total).toBe(0);
      expect(result.successes.length).toBe(0);
      expect(result.failures.length).toBe(0);

      expect(mockStrategy.select).not.toHaveBeenCalled();
      expect(mockFactory).not.toHaveBeenCalled();
    });

    it('should respect concurrency limit', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      let activeCalls = 0;
      let maxConcurrent = 0;

      const mockFactory = vi.fn().mockImplementation(async () => {
        activeCalls++;
        maxConcurrent = Math.max(maxConcurrent, activeCalls);

        await new Promise((resolve) => setTimeout(resolve, 10));

        activeCalls--;
        return {
          success: true,
          data: { messaging_product: 'whatsapp', messages: [{ id: 'msg_1' }] },
        };
      });

      const recipients = Array.from({ length: 20 }, (_, i) => `recipient-${i}`);
      await manager.broadcast(recipients, mockFactory, { concurrency: 5 });

      expect(maxConcurrent).toBeLessThanOrEqual(5);
    });

    it('should strictly cap in-flight count even with microtask-only factories', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      let activeCalls = 0;
      let maxConcurrent = 0;
      const concurrency = 3;

      // No setTimeout — factory resolves on the microtask queue only. Exercises
      // the path where a naive pool that adds before awaiting can briefly go
      // over the cap.
      const mockFactory = vi.fn().mockImplementation(async () => {
        activeCalls++;
        maxConcurrent = Math.max(maxConcurrent, activeCalls);
        await Promise.resolve();
        await Promise.resolve();
        activeCalls--;
        return {
          success: true,
          data: { messaging_product: 'whatsapp', messages: [{ id: 'msg' }] },
        };
      });

      const recipients = Array.from({ length: 25 }, (_, i) => `r-${i}`);
      await manager.broadcast(recipients, mockFactory, { concurrency });

      expect(maxConcurrent).toBeLessThanOrEqual(concurrency);
    });

    it('should allow per-recipient factory customization', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn().mockImplementation((_wa, recipient) =>
        Promise.resolve({
          success: true,
          data: {
            messaging_product: 'whatsapp',
            messages: [{ id: `msg_${recipient}` }],
          },
        }),
      );

      const recipients = ['1111111111', '2222222222'];
      const result = await manager.broadcast(recipients, mockFactory);

      expect(result.successes[0]!.response.data.messages[0]!.id).toBe('msg_1111111111');
      expect(result.successes[1]!.response.data.messages[0]!.id).toBe('msg_2222222222');
    });

    it('should throw ValidationError when no strategy configured', async () => {
      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
      });

      const mockFactory = vi.fn();

      await expect(manager.broadcast(['1111111111'], mockFactory)).rejects.toThrow(ValidationError);
      await expect(manager.broadcast(['1111111111'], mockFactory)).rejects.toThrow(
        'strategy is required for broadcast()',
      );
    });

    it('should handle scale test with 1000 recipients across 5 accounts', async () => {
      const accounts: AccountConfig[] = Array.from({ length: 5 }, (_, i) => ({
        name: `account-${i}`,
        accessToken: `TOKEN_${i}`,
        phoneNumberId: `PHONE_${i}`,
      }));

      const mockStrategy = {
        select: vi.fn().mockImplementation((accountNames: string[]) => {
          const index = Math.floor(Math.random() * accountNames.length);
          return accountNames[index]!;
        }),
      };

      const manager = new WhatsAppMultiAccount({
        accounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn().mockResolvedValue({
        success: true,
        data: { messaging_product: 'whatsapp', messages: [{ id: 'msg_1' }] },
      });

      const recipients = Array.from({ length: 1000 }, (_, i) => `recipient-${i}`);
      const result = await manager.broadcast(recipients, mockFactory);

      expect(result.total).toBe(1000);
      expect(result.successes.length).toBe(1000);
      expect(result.failures.length).toBe(0);

      expect(mockFactory).toHaveBeenCalledTimes(1000);
    });

    it('should not initiate new sends when destroy() called during broadcast', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      let factoryCalls = 0;

      const mockFactory = vi.fn().mockImplementation(async () => {
        factoryCalls++;

        // Destroy manager after first 2 calls
        if (factoryCalls === 2) {
          manager.destroy();
        }

        await new Promise((resolve) => setTimeout(resolve, 10));

        return {
          success: true,
          data: { messaging_product: 'whatsapp', messages: [{ id: 'msg_1' }] },
        };
      });

      const recipients = Array.from({ length: 10 }, (_, i) => `recipient-${i}`);
      await manager.broadcast(recipients, mockFactory, { concurrency: 2 });

      // Should have stopped initiating new sends after destroy()
      // At most concurrency + in-flight requests should complete
      expect(factoryCalls).toBeLessThan(10);
    });

    it('should throw ValidationError for invalid concurrency', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn();

      await expect(
        manager.broadcast(['1111111111'], mockFactory, { concurrency: 0 }),
      ).rejects.toThrow(ValidationError);
      await expect(
        manager.broadcast(['1111111111'], mockFactory, { concurrency: 0 }),
      ).rejects.toThrow('concurrency must be a positive integer');
    });

    it('should throw ValidationError for NaN concurrency', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn();

      await expect(
        manager.broadcast(['1111111111'], mockFactory, { concurrency: NaN }),
      ).rejects.toThrow('concurrency must be a positive integer');
    });

    it('should throw ValidationError for fractional concurrency', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn();

      await expect(
        manager.broadcast(['1111111111'], mockFactory, { concurrency: 0.5 }),
      ).rejects.toThrow('concurrency must be a positive integer');
      await expect(
        manager.broadcast(['1111111111'], mockFactory, { concurrency: 1.7 }),
      ).rejects.toThrow('concurrency must be a positive integer');
    });

    it('should throw ValidationError for negative concurrency', async () => {
      const mockStrategy = {
        select: vi.fn().mockReturnValue('business-a'),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const mockFactory = vi.fn();

      await expect(
        manager.broadcast(['1111111111'], mockFactory, { concurrency: -1 }),
      ).rejects.toThrow('concurrency must be a positive integer');
    });

    it('should support broadcasting flows with per-account flow-ID mapping', async () => {
      // A flow identifier is scoped to a single WhatsApp Business Account,
      // so multi-account platforms must maintain a mapping from conceptual
      // flow name to per-account flow identifier and look up the correct
      // identifier inside the broadcast factory. This test verifies the
      // pattern works end-to-end for FR-007a / SC-016.
      const flowIdByAccount: Record<string, string> = {
        'business-a': 'flow_in_waba_a',
        'business-b': 'flow_in_waba_b',
      };

      const selections = ['business-a', 'business-b', 'business-a'];
      let callIndex = 0;
      const mockStrategy = {
        select: vi.fn().mockImplementation(() => selections[callIndex++]),
      };

      const manager = new WhatsAppMultiAccount({
        accounts: validAccounts,
        strategy: mockStrategy,
      });

      const sendsReceived: Array<{
        phoneNumberId: string;
        recipient: string;
        flowId: string;
      }> = [];

      const mockFactory = vi.fn().mockImplementation((wa, recipient: string) => {
        const phoneNumberId = (wa as { config: { phoneNumberId: string } }).config.phoneNumberId;
        const account = validAccounts.find((a) => a.phoneNumberId === phoneNumberId)!;
        const flowId = flowIdByAccount[account.name]!;
        sendsReceived.push({ phoneNumberId, recipient, flowId });
        return Promise.resolve({
          success: true,
          data: {
            messaging_product: 'whatsapp',
            messages: [{ id: `msg_${recipient}` }],
          },
        });
      });

      const recipients = ['1111111111', '2222222222', '3333333333'];
      const result = await manager.broadcast(recipients, mockFactory);

      expect(result.total).toBe(3);
      expect(result.successes.length).toBe(3);
      expect(result.failures.length).toBe(0);

      // Verify each recipient was sent the flow from the correct account
      // using its own per-account flow identifier.
      expect(sendsReceived).toEqual([
        { phoneNumberId: 'PHONE_A', recipient: '1111111111', flowId: 'flow_in_waba_a' },
        { phoneNumberId: 'PHONE_B', recipient: '2222222222', flowId: 'flow_in_waba_b' },
        { phoneNumberId: 'PHONE_A', recipient: '3333333333', flowId: 'flow_in_waba_a' },
      ]);
    });
  });
});
