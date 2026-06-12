import { makeAutoObservable } from 'mobx';

export type Route = { type: 'list' } | { type: 'detail'; id: string };

function parseRoute(hash: string): Route {
  const normalizedHash = hash.replace(/^#/, '');
  if (normalizedHash.startsWith('/document/')) {
    return { type: 'detail', id: normalizedHash.replace('/document/', '') };
  }
  return { type: 'list' };
}

export class RouterController {
  route: Route = parseRoute(window.location.hash);

  constructor() {
    makeAutoObservable(this);
  }

  init(): () => void {
    const handler = () => {
      this.route = parseRoute(window.location.hash);
    };
    window.addEventListener('hashchange', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
    };
  }

  navigateToList(): void {
    window.location.hash = '/';
  }

  navigateToDetail(id: string): void {
    window.location.hash = `/document/${id}`;
  }

  
}

export const routerController = new RouterController();
