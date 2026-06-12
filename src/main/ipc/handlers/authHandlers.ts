import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AUTH_CHANNELS } from '../../../shared/ipcChannels';
import { AuthService } from '../../services/AuthService';
import { UserRepository } from '../../repositories/UserRepository';
import { AppError } from '../../../shared/errors';
import { LoginDTO, RegisterDTO } from '../../../shared/types';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';

type AuthHandler = (...args: unknown[]) => Promise<unknown> | unknown;

export function registerAuthHandlers(db: BetterSQLite3Database<typeof schema>) {
  const userRepo = new UserRepository(db);
  const authService = new AuthService(userRepo);

  const handleWithError = (channel: string, handler: AuthHandler) => {
    ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, ...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        console.error(`[Auth] Error in ${channel}:`, error);

        if (error instanceof AppError) {
          return {
            error: {
              message: error.message,
              code: error.code,
              statusCode: error.statusCode,
            }
          };
        }

        // Неизвестная ошибка
        return {
          error: {
            message: 'Внутренняя ошибка сервера',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          }
        };
      }
    });
  };

  handleWithError(AUTH_CHANNELS.REGISTER, (dto) =>
    authService.register(dto as RegisterDTO),
  );
  handleWithError(AUTH_CHANNELS.LOGIN, (dto) =>
    authService.login(dto as LoginDTO),
  );
  handleWithError(AUTH_CHANNELS.LOGOUT, () => authService.logout());
  handleWithError(AUTH_CHANNELS.GET_CURRENT_USER, () => authService.getCurrentUser());
}
