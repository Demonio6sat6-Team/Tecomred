import mysql from "mysql2/promise";
import { env } from "./env.js";

const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  ...(env.MYSQL_PORT ? { port: env.MYSQL_PORT } : {}),
  // Railway y otros proveedores cloud exigen TLS; Railway usa certificados
  // públicos válidos, así que ssl sin rechazar auto-firmados funciona.
  ssl: env.MYSQL_HOST.includes("railway") ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,
});

export default pool;