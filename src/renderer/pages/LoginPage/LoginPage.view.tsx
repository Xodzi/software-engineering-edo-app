import { observer } from 'mobx-react-lite';
import { LoginPageController } from './LoginPage.controller';
import './LoginPage.view.css';

interface LoginPageViewProps {
  controller: LoginPageController;
}

export const LoginPageView = observer(function LoginPageView({
  controller,
}: LoginPageViewProps) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Вход в систему</h1>
          <p className="login-subtitle">Электронный документооборот</p>
        </div>

        <form onSubmit={(e) => controller.handleSubmit(e)} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={controller.email}
              onChange={(e) => controller.setEmail(e.target.value)}
              placeholder="ivan@example.com"
              disabled={controller.loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={controller.password}
              onChange={(e) => controller.setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={controller.loading}
              autoComplete="current-password"
            />
          </div>

          {controller.error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {controller.error}
              <button
                type="button"
                className="error-close"
                onClick={() => controller.clearError()}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!controller.isFormValid || controller.loading}
          >
            {controller.loading ? (
              <span className="btn-spinner">⏳</span>
            ) : (
              'Войти'
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#/register" className="link" onClick={(e) => {
            e.preventDefault();
            controller.navigateToRegister();
          }}>
            Нет аккаунта? Зарегистрироваться
          </a>
        </div>
      </div>
    </div>
  );
});