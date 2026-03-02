import { describe, it, expect } from 'vitest';
import { 
  QuickbaseTicketError, 
  QuickbaseAppTokenError, 
  QuickbaseXmlError,
  XmlError,
  checkError,
  XmlErrorCode
} from '../../src/index.js';

describe('Granular Error Handling', () => {
  describe('checkError mapping', () => {
    it('should throw QuickbaseTicketError for invalid ticket (code 8)', () => {
      const resp = {
        action: 'API_DoQuery',
        errcode: XmlErrorCode.InvalidTicket,
        errtext: 'Invalid ticket',
        errdetail: 'Your ticket has expired'
      };

      try {
        checkError(resp);
        expect.fail('Should have thrown QuickbaseTicketError');
      } catch (err) {
        expect(err).toBeInstanceOf(QuickbaseTicketError);
        const ticketErr = err as QuickbaseTicketError;
        expect(ticketErr.code).toBe(8);
        expect(ticketErr.message).toBe('Invalid ticket');
        expect(ticketErr.description).toBe('Your ticket has expired');
        expect(ticketErr.statusCode).toBe(401);
      }
    });

    it('should throw QuickbaseAppTokenError for app token required (code 22)', () => {
      const resp = {
        action: 'API_DoQuery',
        errcode: XmlErrorCode.AppTokenRequired,
        errtext: 'App token required',
      };

      try {
        checkError(resp);
        expect.fail('Should have thrown QuickbaseAppTokenError');
      } catch (err) {
        expect(err).toBeInstanceOf(QuickbaseAppTokenError);
        const appTokenErr = err as QuickbaseAppTokenError;
        expect(appTokenErr.code).toBe(22);
        expect(appTokenErr.statusCode).toBe(403);
      }
    });

    it('should throw QuickbaseAppTokenError for invalid app token (code 23)', () => {
      const resp = {
        action: 'API_DoQuery',
        errcode: XmlErrorCode.InvalidAppToken,
        errtext: 'Invalid app token',
      };

      try {
        checkError(resp);
      } catch (err) {
        expect(err).toBeInstanceOf(QuickbaseAppTokenError);
        expect((err as QuickbaseAppTokenError).code).toBe(23);
      }
    });

    it('should throw QuickbaseAppTokenError for expired app token (code 24)', () => {
      const resp = {
        action: 'API_DoQuery',
        errcode: XmlErrorCode.ExpiredAppToken,
        errtext: 'Expired app token',
      };

      try {
        checkError(resp);
      } catch (err) {
        expect(err).toBeInstanceOf(QuickbaseAppTokenError);
        expect((err as QuickbaseAppTokenError).code).toBe(24);
      }
    });

    it('should throw XmlError (QuickbaseXmlError) for other codes', () => {
      const resp = {
        action: 'API_DoQuery',
        errcode: XmlErrorCode.NoSuchDatabase,
        errtext: 'No such database',
      };

      try {
        checkError(resp);
      } catch (err) {
        expect(err).toBeInstanceOf(XmlError);
        expect(err).toBeInstanceOf(QuickbaseXmlError);
        const xmlErr = err as QuickbaseXmlError;
        expect(xmlErr.code).toBe(6);
        expect(xmlErr.text).toBe('No such database');
      }
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON correctly', () => {
      const err = new QuickbaseTicketError('Session expired', 8, { 
        description: 'Detail',
        action: 'API_Authenticate' 
      });
      
      const json = err.toJSON();
      expect(json.name).toBe('QuickbaseTicketError');
      expect(json.message).toBe('Session expired');
      expect(json.code).toBe(8);
      expect(json.statusCode).toBe(401);
      expect(json.description).toBe('Detail');
    });

    it('should serialize QuickbaseXmlError correctly', () => {
      const err = new QuickbaseXmlError(30, 'No such record', {
        action: 'API_EditRecord',
        description: 'Record 123 not found'
      });

      const json = err.toJSON();
      expect(json.name).toBe('QuickbaseXmlError');
      expect(json.code).toBe(30);
      expect(json.text).toBe('No such record');
      expect(json.action).toBe('API_EditRecord');
      expect(json.description).toBe('Record 123 not found');
    });
  });
});
