import { makeAutoObservable } from 'mobx';
import { authService } from '../../../../src/main/services/AuthService';
import { routerController } from '../../controllers/RouterController';

export class RegisterPageController {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;

  constructor() {
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

  async handleSubmit(e: React.FormEvent): Promise<void> {
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
      await authService.register(this.email, this.password, this.name);
      // После успешной регистрации перенаправляем на главную
      routerController.navigateToHome();
    } catch (err) {
      this.setError(this.extractErrorMessage(err));
    } finally {
      this.setLoading(false);
    }
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