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
});
