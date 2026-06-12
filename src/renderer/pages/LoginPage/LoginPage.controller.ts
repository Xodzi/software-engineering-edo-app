import { makeAutoObservable } from 'mobx';
import type { FormEvent } from 'react';
import { routerController } from '../../controllers/RouterController';

interface LoginPageControllerOptions {
  login: (email: string, password: string) => Promise<void>;
  navigateToRegister: () => void;
}

export class LoginPageController {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;


  constructor(private readonly options: LoginPageControllerOptions) {
    makeAutoObservable(this);
  }

  get isFormValid(): boolean {
    return this.email.trim().length > 0 && this.password.length > 0;
  }

  setEmail(value: string): void {
    this.email = value;
    this.clearError();
  }

  setPassword(value: string): void {
    this.password = value;
    this.clearError();
  }

  async handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    
    if (!this.isFormValid) {
      this.setError('Заполните все поля');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      await this.options.login(this.email, this.password);
      routerController.navigateToList();
    } catch (err) {
      this.setError(this.extractErrorMessage(err));
    } finally {
      this.setLoading(false);
    }
  }

  navigateToRegister(): void {
    this.options.navigateToRegister();
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
    return 'Ошибка при входе в систему';
  }
}