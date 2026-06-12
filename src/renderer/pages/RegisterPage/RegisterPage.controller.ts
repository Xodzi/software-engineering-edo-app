import { makeAutoObservable } from 'mobx';
import type { FormEvent } from 'react';
import { routerController } from '../../controllers/RouterController';

interface RegisterPageControllerOptions {
  register: (name: string, email: string, password: string) => Promise<void>;
  navigateToLogin: () => void;
}

export class RegisterPageController {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;

  constructor(private readonly options: RegisterPageControllerOptions) {
    makeAutoObservable(this);
  }

  get isFormValid(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.password.length > 0 &&
      this.password === this.confirmPassword
    );
  }

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  setName(value: string): void {
    this.name = value;
    this.clearError();
  }

  setEmail(value: string): void {
    this.email = value;
    this.clearError();
  }

  setPassword(value: string): void {
    this.password = value;
    this.clearError();
  }

  setConfirmPassword(value: string): void {
    this.confirmPassword = value;
    this.clearError();
  }

  async handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();

    if (!this.isFormValid) {
      if (this.passwordMismatch) {
        this.setError('Пароли не совпадают');
      } else {
        this.setError('Заполните все поля корректно');
      }
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      await this.options.register(this.name, this.email, this.password);
      routerController.navigateToList();
    } catch (err) {
      this.setError(this.extractErrorMessage(err));
    } finally {
      this.setLoading(false);
    }
  }

  navigateToLogin(): void {
    this.options.navigateToLogin();
  }

  clearError(): void {
    this.error = null;
  }

  private setLoading(value: boolean): void {
    this.loading = value;
  }

  private setError(error: string | null): void {
    this.error = error;
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'Ошибка при регистрации';
  }
}