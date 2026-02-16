import type { MultiAccountConfig, AccountConfig } from './types.js';
import { WhatsApp } from '../whatsapp.js';
import type { WhatsAppConfig } from '../client/types.js';
import { ValidationError } from '../errors/errors.js';

/**
 * Multi-account manager for handling multiple WhatsApp Business Accounts
 *
 * Manages multiple WhatsApp client instances with shared base configuration
 * and per-account overrides. WhatsApp instances are lazily created on first
 * access to minimize resource allocation for unused accounts.
 *
 * @example
 * ```typescript
 * import { WhatsAppMultiAccount } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const manager = new WhatsAppMultiAccount({
 *   // Shared base config (applies to all accounts)
 *   apiVersion: 'v21.0',
 *   timeoutMs: 30000,
 *   retryConfig: { maxRetries: 3 },
 *
 *   // Per-account configurations
 *   accounts: [
 *     {
 *       name: 'business-a',
 *       accessToken: 'TOKEN_A',
 *       phoneNumberId: 'PHONE_A',
 *       businessAccountId: 'WABA_A',
 *     },
 *     {
 *       name: 'business-b',
 *       accessToken: 'TOKEN_B',
 *       phoneNumberId: 'PHONE_B',
 *       businessAccountId: 'WABA_B',
 *     },
 *   ],
 * });
 *
 * // Get by account name
 * const waA = manager.get('business-a');
 * await waA.messages.sendText({ to: '1234567890', body: 'Hello!' });
 *
 * // Clean up
 * manager.destroy();
 * ```
 */
export class WhatsAppMultiAccount {
  private readonly baseConfig: Omit<MultiAccountConfig, 'accounts'>;
  private readonly accountConfigs: Map<string, AccountConfig>;
  private readonly phoneNumberIdToName: Map<string, string>;
  private readonly instances: Map<string, WhatsApp>;
  private destroyed = false;

  /**
   * Creates a new multi-account manager
   *
   * @param config - Multi-account configuration with shared base settings and account array
   * @throws {ValidationError} If accounts array is empty, any account is missing required fields,
   *   or duplicate account names/phoneNumberIds are detected
   *
   * @example
   * ```typescript
   * const manager = new WhatsAppMultiAccount({
   *   apiVersion: 'v21.0',
   *   accounts: [
   *     {
   *       name: 'business-a',
   *       accessToken: 'TOKEN_A',
   *       phoneNumberId: 'PHONE_A',
   *     },
   *   ],
   * });
   * ```
   */
  constructor(config: MultiAccountConfig) {
    // Validate accounts array
    if (config.accounts.length === 0) {
      throw new ValidationError('accounts array is required and cannot be empty', 'accounts');
    }

    // Store base config (everything except accounts)
    this.baseConfig = {
      apiVersion: config.apiVersion,
      baseUrl: config.baseUrl,
      logger: config.logger,
      rateLimitConfig: config.rateLimitConfig,
      retryConfig: config.retryConfig,
      timeoutMs: config.timeoutMs,
    };

    // Initialize maps
    this.accountConfigs = new Map();
    this.phoneNumberIdToName = new Map();
    this.instances = new Map();

    // Validate and store each account config
    for (const account of config.accounts) {
      // Validate required fields
      if (!account.name || account.name.trim() === '') {
        throw new ValidationError('account name is required and cannot be empty', 'name');
      }
      if (!account.accessToken || account.accessToken.trim() === '') {
        throw new ValidationError(
          'account accessToken is required and cannot be empty',
          'accessToken',
        );
      }
      if (!account.phoneNumberId || account.phoneNumberId.trim() === '') {
        throw new ValidationError(
          'account phoneNumberId is required and cannot be empty',
          'phoneNumberId',
        );
      }

      // Check for duplicate names
      if (this.accountConfigs.has(account.name)) {
        throw new ValidationError(`duplicate account name: ${account.name}`, 'name');
      }

      // Check for duplicate phone number IDs
      if (this.phoneNumberIdToName.has(account.phoneNumberId)) {
        throw new ValidationError(
          `phoneNumberId ${account.phoneNumberId} is already registered to account "${this.phoneNumberIdToName.get(account.phoneNumberId)}"`,
          'phoneNumberId',
        );
      }

      // Store config and lookup mappings
      this.accountConfigs.set(account.name, account);
      this.phoneNumberIdToName.set(account.phoneNumberId, account.name);
    }
  }

