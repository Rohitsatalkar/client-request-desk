import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "client-request-desk.db");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

export default db;