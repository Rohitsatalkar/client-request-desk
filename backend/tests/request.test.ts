import express from "express";
import request from "supertest";
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

import db from "../src/db/database";
import requestRoutes from "../src/routes/requestRoutes";

process.env.JWT_SECRET = "test-secret";

const app = express();

app.use(express.json());
app.use("/api/requests", requestRoutes);

const tokenWorkspace1 = jwt.sign(
  {
    userId: 1,
    workspaceId: 1,
  },
  "test-secret"
);

describe("Client Request Desk API", () => {
  it("should prevent cross-workspace request access", async () => {
    const workspace2Request = db
      .prepare(
        "SELECT id FROM customer_requests WHERE workspace_id = 2 LIMIT 1"
      )
      .get() as { id: number } | undefined;

    expect(workspace2Request).toBeDefined();

    const response = await request(app)
      .get(`/api/requests/${workspace2Request!.id}`)
      .set("Authorization", `Bearer ${tokenWorkspace1}`);

    expect(response.status).toBe(404);
  });

  it("should prevent duplicate conversion", async () => {
    const createResponse = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${tokenWorkspace1}`)
      .send({
        customerName: "Test Customer",
        requestedService: "Test Service",
        scheduledDate: "2026-12-01",
        status: "QUALIFIED",
      });

    expect(createResponse.status).toBe(201);

    const requestId = createResponse.body.request.id;

    const firstConversion = await request(app)
      .post(`/api/requests/${requestId}/convert`)
      .set("Authorization", `Bearer ${tokenWorkspace1}`);

    expect(firstConversion.status).toBe(201);

    const secondConversion = await request(app)
      .post(`/api/requests/${requestId}/convert`)
      .set("Authorization", `Bearer ${tokenWorkspace1}`);

    expect(secondConversion.status).toBe(400);

    const workItemCount = db
      .prepare(
        "SELECT COUNT(*) AS count FROM work_items WHERE request_id = ?"
      )
      .get(requestId) as { count: number };

    expect(workItemCount.count).toBe(1);

    db.prepare("DELETE FROM customer_requests WHERE id = ?").run(requestId);
  });
});