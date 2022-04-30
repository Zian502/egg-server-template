
import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql';
import { rmSync } from 'fs';
import { Readable } from 'stream';

export class TestUtil {
  private static connection;
  private static tables;
  private static _app;

  static get app() {
    if (!this._app) {
      /* eslint @typescript-eslint/no-var-requires: "off" */
      const bootstrap = require('egg-mock/bootstrap');
      this._app = bootstrap.app;
    }
    return this._app;
  }

  static getMySqlConfig() {
    return {
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      multipleStatements: true,
    };
  }

  static getDatabase() {
    return process.env.MYSQL_DATABASE || 'mysql_unittest';
  }

  static async getTableSqls(): Promise<string> {
    return await fs.readFile(path.join(__dirname, '../sql/init.sql'), 'utf8');
  }

  static getConnection() {
    if (!this.connection) {
      const config = this.getMySqlConfig();
      this.connection = mysql.createConnection(config);
      this.connection.connect();
    }
    return this.connection;
  }

  static destroyConnection() {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }

  static async createDatabase() {
    const database = this.getDatabase();
    const sqls = this.getTableSqls();
    if (!process.env.CI) {
      await this.query(`DROP DATABASE IF EXISTS ${database};`);
      await this.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8;`);
      console.log('[TestUtil] CREATE DATABASE: %s', database);
    }
    await this.query(`USE ${database};`);
    await this.query(sqls);
    this.destroyConnection();
  }

  static async query(sql): Promise<any[]> {
    const conn = this.getConnection();
    return new Promise((resolve, reject) => {
      conn.query(sql, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  static async getTableNames() {
    if (!this.tables) {
      const database = this.getDatabase();
      const sql = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${database}';`;
      const rows = await this.query(sql);
      this.tables = rows.map(row => row.TABLE_NAME);
    }
    return this.tables;
  }

  static async truncateDatabase() {
    const database = this.getDatabase();
    const tables = await this.getTableNames();
    await Promise.all(tables.map(table => this.query(`TRUNCATE TABLE ${database}.${table};`)));
  }

  static rm(filepath) {
    rmSync(filepath, { recursive: true, force: true });
  }

  static getFixtures(name?: string): string {
    return path.join(__dirname, 'fixtures', name ?? '');
  }


  static async readStreamToLog(urlOrStream) {
    let stream: Readable;
    if (typeof urlOrStream === 'string') {
      const { res } = await this.app.curl(urlOrStream, { streaming: true });
      stream = res;
    } else {
      stream = urlOrStream;
    }
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString();
  }

}
