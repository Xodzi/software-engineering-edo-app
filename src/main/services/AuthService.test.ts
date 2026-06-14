import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthService } from './AuthService';
import { UserRepository } from '@main/repositories/UserRepository';
import { User } from '@shared/types';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$mockhash'),
    compare: vi.fn().mockImplementation(async (plain: string) => {
      return plain === 'correctpassword';
    }),
  },
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$10$mockhash',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createMockUserRepo(user: User | null = null): UserRepository {
  return {
    findByEmail: vi.fn().mockReturnValue(user),
    findById: vi.fn().mockReturnValue(user),
    create: vi.fn().mockImplementation((data) => makeUser({ ...data, id: 10 })),
  } as unknown as UserRepository;
}

describe('AuthService', () => {
  describe('register', () => {
    it('registers a new user and returns token', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      const result = await service.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      });

      expect(result.user.email).toBe('new@example.com');
      expect(result.user.name).toBe('New User');
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^token_/);
      expect(repo.create).toHaveBeenCalled();
    });

    it('throws on existing email', async () => {
      const existingUser = makeUser();
      const repo = createMockUserRepo(existingUser);
      const service = new AuthService(repo);

      await expect(
        service.register({ email: 'test@example.com', name: 'User', password: 'password123' }),
      ).rejects.toThrow('уже существует');
    });

    it('throws on missing email', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      await expect(
        service.register({ email: '', name: 'User', password: 'password123' }),
      ).rejects.toThrow('Email обязателен');
    });

    it('throws on missing name', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      await expect(
        service.register({ email: 'a@b.com', name: '', password: 'password123' }),
      ).rejects.toThrow('Имя обязательно');
    });

    it('throws on short password', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      await expect(
        service.register({ email: 'a@b.com', name: 'User', password: '123' }),
      ).rejects.toThrow('не менее 6 символов');
    });

    it('does not return password in response', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      const result = await service.register({
        email: 'a@b.com',
        name: 'User',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      const repo = createMockUserRepo(makeUser());
      const service = new AuthService(repo);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('throws on invalid email', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password' }),
      ).rejects.toThrow('Неверный email или пароль');
    });

    it('throws on wrong password', async () => {
      const repo = createMockUserRepo(makeUser());
      const service = new AuthService(repo);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow('Неверный email или пароль');
    });

    it('throws on missing email', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      await expect(
        service.login({ email: '', password: 'pass' }),
      ).rejects.toThrow('Email обязателен');
    });

    it('throws on missing password', async () => {
      const repo = createMockUserRepo(null);
      const service = new AuthService(repo);

      await expect(
        service.login({ email: 'a@b.com', password: '' }),
      ).rejects.toThrow('Пароль обязателен');
    });
  });

  describe('logout', () => {
    it('clears current user', async () => {
      const repo = createMockUserRepo(makeUser());
      const service = new AuthService(repo);

      await service.login({ email: 'test@example.com', password: 'correctpassword' });
      expect(service.getCurrentUser()).not.toBeNull();

      service.logout();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when not logged in', () => {
      const repo = createMockUserRepo(makeUser());
      const service = new AuthService(repo);
      expect(service.getCurrentUser()).toBeNull();
    });

    it('returns user when logged in', async () => {
      const user = makeUser();
      const repo = createMockUserRepo(user);
      const service = new AuthService(repo);

      await service.login({ email: 'test@example.com', password: 'correctpassword' });
      const current = service.getCurrentUser();

      expect(current).not.toBeNull();
      expect(current!.email).toBe('test@example.com');
    });
  });
});
