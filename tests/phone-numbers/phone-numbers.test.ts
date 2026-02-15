import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhoneNumbers } from '../../src/phone-numbers/phone-numbers.js';
import type { HttpClient } from '../../src/client/http-client.js';
import { ValidationError, ApiError } from '../../src/errors/errors.js';
import type { PhoneNumber, BusinessProfile } from '../../src/phone-numbers/types.js';

const BUSINESS_ACCOUNT_ID = '123456789';
const PHONE_NUMBER_ID = '987654321';

function createMockClient(): {
  client: HttpClient;
  getSpy: ReturnType<typeof vi.fn>;
  postSpy: ReturnType<typeof vi.fn>;
} {
  const getSpy = vi.fn();
  const postSpy = vi.fn();

  const client = {
    get: getSpy,
    post: postSpy,
  } as unknown as HttpClient;

  return { client, getSpy, postSpy };
}

describe('PhoneNumbers', () => {
  let client: HttpClient;
  let getSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mock = createMockClient();
    client = mock.client;
    getSpy = mock.getSpy;
    postSpy = mock.postSpy;
  });

  describe('constructor', () => {
    it('should create instance with valid businessAccountId', () => {
      const phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
      expect(phoneNumbers).toBeInstanceOf(PhoneNumbers);
    });

    it('should throw ValidationError when businessAccountId is empty string', () => {
      expect(() => new PhoneNumbers(client, '')).toThrow(ValidationError);
      expect(() => new PhoneNumbers(client, '')).toThrow(
        'businessAccountId is required and cannot be empty',
      );

      try {
        new PhoneNumbers(client, '');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('businessAccountId');
      }
    });

    it('should throw ValidationError when businessAccountId is whitespace only', () => {
      expect(() => new PhoneNumbers(client, '   ')).toThrow(ValidationError);
    });

    it('should throw ValidationError when businessAccountId is undefined', () => {
      expect(() => new PhoneNumbers(client, undefined as unknown as string)).toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when businessAccountId is null', () => {
      expect(() => new PhoneNumbers(client, null as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('list', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.get with correct path for list without params', async () => {
      const mockResponse = {
        data: {
          data: [],
          paging: {},
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await phoneNumbers.list();

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/phone_numbers`, undefined);
      expect(result.data.data).toEqual([]);
    });

    it('should return phone number list with data', async () => {
      const mockPhone: PhoneNumber = {
        id: PHONE_NUMBER_ID,
        displayPhoneNumber: '+1 631-555-5555',
        verifiedName: 'Test Business',
        qualityRating: 'GREEN',
        codeVerificationStatus: 'VERIFIED',
        isOfficialBusinessAccount: true,
        nameStatus: 'APPROVED',
        platformType: 'CLOUD_API',
      };

      const mockResponse = {
        data: {
          data: [mockPhone],
          paging: {
            cursors: {
              before: 'cursor_before',
              after: 'cursor_after',
            },
          },
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await phoneNumbers.list();

      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]).toEqual(mockPhone);
      expect(result.data.paging?.cursors?.after).toBe('cursor_after');
    });

    it('should pass fields filter to query params', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.list({ fields: 'id,display_phone_number,quality_rating' });

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/phone_numbers`, {
        params: { fields: 'id,display_phone_number,quality_rating' },
      });
    });

    it('should pass limit and cursor params', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.list({ limit: 10, after: 'cursor_after' });

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/phone_numbers`, {
        params: { limit: '10', after: 'cursor_after' },
      });
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: { data: [] },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await phoneNumbers.list();

      expect(result.data.data).toEqual([]);
    });

    it('should propagate platform errors', async () => {
      const mockError = new ApiError('Unauthorized', 401, 'AuthError');
      getSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.list()).rejects.toThrow(ApiError);
      await expect(phoneNumbers.list()).rejects.toThrow('Unauthorized');
    });
  });

  describe('get', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.get with correct phoneNumberId', async () => {
      const mockPhone: PhoneNumber = {
        id: PHONE_NUMBER_ID,
        displayPhoneNumber: '+1 631-555-5555',
        verifiedName: 'Test Business',
        qualityRating: 'GREEN',
        codeVerificationStatus: 'VERIFIED',
        isOfficialBusinessAccount: true,
        nameStatus: 'APPROVED',
        platformType: 'CLOUD_API',
        messagingLimitTier: 'TIER_1K',
      };

      const mockResponse = {
        data: mockPhone,
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await phoneNumbers.get(PHONE_NUMBER_ID);

      expect(getSpy).toHaveBeenCalledWith(PHONE_NUMBER_ID, undefined);
      expect(result.data).toEqual(mockPhone);
    });

    it('should pass fields filter to query params', async () => {
      const mockResponse = {
        data: {} as PhoneNumber,
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.get(PHONE_NUMBER_ID, { fields: 'id,display_phone_number' });

      expect(getSpy).toHaveBeenCalledWith(PHONE_NUMBER_ID, {
        params: { fields: 'id,display_phone_number' },
      });
    });

    it('should throw ValidationError when phoneNumberId is empty', async () => {
      await expect(phoneNumbers.get('')).rejects.toThrow(ValidationError);
      await expect(phoneNumbers.get('')).rejects.toThrow(
        'phoneNumberId is required and cannot be empty',
      );

      try {
        await phoneNumbers.get('');
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('phoneNumberId');
      }
    });

    it('should throw ValidationError when phoneNumberId is whitespace', async () => {
      await expect(phoneNumbers.get('   ')).rejects.toThrow(ValidationError);
    });

    it('should propagate 400 error', async () => {
      const mockError = new ApiError('Bad Request', 400, 'BadRequest');
      getSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.get(PHONE_NUMBER_ID)).rejects.toThrow(ApiError);
    });

    it('should propagate 401 error', async () => {
      const mockError = new ApiError('Unauthorized', 401, 'AuthError');
      getSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.get(PHONE_NUMBER_ID)).rejects.toThrow('Unauthorized');
    });

    it('should propagate 500 error', async () => {
      const mockError = new ApiError('Internal Server Error', 500, 'ServerError');
      getSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.get(PHONE_NUMBER_ID)).rejects.toThrow('Internal Server Error');
    });
  });

  describe('getBusinessProfile', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.get and unwrap data array', async () => {
      const mockProfile: BusinessProfile = {
        messagingProduct: 'whatsapp',
        description: 'Test business description',
        address: '123 Main St',
        websites: ['https://example.com'],
        email: 'test@example.com',
        vertical: 'RETAIL',
      };

      const mockResponse = {
        data: {
          data: [mockProfile],
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await phoneNumbers.getBusinessProfile(PHONE_NUMBER_ID);

      expect(getSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/whatsapp_business_profile`,
        undefined,
      );
      expect(result.data).toEqual(mockProfile);
    });

    it('should pass fields filter to query params', async () => {
      const mockResponse = {
        data: {
          data: [{ messagingProduct: 'whatsapp' }],
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.getBusinessProfile(PHONE_NUMBER_ID, {
        fields: 'description,websites,vertical',
      });

      expect(getSpy).toHaveBeenCalledWith(`${PHONE_NUMBER_ID}/whatsapp_business_profile`, {
        params: { fields: 'description,websites,vertical' },
      });
    });

    it('should throw ValidationError when phoneNumberId is empty', async () => {
      await expect(phoneNumbers.getBusinessProfile('')).rejects.toThrow(ValidationError);
      await expect(phoneNumbers.getBusinessProfile('')).rejects.toThrow(
        'phoneNumberId is required and cannot be empty',
      );
    });

    it('should propagate 400 error', async () => {
      const mockError = new ApiError('Bad Request', 400, 'BadRequest');
      getSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.getBusinessProfile(PHONE_NUMBER_ID)).rejects.toThrow(ApiError);
    });

    it('should propagate 403 error', async () => {
      const mockError = new ApiError('Forbidden', 403, 'ForbiddenError');
      getSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.getBusinessProfile(PHONE_NUMBER_ID)).rejects.toThrow('Forbidden');
    });
  });

  describe('updateBusinessProfile', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with partial fields and auto-inject messaging_product', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const update = {
        description: 'Updated description',
        websites: ['https://newsite.com'],
      };

      await phoneNumbers.updateBusinessProfile(PHONE_NUMBER_ID, update);

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/whatsapp_business_profile`,
        {
          messaging_product: 'whatsapp',
          ...update,
        },
        undefined,
      );
    });

    it('should send only provided fields', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.updateBusinessProfile(PHONE_NUMBER_ID, {
        vertical: 'RETAIL',
      });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/whatsapp_business_profile`,
        {
          messaging_product: 'whatsapp',
          vertical: 'RETAIL',
        },
        undefined,
      );
    });

    it('should send full profile update', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const update = {
        about: 'About text',
        address: '123 Main St',
        description: 'Full description',
        email: 'contact@example.com',
        vertical: 'RETAIL' as const,
        websites: ['https://example.com', 'https://shop.example.com'],
      };

      await phoneNumbers.updateBusinessProfile(PHONE_NUMBER_ID, update);

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/whatsapp_business_profile`,
        {
          messaging_product: 'whatsapp',
          ...update,
        },
        undefined,
      );
    });

    it('should throw ValidationError when phoneNumberId is empty', async () => {
      await expect(phoneNumbers.updateBusinessProfile('', {})).rejects.toThrow(ValidationError);
    });

    it('should propagate 400 error', async () => {
      const mockError = new ApiError('Bad Request', 400, 'BadRequest');
      postSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.updateBusinessProfile(PHONE_NUMBER_ID, {})).rejects.toThrow(
        ApiError,
      );
    });

    it('should propagate 403 error', async () => {
      const mockError = new ApiError('Forbidden', 403, 'ForbiddenError');
      postSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.updateBusinessProfile(PHONE_NUMBER_ID, {})).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('requestVerificationCode', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with SMS method', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, {
        codeMethod: 'SMS',
        language: 'en_US',
      });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/request_code`,
        {
          code_method: 'SMS',
          language: 'en_US',
        },
        undefined,
      );
    });

    it('should call client.post with VOICE method', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, {
        codeMethod: 'VOICE',
        language: 'es_ES',
      });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/request_code`,
        {
          code_method: 'VOICE',
          language: 'es_ES',
        },
        undefined,
      );
    });

    it('should throw ValidationError for invalid codeMethod', async () => {
      const invalidRequest = {
        codeMethod: 'EMAIL' as 'SMS',
        language: 'en_US',
      };

      await expect(
        phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, invalidRequest),
      ).rejects.toThrow(ValidationError);

      await expect(
        phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, invalidRequest),
      ).rejects.toThrow('codeMethod must be either "SMS" or "VOICE"');

      try {
        const anotherInvalidRequest = {
          codeMethod: 'INVALID' as 'VOICE',
          language: 'en_US',
        };
        await phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, anotherInvalidRequest);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('codeMethod');
      }
    });

    it('should throw ValidationError for empty language', async () => {
      await expect(
        phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, {
          codeMethod: 'SMS',
          language: '',
        }),
      ).rejects.toThrow(ValidationError);

      try {
        await phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, {
          codeMethod: 'SMS',
          language: '   ',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('language');
      }
    });

    it('should throw ValidationError for empty phoneNumberId', async () => {
      await expect(
        phoneNumbers.requestVerificationCode('', {
          codeMethod: 'SMS',
          language: 'en_US',
        }),
      ).rejects.toThrow('phoneNumberId is required and cannot be empty');
    });

    it('should propagate 400 error', async () => {
      const mockError = new ApiError('Bad Request', 400, 'BadRequest');
      postSpy.mockRejectedValue(mockError);

      await expect(
        phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, {
          codeMethod: 'SMS',
          language: 'en_US',
        }),
      ).rejects.toThrow(ApiError);
    });

    it('should propagate 429 error', async () => {
      const mockError = new ApiError('Too Many Requests', 429, 'RateLimitError');
      postSpy.mockRejectedValue(mockError);

      await expect(
        phoneNumbers.requestVerificationCode(PHONE_NUMBER_ID, {
          codeMethod: 'SMS',
          language: 'en_US',
        }),
      ).rejects.toThrow('Too Many Requests');
    });
  });

  describe('verifyCode', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with valid code', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.verifyCode(PHONE_NUMBER_ID, {
        code: '123456',
      });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/verify_code`,
        {
          code: '123456',
        },
        undefined,
      );
    });

    it('should throw ValidationError for empty code', async () => {
      await expect(
        phoneNumbers.verifyCode(PHONE_NUMBER_ID, {
          code: '',
        }),
      ).rejects.toThrow(ValidationError);

      try {
        await phoneNumbers.verifyCode(PHONE_NUMBER_ID, {
          code: '   ',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('code');
      }
    });

    it('should throw ValidationError for empty phoneNumberId', async () => {
      await expect(
        phoneNumbers.verifyCode('', {
          code: '123456',
        }),
      ).rejects.toThrow('phoneNumberId is required and cannot be empty');
    });

    it('should propagate 401 error', async () => {
      const mockError = new ApiError('Unauthorized', 401, 'AuthError');
      postSpy.mockRejectedValue(mockError);

      await expect(
        phoneNumbers.verifyCode(PHONE_NUMBER_ID, {
          code: '123456',
        }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should propagate 500 error', async () => {
      const mockError = new ApiError('Internal Server Error', 500, 'ServerError');
      postSpy.mockRejectedValue(mockError);

      await expect(
        phoneNumbers.verifyCode(PHONE_NUMBER_ID, {
          code: '123456',
        }),
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('register', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with valid pin and auto-inject messaging_product', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.register(PHONE_NUMBER_ID, {
        pin: '654321',
      });

      expect(postSpy).toHaveBeenCalledWith(
        `${PHONE_NUMBER_ID}/register`,
        {
          messaging_product: 'whatsapp',
          pin: '654321',
        },
        undefined,
      );
    });

    it('should throw ValidationError for empty pin', async () => {
      await expect(
        phoneNumbers.register(PHONE_NUMBER_ID, {
          pin: '',
        }),
      ).rejects.toThrow(ValidationError);

      try {
        await phoneNumbers.register(PHONE_NUMBER_ID, {
          pin: '   ',
        });
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('pin');
      }
    });

    it('should throw ValidationError for empty phoneNumberId', async () => {
      await expect(
        phoneNumbers.register('', {
          pin: '654321',
        }),
      ).rejects.toThrow('phoneNumberId is required and cannot be empty');
    });

    it('should propagate 400 error', async () => {
      const mockError = new ApiError('Bad Request', 400, 'BadRequest');
      postSpy.mockRejectedValue(mockError);

      await expect(
        phoneNumbers.register(PHONE_NUMBER_ID, {
          pin: '654321',
        }),
      ).rejects.toThrow(ApiError);
    });

    it('should propagate 500 error', async () => {
      const mockError = new ApiError('Internal Server Error', 500, 'ServerError');
      postSpy.mockRejectedValue(mockError);

      await expect(
        phoneNumbers.register(PHONE_NUMBER_ID, {
          pin: '654321',
        }),
      ).rejects.toThrow('Internal Server Error');
    });
  });

  describe('deregister', () => {
    let phoneNumbers: PhoneNumbers;

    beforeEach(() => {
      phoneNumbers = new PhoneNumbers(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with valid phoneNumberId', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      await phoneNumbers.deregister(PHONE_NUMBER_ID);

      expect(postSpy).toHaveBeenCalledWith(`${PHONE_NUMBER_ID}/deregister`, {}, undefined);
    });

    it('should throw ValidationError for empty phoneNumberId', async () => {
      await expect(phoneNumbers.deregister('')).rejects.toThrow(
        'phoneNumberId is required and cannot be empty',
      );
    });

    it('should propagate 401 error', async () => {
      const mockError = new ApiError('Unauthorized', 401, 'AuthError');
      postSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.deregister(PHONE_NUMBER_ID)).rejects.toThrow('Unauthorized');
    });

    it('should propagate 500 error', async () => {
      const mockError = new ApiError('Internal Server Error', 500, 'ServerError');
      postSpy.mockRejectedValue(mockError);

      await expect(phoneNumbers.deregister(PHONE_NUMBER_ID)).rejects.toThrow(
        'Internal Server Error',
      );
    });
  });
});