  /**
   * Get a WhatsApp client instance by account name or phone number ID
   *
   * Lazily creates the WhatsApp instance on first access by merging the shared
   * base config with account-specific overrides (account overrides take priority).
   * Subsequent calls return the cached instance.
   *
   * @param nameOrPhoneNumberId - Account name or phone number ID
   * @returns WhatsApp client instance for the account
   * @throws {ValidationError} If account not found or manager has been destroyed
   *
   * @example
   * ```typescript
   * // Get by account name
   * const waA = manager.get('business-a');
   * await waA.messages.sendText({ to: '1234567890', body: 'Hello!' });
   *
   * // Get by phone number ID
   * const waB = manager.get('PHONE_NUMBER_ID_B');
   * await waB.messages.sendText({ to: '1234567890', body: 'Hi!' });
   * ```
   */
  get(nameOrPhoneNumberId: string): WhatsApp {
    if (this.destroyed) {
      throw new ValidationError('manager has been destroyed', 'manager');
    }

    // Look up by name first, then by phone number ID
    let accountName = nameOrPhoneNumberId;
    if (!this.accountConfigs.has(nameOrPhoneNumberId)) {
      const foundName = this.phoneNumberIdToName.get(nameOrPhoneNumberId);
      if (!foundName) {
        throw new ValidationError(
          `account not found: ${nameOrPhoneNumberId}`,
          'nameOrPhoneNumberId',
        );
      }
      accountName = foundName;
    }

    // Return cached instance if exists
    const cachedInstance = this.instances.get(accountName);
    if (cachedInstance) {
      return cachedInstance;
    }

    // Lazy create: merge base config with account config
    const accountConfig = this.accountConfigs.get(accountName);
    if (!accountConfig) {
      throw new ValidationError(`account configuration not found: ${accountName}`, 'accountName');
    }
    const mergedConfig: WhatsAppConfig = {
      // Account-specific required fields
      accessToken: accountConfig.accessToken,
      phoneNumberId: accountConfig.phoneNumberId,

      // Optional fields with account override priority
      businessAccountId: accountConfig.businessAccountId,
      apiVersion: accountConfig.apiVersion ?? this.baseConfig.apiVersion,
      baseUrl: accountConfig.baseUrl ?? this.baseConfig.baseUrl,
      logger: accountConfig.logger ?? this.baseConfig.logger,
      rateLimitConfig: accountConfig.rateLimitConfig ?? this.baseConfig.rateLimitConfig,
      retryConfig: accountConfig.retryConfig ?? this.baseConfig.retryConfig,
      timeoutMs: accountConfig.timeoutMs ?? this.baseConfig.timeoutMs,
      appSecret: accountConfig.appSecret,
      webhookVerifyToken: accountConfig.webhookVerifyToken,
    };

    // Create, cache, and return instance
    const instance = new WhatsApp(mergedConfig);
    this.instances.set(accountName, instance);
    return instance;
  }

  /**
   * Check if an account exists by name or phone number ID
   *
   * @param nameOrPhoneNumberId - Account name or phone number ID
   * @returns True if account exists, false otherwise
   *
   * @example
   * ```typescript
   * if (manager.has('business-c')) {
   *   const waC = manager.get('business-c');
   *   await waC.messages.sendText({ to: '1234567890', body: 'Hello!' });
   * }
   * ```
   */
  has(nameOrPhoneNumberId: string): boolean {
    return (
      this.accountConfigs.has(nameOrPhoneNumberId) ||
      this.phoneNumberIdToName.has(nameOrPhoneNumberId)
    );
  }

