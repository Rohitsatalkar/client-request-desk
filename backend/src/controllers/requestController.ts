import { Response } from "express";
import db from "../db/database";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const validStatuses = ["NEW", "QUALIFIED", "CLOSED"];

export const getRequests = (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const workspaceId = req.user?.workspaceId;

    if (!workspaceId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { status } = req.query;

    if (status && !validStatuses.includes(status as string)) {
      return res.status(400).json({
        message: "Invalid status. Use NEW, QUALIFIED or CLOSED.",
      });
    }

    let query = `
      SELECT
        id,
        customer_name,
        requested_service,
        scheduled_date,
        status,
        created_at,
        updated_at
      FROM customer_requests
      WHERE workspace_id = ?
    `;

    const params: (number | string)[] = [workspaceId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status as string);
    }

    query += ` ORDER BY created_at DESC`;

    const requests = db.prepare(query).all(...params);

    return res.json({
      requests,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch requests",
    });
  }
};

export const getRequestById = (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    const requestId = Number(req.params.id);

    if (!workspaceId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID",
      });
    }

    const request = db
      .prepare(`
        SELECT
          id,
          customer_name,
          requested_service,
          scheduled_date,
          status,
          created_at,
          updated_at
        FROM customer_requests
        WHERE id = ?
          AND workspace_id = ?
      `)
      .get(requestId, workspaceId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const activities = db
      .prepare(`
        SELECT
          activities.id,
          activities.action,
          activities.created_at,
          users.name AS user_name
        FROM activities
        INNER JOIN users
          ON users.id = activities.user_id
        WHERE activities.request_id = ?
          AND activities.workspace_id = ?
        ORDER BY activities.created_at DESC
      `)
      .all(requestId, workspaceId);

    return res.json({
      request,
      activities,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch request",
    });
  }
};

export const createRequest = (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const workspaceId = req.user?.workspaceId;

    if (!workspaceId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {
      customerName,
      requestedService,
      scheduledDate,
      status = "NEW",
    } = req.body;

    if (!customerName || !requestedService || !scheduledDate) {
      return res.status(400).json({
        message:
          "customerName, requestedService and scheduledDate are required",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use NEW, QUALIFIED or CLOSED.",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO customer_requests
        (
          workspace_id,
          customer_name,
          requested_service,
          scheduled_date,
          status
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        workspaceId,
        customerName,
        requestedService,
        scheduledDate,
        status
      );

    const newRequest = db
      .prepare(`
        SELECT
          id,
          customer_name,
          requested_service,
          scheduled_date,
          status,
          created_at,
          updated_at
        FROM customer_requests
        WHERE id = ?
          AND workspace_id = ?
      `)
      .get(result.lastInsertRowid, workspaceId);

    return res.status(201).json({
      message: "Request created successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create request",
    });
  }
};

export const updateRequest = (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    const requestId = Number(req.params.id);

    if (!workspaceId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID",
      });
    }

    const existingRequest = db
      .prepare(`
        SELECT *
        FROM customer_requests
        WHERE id = ?
          AND workspace_id = ?
      `)
      .get(requestId, workspaceId) as
      | {
          id: number;
          customer_name: string;
          requested_service: string;
          scheduled_date: string;
          status: string;
        }
      | undefined;

    if (!existingRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const {
      customerName,
      requestedService,
      scheduledDate,
      status,
    } = req.body;

    const updatedCustomerName =
      customerName ?? existingRequest.customer_name;

    const updatedService =
      requestedService ?? existingRequest.requested_service;

    const updatedDate =
      scheduledDate ?? existingRequest.scheduled_date;

    const updatedStatus =
      status ?? existingRequest.status;

    if (
      !updatedCustomerName ||
      !updatedService ||
      !updatedDate
    ) {
      return res.status(400).json({
        message:
          "customerName, requestedService and scheduledDate are required",
      });
    }

    if (!validStatuses.includes(updatedStatus)) {
      return res.status(400).json({
        message: "Invalid status. Use NEW, QUALIFIED or CLOSED.",
      });
    }

    db.prepare(`
      UPDATE customer_requests
      SET
        customer_name = ?,
        requested_service = ?,
        scheduled_date = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND workspace_id = ?
    `).run(
      updatedCustomerName,
      updatedService,
      updatedDate,
      updatedStatus,
      requestId,
      workspaceId
    );

    const updatedRequest = db
      .prepare(`
        SELECT
          id,
          customer_name,
          requested_service,
          scheduled_date,
          status,
          created_at,
          updated_at
        FROM customer_requests
        WHERE id = ?
          AND workspace_id = ?
      `)
      .get(requestId, workspaceId);

    return res.json({
      message: "Request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update request",
    });
  }
};

export const convertToWorkItem = (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    const userId = req.user?.userId;
    const requestId = Number(req.params.id);

    if (!workspaceId || !userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(requestId)) {
      return res.status(400).json({
        message: "Invalid request ID",
      });
    }

    const request = db
      .prepare(`
        SELECT id, status
        FROM customer_requests
        WHERE id = ?
          AND workspace_id = ?
      `)
      .get(requestId, workspaceId) as
      | {
          id: number;
          status: string;
        }
      | undefined;

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (request.status !== "QUALIFIED") {
      return res.status(400).json({
        message: "Only QUALIFIED requests can be converted",
      });
    }

    const existingWorkItem = db
      .prepare(`
        SELECT id
        FROM work_items
        WHERE request_id = ?
          AND workspace_id = ?
      `)
      .get(requestId, workspaceId);

    if (existingWorkItem) {
      return res.status(409).json({
        message: "Request is already converted to a work item",
      });
    }

    const transaction = db.transaction(() => {
      const workItem = db
        .prepare(`
          INSERT INTO work_items
          (workspace_id, request_id)
          VALUES (?, ?)
        `)
        .run(workspaceId, requestId);

      db.prepare(`
        UPDATE customer_requests
        SET
          status = 'CLOSED',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND workspace_id = ?
      `).run(requestId, workspaceId);

      db.prepare(`
        INSERT INTO activities
        (workspace_id, request_id, user_id, action)
        VALUES (?, ?, ?, ?)
      `).run(
        workspaceId,
        requestId,
        userId,
        "Request converted to work item"
      );

      return workItem.lastInsertRowid;
    });

    const workItemId = transaction();

    return res.status(201).json({
      message: "Request converted to work item successfully",
      workItemId,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to convert request",
    });
  }
};