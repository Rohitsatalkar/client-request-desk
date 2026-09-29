import db from "./database";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

db.exec(schema);

console.log("Database tables created.");

const existingWorkspaces = db
  .prepare("SELECT COUNT(*) as count FROM workspaces")
  .get() as { count: number };

if (existingWorkspaces.count > 0) {
  console.log("Seed data already exists.");
  process.exit(0);
}

const workspace1 = db
  .prepare("INSERT INTO workspaces (name) VALUES (?)")
  .run("ABC Plumbing");

const workspace2 = db
  .prepare("INSERT INTO workspaces (name) VALUES (?)")
  .run("XYZ Plumbing");

const password = bcrypt.hashSync("password123", 10);

const user1 = db
  .prepare(
    "INSERT INTO users (name, email, password, workspace_id) VALUES (?, ?, ?, ?)"
  )
  .run(
    "Rohit",
    "rohit@abcplumbing.com",
    password,
    workspace1.lastInsertRowid
  );

const user2 = db
  .prepare(
    "INSERT INTO users (name, email, password, workspace_id) VALUES (?, ?, ?, ?)"
  )
  .run(
    "Amit",
    "amit@xyzplumbing.com",
    password,
    workspace2.lastInsertRowid
  );

db.prepare(
  `INSERT INTO customer_requests
   (workspace_id, customer_name, requested_service, scheduled_date, status)
   VALUES (?, ?, ?, ?, ?)`
).run(
  workspace1.lastInsertRowid,
  "Rahul Patil",
  "Bathroom Plumbing",
  "2026-09-30",
  "NEW"
);

db.prepare(
  `INSERT INTO customer_requests
   (workspace_id, customer_name, requested_service, scheduled_date, status)
   VALUES (?, ?, ?, ?, ?)`
).run(
  workspace1.lastInsertRowid,
  "Priya Sharma",
  "Kitchen Pipe Repair",
  "2026-10-02",
  "QUALIFIED"
);

db.prepare(
  `INSERT INTO customer_requests
   (workspace_id, customer_name, requested_service, scheduled_date, status)
   VALUES (?, ?, ?, ?, ?)`
).run(
  workspace2.lastInsertRowid,
  "Sneha Joshi",
  "Water Tank Repair",
  "2026-10-01",
  "NEW"
);

console.log("Seed data inserted successfully.");

console.log("\nLogin accounts:");
console.log("ABC Plumbing: rohit@abcplumbing.com / password123");
console.log("XYZ Plumbing: amit@xyzplumbing.com / password123");

db.close();