import '@eggjs/tegg';

export const USER_ADD = 'USER_ADD';

declare module '@eggjs/tegg' {
  interface Events {
    [USER_ADD]: (username: string, password: string) => Promise<void>;
  }
}