  /**
   * Add a new account at runtime
   *
   * Validates that the account name and phone number ID are unique, then stores
   * the account configuration. The WhatsApp instance is created lazily on first access.
   *
   * @param config - Account configuration
   * @throws {ValidationError} If name/accessToken/phoneNumberId is missing/empty,
   *   or if name or phoneNumberId already exists
   *
   * @example
   * ```typescript
   * manager.addAccount({
   *   name: 'business-c',
   *   accessToken: 'TOKEN_C',
   *   phoneNumberId: 'PHONE_C',
   *   businessAccountId: 'WABA_C',
   * });
   * ```
   */
  addAccount(config: AccountConfig): void {
    // Validate required fields
    if (!config.name || config.name.trim() === '') {
      throw new ValidationError('account name is required and cannot be empty', 'name');
    }
    if (!config.accessToken || config.accessToken.trim() === '') {
      throw new ValidationError(
        'account accessToken is required and cannot be empty',
        'accessToken',
      );
    }
    if (!config.phoneNumberId || config.phoneNumberId.trim() === '') {
      throw new ValidationError(
        'account phoneNumberId is required and cannot be empty',
        'phoneNumberId',
      );
    }

    // Check for duplicate name
    if (this.accountConfigs.has(config.name)) {
      throw new ValidationError(`duplicate account name: ${config.name}`, 'name');
    }

    // Check for duplicate phone number ID
    if (this.phoneNumberIdToName.has(config.phoneNumberId)) {
      throw new ValidationError(
        `phoneNumberId ${config.phoneNumberId} is already registered to account "${this.phoneNumberIdToName.get(config.phoneNumberId)}"`,
        'phoneNumberId',
      );
    }

    // Store config and lookup mappings
    this.accountConfigs.set(config.name, config);
    this.phoneNumberIdToName.set(config.phoneNumberId, config.name);
  }

  /**
   * Remove an account and clean up its resources
   *
   * If the account's WhatsApp instance was lazily created, destroys it before removal.
   *
   * @param name - Account name to remove
   * @throws {ValidationError} If account name not found
   *
   * @example
   * ```typescript
   * manager.removeAccount('business-c');
   * ```
   */
  removeAccount(name: string): void {
    const config = this.accountConfigs.get(name);
    if (!config) {
      throw new ValidationError(`account not found: ${name}`, 'name');
    }

    // Destroy instance if it was created
    const instance = this.instances.get(name);
    if (instance) {
      instance.destroy();
      this.instances.delete(name);
    }

    // Remove from all maps
    this.accountConfigs.delete(name);
    this.phoneNumberIdToName.delete(config.phoneNumberId);
  }

  /**
   * Get all registered account configurations
   *
   * Returns a read-only view of account name → config mappings.
   * Does NOT trigger lazy initialization of WhatsApp instances.
   *
   * @returns Read-only Map of account names to configurations
   *
   * @example
   * ```typescript
   * const accounts = manager.getAccounts();
   * for (const [name, config] of accounts) {
   *   console.log(`Account: ${name}, Phone: ${config.phoneNumberId}`);
   * }
   * ```
   */
  getAccounts(): ReadonlyMap<string, AccountConfig> {
    return this.accountConfigs;
  }

  /**
   * Clean up all lazily-created WhatsApp instances
   *
   * Destroys all WhatsApp instances that have been created, clearing rate limiter
   * intervals and other resources. After calling destroy(), the manager is unusable
   * and any method calls will throw ValidationError.
   *
   * @example
   * ```typescript
   * manager.destroy();
   * ```
   */
  destroy(): void {
    // Destroy all lazy instances
    for (const instance of this.instances.values()) {
      instance.destroy();
    }

    // Clear all maps
    this.instances.clear();
    this.accountConfigs.clear();
    this.phoneNumberIdToName.clear();

    // Mark as destroyed
    this.destroyed = true;
  }
}
