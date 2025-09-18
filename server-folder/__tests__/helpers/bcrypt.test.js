const bcryptHelper = require('../../helpers/bcrypt');

describe('Bcrypt Helper Tests', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should create different hashes for the same password', async () => {
      const plainPassword = 'testPassword123';
      const hash1 = await bcryptHelper.hashPassword(plainPassword);
      const hash2 = await bcryptHelper.hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hashedPassword = await bcryptHelper.hashPassword('');

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should handle special characters in password', async () => {
      const plainPassword = '!@#$%^&*()_+{}[]|;:<>?,./';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should handle long password', async () => {
      const plainPassword = 'a'.repeat(100);
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      const result = await bcryptHelper.comparePasswords(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      const result = await bcryptHelper.comparePasswords(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const plainPassword = '';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      const result = await bcryptHelper.comparePasswords('', hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when comparing non-empty password with empty hash', async () => {
      const plainPassword = 'testPassword123';
      const emptyHash = await bcryptHelper.hashPassword('');

      const result = await bcryptHelper.comparePasswords(plainPassword, emptyHash);
      expect(result).toBe(false);
    });

    it('should handle case-sensitive password comparison', async () => {
      const plainPassword = 'TestPassword123';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      // Should match exact case
      const correctResult = await bcryptHelper.comparePasswords('TestPassword123', hashedPassword);
      expect(correctResult).toBe(true);

      // Should not match different case
      const incorrectResult = await bcryptHelper.comparePasswords(
        'testpassword123',
        hashedPassword
      );
      expect(incorrectResult).toBe(false);
    });

    it('should handle special characters in password comparison', async () => {
      const plainPassword = '!@#$%^&*()_+{}[]|;:<>?,./';
      const hashedPassword = await bcryptHelper.hashPassword(plainPassword);

      const result = await bcryptHelper.comparePasswords(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for invalid hash format', async () => {
      const plainPassword = 'testPassword123';
      const invalidHash = 'invalid-hash-format';

      const result = await bcryptHelper.comparePasswords(plainPassword, invalidHash);
      expect(result).toBe(false);
    });
  });
});
