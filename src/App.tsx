import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useAuth } from './renderer/features/auth/AuthContext';
import { routerController } from './renderer/controllers/RouterController';
import { DocumentsPage } from './renderer/pages/DocumentsPage';
import { DocumentDetailPage } from './renderer/pages/DocumentDetailPage';
import RegisterForm from './renderer/pages/RegisterPage/RegisterPage.view';
import './App.css';

function App() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    return routerController.init();
  }, []);

  if (isLoading) {
    return <div className="app-shell">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <RegisterForm />
        </main>
      </div>
    );
  }

  const route = routerController.route;

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
