import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { routerController } from './renderer/controllers/RouterController';
import { DocumentsPage } from './renderer/pages/DocumentsPage';
import { DocumentDetailPage } from './renderer/pages/DocumentDetailPage';
import './App.css';

function AppView() {
  useEffect(() => {
    return routerController.init();
  }, []);

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

const App = observer(AppView);

export default App;
