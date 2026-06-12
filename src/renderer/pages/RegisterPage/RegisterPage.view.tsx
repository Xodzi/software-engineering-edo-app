import { observer } from 'mobx-react-lite';
import { RegisterPageController } from './RegisterPage.controller';

interface RegisterPageViewProps {
  controller: RegisterPageController;
}

export const RegisterPageView = observer(function RegisterPageView({
  controller,
}: RegisterPageViewProps) {
  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Регистрация</h1>
          <p className="register-subtitle">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={(e) => controller.handleSubmit(e)} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Имя</label>
            <input
              id="name"
              type="text"
              value={controller.name}
              onChange={(e) => controller.setName(e.target.value)}
              placeholder="Иван Иванов"
              disabled={controller.loading}
              autoComplete="name"
              className={controller.name && !controller.loading ? 'has-value' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={controller.email}
              onChange={(e) => controller.setEmail(e.target.value)}
              placeholder="ivan@example.com"
              disabled={controller.loading}
              autoComplete="email"
              className={controller.email && !controller.loading ? 'has-value' : ''}
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
              autoComplete="new-password"
              className={controller.password ? 'has-value' : ''}
            />
            {controller.password && controller.password.length < 6 && (
              <div className="field-error hint">
                <span className="hint-icon">ℹ️</span>
                Пароль должен быть не менее 6 символов
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтверждение пароля</label>
            <input
              id="confirmPassword"
              type="password"
              value={controller.confirmPassword}
              onChange={(e) => controller.setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={controller.loading}
              autoComplete="new-password"
              className={controller.passwordMismatch ? 'error' : controller.confirmPassword ? 'has-value' : ''}
            />
            {controller.passwordMismatch && (
              <div className="field-error">
                <span className="error-icon-small">⚠️</span>
                Пароли не совпадают
              </div>
            )}
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
              'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className="register-footer">
          <a href="#/login" className="link" onClick={(e) => {
            e.preventDefault();
            controller.navigateToLogin();
          }}>
            Уже есть аккаунт? Войти
          </a>
        </div>
      </div>
    </div>
  );
});