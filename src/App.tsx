/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useAuth } from './renderer/features/auth/AuthContext';
import { routerController } from './renderer/controllers/RouterController';
import { DocumentsPage } from './renderer/pages/DocumentsPage';
import { DocumentDetailPage } from './renderer/pages/DocumentDetailPage';
import { LoginPageController } from './renderer/pages/LoginPage/LoginPage.controller';
import { LoginPageView } from './renderer/pages/LoginPage/LoginPage.view';
import { RegisterPageController } from './renderer/pages/RegisterPage/RegisterPage.controller';
import { RegisterPageView } from './renderer/pages/RegisterPage/RegisterPage.view';
import './renderer/pages/RegisterPage/RegisterPage.view.css';
import './App.css';

function App() {
  const { user, isLoading, login, register } = useAuth();
  const registerController = useLocalObservable(
    () =>
      new RegisterPageController({
        register,
        navigateToLogin: routerController.navigateToLogin,
      }),
  );
  const loginController = useLocalObservable(
    () =>
      new LoginPageController({
        login,
        navigateToRegister: routerController.navigateToRegister,
      }),
  );

  useEffect(() => {
    return routerController.init();
  }, []);

  const route = routerController.route;

  if (isLoading) {
    return <div className="app-shell">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          {route.type === 'login' && <LoginPageView controller={loginController} />}
          {route.type === 'register' && <RegisterPageView controller={registerController} />}
          {route.type === 'list' && <RegisterPageView controller={registerController} />}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />
      <main className="app-main">
        {route.type === 'list' && <DocumentsPage />}
        {route.type === 'detail' && <DocumentDetailPage documentId={route.id} />}
      </main>
    </div>
  );
}

export default observer(App);
