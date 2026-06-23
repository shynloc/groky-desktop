import { describe, it, expect } from 'vitest';
import {
  validateGrokEvent,
  validateRawToolCall,
  validateRawToolResult,
  validatePermissionRequest,
  safeParseGrokEvent,
  safeParseRawToolCall,
  safeParseRawToolResult,
  safeParsePermissionRequest,
} from '../services/typeValidation';

describe('typeValidation', () => {
  describe('GrokEventSchema', () => {
    it('should validate a valid GrokEvent', () => {
      const event = {
        type: 'text',
        data: 'Hello, world!',
      };
      expect(validateGrokEvent(event)).toBe(true);
    });

    it('should validate with optional fields', () => {
      const event = {
        type: 'tool_use',
        data: '{}',
        session_id: 'session-123',
        raw_json: { name: 'test_tool' },
      };
      expect(validateGrokEvent(event)).toBe(true);
    });

    it('should reject invalid GrokEvent', () => {
      const event = {
        type: 123, // Should be string
        data: 'Hello',
      };
      expect(validateGrokEvent(event)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const event = {
        type: 'text',
        // Missing data
      };
      expect(validateGrokEvent(event)).toBe(false);
    });
  });

  describe('RawToolCallSchema', () => {
    it('should validate a valid RawToolCall', () => {
      const toolCall = {
        id: 'tool-123',
        name: 'read_file',
        input: { path: '/path/to/file' },
      };
      expect(validateRawToolCall(toolCall)).toBe(true);
    });

    it('should validate with alternative field names', () => {
      const toolCall = {
        tool_use_id: 'tool-123',
        tool: 'read_file',
        parameters: { path: '/path/to/file' },
      };
      expect(validateRawToolCall(toolCall)).toBe(true);
    });

    it('should accept empty object', () => {
      expect(validateRawToolCall({})).toBe(true);
    });
  });

  describe('RawToolResultSchema', () => {
    it('should validate a valid RawToolResult', () => {
      const result = {
        tool_use_id: 'tool-123',
        content: 'File content',
      };
      expect(validateRawToolResult(result)).toBe(true);
    });

    it('should validate with error status', () => {
      const result = {
        id: 'tool-123',
        is_error: true,
        output: 'Error message',
      };
      expect(validateRawToolResult(result)).toBe(true);
    });
  });

  describe('PermissionRequestSchema', () => {
    it('should validate a valid PermissionRequest', () => {
      const request = {
        tool: 'run_terminal_command',
        command: 'npm install',
      };
      expect(validatePermissionRequest(request)).toBe(true);
    });

    it('should validate with alternative field names', () => {
      const request = {
        name: 'run_terminal_command',
        path: '/path/to/file',
        file_path: '/path/to/file',
      };
      expect(validatePermissionRequest(request)).toBe(true);
    });
  });

  describe('safeParse functions', () => {
    it('should return parsed data for valid input', () => {
      const event = {
        type: 'text',
        data: 'Hello',
      };
      const result = safeParseGrokEvent(event);
      expect(result).toEqual(event);
    });

    it('should return null for invalid input', () => {
      const event = {
        type: 123,
        data: 'Hello',
      };
      const result = safeParseGrokEvent(event);
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      expect(safeParseRawToolCall(undefined)).toBeNull();
      expect(safeParseRawToolResult(undefined)).toBeNull();
      expect(safeParsePermissionRequest(undefined)).toBeNull();
    });
  });
});
