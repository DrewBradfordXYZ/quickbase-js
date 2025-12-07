/**
 * XML API Errors
 *
 * Error handling for the legacy QuickBase XML API.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type { BaseResponse } from './types.js';

/**
 * Common QuickBase XML API error codes
 */
export const XmlErrorCode = {
  /** No error (success) */
  Success: 0,
  /** User is not authorized for this action */
  Unauthorized: 4,
  /** Invalid input parameters */
  InvalidInput: 5,
  /** Database/table does not exist */
  NoSuchDatabase: 6,
  /** Access to the resource is denied */
  AccessDenied: 7,
  /** Authentication ticket is invalid or expired */
  InvalidTicket: 8,
  /** Record does not exist */
  NoSuchRecord: 30,
  /** Field does not exist */
  NoSuchField: 31,
  /** User does not exist */
  NoSuchUser: 33,
} as const;

/**
 * Error returned by the QuickBase XML API
 */
export class XmlError extends Error {
  readonly code: number;
  readonly text: string;
  readonly detail?: string;
  readonly action?: string;

  constructor(code: number, text: string, detail?: string, action?: string) {
    const msg = detail
      ? `XML API error ${code}: ${text} (${detail})`
      : `XML API error ${code}: ${text}`;
    super(msg);
    this.name = 'XmlError';
    this.code = code;
    this.text = text;
    this.detail = detail;
    this.action = action;
  }
}

/**
 * Check if the response contains an error and throw if so.
 * Returns void if successful (errcode === 0).
 */
export function checkError(resp: BaseResponse): void {
  if (resp.errcode === 0) {
    return;
  }
  throw new XmlError(resp.errcode, resp.errtext, resp.errdetail, resp.action);
}

/**
 * Check if the error is an authorization error (code 4 or 7)
 */
export function isUnauthorized(err: unknown): boolean {
  if (err instanceof XmlError) {
    return (
      err.code === XmlErrorCode.Unauthorized ||
      err.code === XmlErrorCode.AccessDenied
    );
  }
  return false;
}

/**
 * Check if the error indicates a resource was not found
 */
export function isNotFound(err: unknown): boolean {
  if (err instanceof XmlError) {
    return (
      err.code === XmlErrorCode.NoSuchDatabase ||
      err.code === XmlErrorCode.NoSuchRecord ||
      err.code === XmlErrorCode.NoSuchField ||
      err.code === XmlErrorCode.NoSuchUser
    );
  }
  return false;
}

/**
 * Check if the error indicates an invalid or expired authentication ticket
 */
export function isInvalidTicket(err: unknown): boolean {
  if (err instanceof XmlError) {
    return err.code === XmlErrorCode.InvalidTicket;
  }
  return false;
}

/**
 * Check if the error indicates invalid input parameters
 */
export function isInvalidInput(err: unknown): boolean {
  if (err instanceof XmlError) {
    return err.code === XmlErrorCode.InvalidInput;
  }
  return false;
}
