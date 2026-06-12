import { makeAutoObservable } from 'mobx';
import { routerController } from '../../controllers/RouterController';

export class LoginPageController {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;


  constructor() {
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

  async handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    
    if (!this.isFormValid) {
      this.setError('Заполните все поля');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const result = await window.electronAPI.auth.login({
        email: this.email,
        password: this.password
      });          
      routerController.navigateToList();
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
    return 'Ошибка при входе в систему';
  }
}