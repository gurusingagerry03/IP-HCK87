// Mock the external GoogleGenAI dependency
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn(),
      },
    })),
  };
});

const { GoogleGenAI } = require('@google/genai');
const { generateAi } = require('../../helpers/aiGenerate');

describe('AI Generate Helper Tests', () => {
  let mockGenerateContent;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a fresh mock for generateContent
    mockGenerateContent = jest.fn();
    GoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    }));
  });

  describe('generateAi', () => {
    it('should generate AI content successfully', async () => {
      const expectedText = 'Generated AI response for the prompt';
      mockGenerateContent.mockResolvedValue({ text: expectedText });

      const result = await generateAi('Test prompt', 'test-model');

      expect(result).toBe(expectedText);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'test-model',
        contents: ' Test prompt',
      });
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle different prompts and models', async () => {
      const expectedText1 = 'Response to first prompt';
      const expectedText2 = 'Response to second prompt';

      mockGenerateContent
        .mockResolvedValueOnce({ text: expectedText1 })
        .mockResolvedValueOnce({ text: expectedText2 });

      const result1 = await generateAi('First prompt', 'model-1');
      const result2 = await generateAi('Second prompt', 'model-2');

      expect(result1).toBe(expectedText1);
      expect(result2).toBe(expectedText2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockGenerateContent).toHaveBeenNthCalledWith(1, {
        model: 'model-1',
        contents: ' First prompt',
      });
      expect(mockGenerateContent).toHaveBeenNthCalledWith(2, {
        model: 'model-2',
        contents: ' Second prompt',
      });
    });

    it('should handle empty prompt', async () => {
      const expectedText = 'Response to empty prompt';
      mockGenerateContent.mockResolvedValue({ text: expectedText });

      const result = await generateAi('', 'test-model');

      expect(result).toBe(expectedText);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'test-model',
        contents: ' ',
      });
    });

    it('should handle long prompt text', async () => {
      const longPrompt =
        'This is a very long prompt text that should be handled correctly by the AI service and should not cause any issues with processing or memory usage or any other problems that might occur when dealing with large text inputs';
      const expectedText = 'Response to long prompt';

      mockGenerateContent.mockResolvedValue({ text: expectedText });

      const result = await generateAi(longPrompt, 'test-model');

      expect(result).toBe(expectedText);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'test-model',
        contents: ` ${longPrompt}`,
      });
    });

    it('should throw error when AI service fails', async () => {
      const errorMessage = 'AI service unavailable';
      mockGenerateContent.mockRejectedValue(new Error(errorMessage));

      await expect(generateAi('Test prompt', 'test-model')).rejects.toThrow(errorMessage);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'test-model',
        contents: ' Test prompt',
      });
    });

    it('should return response text property', async () => {
      const mockResponse = {
        text: 'AI generated text',
        otherProperty: 'should be ignored',
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateAi('Test prompt', 'test-model');

      expect(result).toBe('AI generated text');
    });

    it('should handle null response text', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      const result = await generateAi('Test prompt', 'test-model');

      expect(result).toBeNull();
    });

    it('should handle undefined response text', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });

      const result = await generateAi('Test prompt', 'test-model');

      expect(result).toBeUndefined();
    });

    it('should handle network timeout error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Request timeout'));

      await expect(generateAi('Test prompt', 'test-model')).rejects.toThrow('Request timeout');
    });

    it('should handle API rate limit error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(generateAi('Test prompt', 'test-model')).rejects.toThrow('Rate limit exceeded');
    });

    it('should pass parameters correctly to generateContent', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'test response' });

      await generateAi('Custom prompt', 'custom-model');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'custom-model',
        contents: ' Custom prompt',
      });
    });
  });
});
