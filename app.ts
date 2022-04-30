import { Application } from "egg";

declare module 'egg' {
  interface Application {
    global: object;
  }
}

export default class AppHook {
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
    this.app.global = {};
  }

  async didReady() {
    this.app.global = {};
  }
}