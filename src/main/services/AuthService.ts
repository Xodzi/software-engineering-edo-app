// src/main/services/AuthService.ts
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { RegisterDTO, LoginDTO, AuthResponse, User } from '@shared/types';
import { AuthErrors } from '../../shared/errors';

export class AuthService {
  private currentUserId: number | null = null;

  constructor(private userRepo: UserRepository) {}

  async register(dto: RegisterDTO): Promise<AuthResponse> {
    this.validateRegisterDto(dto);

    const existing = this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw AuthErrors.USER_EXISTS(dto.email);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email.toLowerCase().trim(),
      name: dto.name.trim(),
      password: hashedPassword,
    });

    const token = this.generateToken(user.id);
    this.currentUserId = user.id;

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(dto: LoginDTO): Promise<AuthResponse> {
    this.validateLoginDto(dto);

    const user = this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw AuthErrors.INVALID_CREDENTIALS();
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw AuthErrors.INVALID_CREDENTIALS();
    }

    const token = this.generateToken(user.id);
    this.currentUserId = user.id;

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  logout() {
    this.currentUserId = null;
  }

  getCurrentUser() {
    if (!this.currentUserId) return null;
    
    const user = this.userRepo.findById(this.currentUserId);
    return user ? this.sanitizeUser(user) : null;
  }

  // ========== Валидация ==========
  private validateRegisterDto(dto: RegisterDTO) {
    if (!dto.email?.trim()) throw AuthErrors.VALIDATION_ERROR('email', 'Email обязателен');
    if (!dto.name?.trim()) throw AuthErrors.VALIDATION_ERROR('name', 'Имя обязательно');
    if (!dto.password || dto.password.length < 6) {
      throw AuthErrors.VALIDATION_ERROR('password', 'Пароль должен быть не менее 6 символов');
    }
  }

  private validateLoginDto(dto: LoginDTO) {
    if (!dto.email?.trim()) throw AuthErrors.VALIDATION_ERROR('email', 'Email обязателен');
    if (!dto.password) throw AuthErrors.VALIDATION_ERROR('password', 'Пароль обязателен');
  }

  private generateToken(userId: number): string {
    // Для MVP — простой токен. Позже можно заменить на JWT.
    return `token_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
