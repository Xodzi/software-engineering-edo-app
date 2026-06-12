import { makeAutoObservable } from 'mobx';

export type Route = { type: 'list' } | { type: 'detail'; id: string } | { type: 'login' } | { type: 'register' };

function parseRoute(hash: string): Route {
  const normalizedHash = hash.replace(/^#/, '');
  if (normalizedHash.startsWith('/document/')) {
    return { type: 'detail', id: normalizedHash.replace('/document/', '') };
  }
  if (normalizedHash.startsWith('/login')) {
    return { type: 'login' };
  }
  if (normalizedHash.startsWith('/register')) {
    return { type: 'register' };
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

  navigateToLogin(): void {
    window.location.hash = '/login';
  }

  navigateToRegister(): void {
    window.location.hash = '/register';
  }

  navigateToDetail(id: string): void {
    window.location.hash = `/document/${id}`;
  }

  
}

export const routerController = new RouterController();
