
import { useEffect, useState } from "react";
import "./App.css";

interface RequestItem {
  id: number;
  customer_name: string;
  requested_service: string;
  scheduled_date: string;
  status: "NEW" | "QUALIFIED" | "CLOSED";
}

interface Activity {
  id: number;
  action: string;
  created_at: string;
  user_name: string;
}

interface RequestDetails {
  id: number;
  customer_name: string;
  requested_service: string;
  scheduled_date: string;
  status: "NEW" | "QUALIFIED" | "CLOSED";
  created_at: string;
  updated_at: string;
}

function App() {
  // =========================
  // LOGIN
  // =========================

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // =========================
  // REQUEST LIST
  // =========================

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  // =========================
  // REQUEST DETAILS
  // =========================

  const [selectedRequest, setSelectedRequest] =
    useState<RequestDetails | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [detailsError, setDetailsError] = useState("");

  // =========================
  // CREATE REQUEST
  // =========================

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // =========================
  // FORM FIELDS
  // Used for both Create and Edit
  // =========================

  const [customerName, setCustomerName] = useState("");
  const [requestedService, setRequestedService] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const [requestStatus, setRequestStatus] =
    useState<"NEW" | "QUALIFIED" | "CLOSED">("NEW");

  // =========================
  // EDIT REQUEST
  // =========================

  const [editingRequestId, setEditingRequestId] =
    useState<number | null>(null);

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // =========================
  // CONVERSION
  // =========================

  const [showConvertConfirm, setShowConvertConfirm] =
    useState(false);

  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState("");

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setLoginError("");

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
      setLoginError("Unable to connect to server");
    } finally {
      setLoginLoading(false);
    }
  };

  // =========================
  // FETCH REQUESTS
  // =========================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      let url = "http://localhost:5000/api/requests";

      if (filter !== "ALL") {
        url += `?status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load requests");
        return;
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchRequests();
    }
  }, [isLoggedIn, filter]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setRequests([]);
    setSelectedRequest(null);
    setActivities([]);
  };

  // =========================
  // VIEW DETAILS
  // =========================

  const handleViewDetails = async (requestId: number) => {
    try {
      setDetailsError("");
      setSelectedRequest(null);
      setActivities([]);

      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setDetailsError(
          data.message || "Failed to load request details"
        );
        return;
      }

      setSelectedRequest(data.request);
      setActivities(data.activities || []);
    } catch (error) {
      console.error(error);
      setDetailsError("Unable to load request details");
    }
  };

  // =========================
  // BACK TO REQUEST LIST
  // =========================

  const handleBack = () => {
    setSelectedRequest(null);
    setActivities([]);
    setDetailsError("");
    setShowConvertConfirm(false);
    setConvertError("");
  };

  // =========================
  // CREATE REQUEST
  // =========================

  const handleCreateRequest = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setCreateLoading(true);
      setCreateError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      if (
        !customerName.trim() ||
        !requestedService.trim() ||
        !scheduledDate
      ) {
        setCreateError(
          "Customer name, service and scheduled date are required."
        );
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerName: customerName.trim(),
            requestedService: requestedService.trim(),
            scheduledDate,
            status: requestStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCreateError(
          data.message || "Failed to create request"
        );
        return;
      }

      setCustomerName("");
      setRequestedService("");
      setScheduledDate("");
      setRequestStatus("NEW");

      setShowCreateForm(false);

      await fetchRequests();
    } catch (error) {
      console.error(error);
      setCreateError("Unable to connect to server");
    } finally {
      setCreateLoading(false);
    }
  };

  // =========================
  // OPEN EDIT FORM
  // =========================

  const handleEditClick = (request: RequestItem) => {
    setEditingRequestId(request.id);

    setCustomerName(request.customer_name);
    setRequestedService(request.requested_service);
    setScheduledDate(request.scheduled_date);
    setRequestStatus(request.status);

    setEditError("");
  };

  // =========================
  // UPDATE REQUEST
  // =========================

  const handleUpdateRequest = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (editingRequestId === null) {
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      if (
        !customerName.trim() ||
        !requestedService.trim() ||
        !scheduledDate
      ) {
        setEditError(
          "Customer name, service and scheduled date are required."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/requests/${editingRequestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerName: customerName.trim(),
            requestedService: requestedService.trim(),
            scheduledDate,
            status: requestStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setEditError(
          data.message || "Failed to update request"
        );
        return;
      }

      setEditingRequestId(null);

      setCustomerName("");
      setRequestedService("");
      setScheduledDate("");
      setRequestStatus("NEW");

      await fetchRequests();
    } catch (error) {
      console.error(error);
      setEditError("Unable to connect to server");
    } finally {
      setEditLoading(false);
    }
  };

  // =========================
  // CONVERT REQUEST TO WORK ITEM
  // =========================

  const handleConvert = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      setConvertLoading(true);
      setConvertError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/requests/${selectedRequest.id}/convert`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setConvertError(
          data.message || "Failed to convert request"
        );
        return;
      }

      setShowConvertConfirm(false);

      alert(
        `Request converted successfully!\nWork Item ID: ${data.workItemId}`
      );

      await handleViewDetails(selectedRequest.id);
      await fetchRequests();
    } catch (error) {
      console.error(error);
      setConvertError("Unable to connect to server");
    } finally {
      setConvertLoading(false);
    }
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <h1>Client Request Desk</h1>

            <p className="login-subtitle">
              Login to manage customer requests
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                />
              </div>

              {loginError && (
                <div className="error-message">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="login-btn"
                disabled={loginLoading}
              >
                {loginLoading
                  ? "Logging in..."
                  : "Login"}
              </button>
            </form>

            <div className="demo-login">
              <p>Demo Login</p>
              <span>rohit@abcplumbing.com</span>
              <span>password123</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // REQUEST DETAILS PAGE
  // =========================

  if (selectedRequest) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>Client Request Desk</h1>
            <p>Request Details</p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <main className="container">
          <button
            className="view-btn"
            onClick={handleBack}
          >
            ← Back to Requests
          </button>

          <div className="page-header">
            <div>
              <h2>Request Details</h2>
              <p>
                View customer request information and activity.
              </p>
            </div>
          </div>

          <div className="request-card">
            <div className="request-info">
              <h3>
                {selectedRequest.customer_name}
              </h3>

              <p>
                <strong>Service:</strong>{" "}
                {selectedRequest.requested_service}
              </p>

              <p>
                <strong>Scheduled Date:</strong>{" "}
                {selectedRequest.scheduled_date}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`status ${selectedRequest.status.toLowerCase()}`}
                >
                  {selectedRequest.status}
                </span>
              </p>

              {/* CONVERT BUTTON */}
              {selectedRequest.status === "QUALIFIED" && (
                <div style={{ marginTop: "20px" }}>
                  <button
                    className="login-btn"
                    onClick={() => {
                      setConvertError("");
                      setShowConvertConfirm(true);
                    }}
                  >
                    Convert to Work Item
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CONVERSION CONFIRMATION */}
          {showConvertConfirm && (
            <div className="confirm-box">
              <h2>Confirm Conversion</h2>

              <p>
                Please confirm that you want to convert
                this request into a work item.
              </p>

              <div className="confirm-details">
                <p>
                  <strong>Customer:</strong>{" "}
                  {selectedRequest.customer_name}
                </p>

                <p>
                  <strong>Service:</strong>{" "}
                  {selectedRequest.requested_service}
                </p>

                <p>
                  <strong>Scheduled Date:</strong>{" "}
                  {selectedRequest.scheduled_date}
                </p>
              </div>

              {convertError && (
                <div className="error-message">
                  {convertError}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="view-btn"
                  onClick={() =>
                    setShowConvertConfirm(false)
                  }
                  disabled={convertLoading}
                >
                  Cancel
                </button>

                <button
                  className="login-btn"
                  onClick={handleConvert}
                  disabled={convertLoading}
                >
                  {convertLoading
                    ? "Converting..."
                    : "Confirm Conversion"}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVITY TIMELINE */}

          <div className="activity-section">
            <h2>Activity Timeline</h2>

            {detailsError && (
              <div className="error-message">
                {detailsError}
              </div>
            )}

            {activities.length === 0 &&
              !detailsError && (
                <div className="message">
                  No activity recorded yet.
                </div>
              )}

            {activities.length > 0 && (
              <div className="timeline">
                {activities.map((activity) => (
                  <div
                    className="timeline-item"
                    key={activity.id}
                  >
                    <div className="timeline-dot"></div>

                    <div className="timeline-content">
                      <h4>{activity.action}</h4>

                      <p>
                        By {activity.user_name}
                      </p>

                      <span>
                        {new Date(
                          activity.created_at
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // =========================
  // CREATE REQUEST PAGE
  // =========================

  if (showCreateForm) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>Client Request Desk</h1>
            <p>Create customer request</p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <main className="container">
          <button
            className="view-btn"
            onClick={() => {
              setShowCreateForm(false);
              setCreateError("");
            }}
          >
            ← Back to Requests
          </button>

          <div className="page-header">
            <div>
              <h2>Create Request</h2>
              <p>Add a new customer request.</p>
            </div>
          </div>

          <form
            className="request-form"
            onSubmit={handleCreateRequest}
          >
            <div className="form-group">
              <label>Customer Name</label>

              <input
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="form-group">
              <label>Requested Service</label>

              <input
                type="text"
                value={requestedService}
                onChange={(event) =>
                  setRequestedService(event.target.value)
                }
                placeholder="Enter requested service"
                required
              />
            </div>

            <div className="form-group">
              <label>Scheduled Date</label>

              <input
                type="date"
                value={scheduledDate}
                onChange={(event) =>
                  setScheduledDate(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>

              <select
                value={requestStatus}
                onChange={(event) =>
                  setRequestStatus(
                    event.target.value as
                      | "NEW"
                      | "QUALIFIED"
                      | "CLOSED"
                  )
                }
              >
                <option value="NEW">NEW</option>
                <option value="QUALIFIED">
                  QUALIFIED
                </option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {createError && (
              <div className="error-message">
                {createError}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="view-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="login-btn"
                disabled={createLoading}
              >
                {createLoading
                  ? "Creating..."
                  : "Create Request"}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // =========================
  // EDIT REQUEST PAGE
  // =========================

  if (editingRequestId !== null) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>Client Request Desk</h1>
            <p>Edit customer request</p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <main className="container">
          <button
            className="view-btn"
            onClick={() => {
              setEditingRequestId(null);
              setEditError("");
            }}
          >
            ← Back to Requests
          </button>

          <div className="page-header">
            <div>
              <h2>Edit Request</h2>
              <p>
                Update customer request information.
              </p>
            </div>
          </div>

          <form
            className="request-form"
            onSubmit={handleUpdateRequest}
          >
            <div className="form-group">
              <label>Customer Name</label>

              <input
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Requested Service</label>

              <input
                type="text"
                value={requestedService}
                onChange={(event) =>
                  setRequestedService(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Scheduled Date</label>

              <input
                type="date"
                value={scheduledDate}
                onChange={(event) =>
                  setScheduledDate(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>

              <select
                value={requestStatus}
                onChange={(event) =>
                  setRequestStatus(
                    event.target.value as
                      | "NEW"
                      | "QUALIFIED"
                      | "CLOSED"
                  )
                }
              >
                <option value="NEW">NEW</option>
                <option value="QUALIFIED">
                  QUALIFIED
                </option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {editError && (
              <div className="error-message">
                {editError}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="view-btn"
                onClick={() => {
                  setEditingRequestId(null);
                  setEditError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="login-btn"
                disabled={editLoading}
              >
                {editLoading
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // =========================
  // REQUEST LIST PAGE
  // =========================

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Client Request Desk</h1>
          <p>Manage customer requests</p>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className="container">
        <div className="page-header">
          <div>
            <h2>Customer Requests</h2>

            <p>
              Review and manage incoming customer requests.
            </p>
          </div>

          <button
            className="login-btn"
            onClick={() => {
              setCreateError("");
              setShowCreateForm(true);
            }}
          >
            + Create Request
          </button>
        </div>

        <div className="filters">
          {["ALL", "NEW", "QUALIFIED", "CLOSED"].map(
            (status) => (
              <button
                key={status}
                className={`filter ${
                  filter === status ? "active" : ""
                }`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            )
          )}
        </div>

        {loading && (
          <div className="message">
            Loading requests...
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          requests.length === 0 && (
            <div className="message">
              No requests found.
            </div>
          )}

        {!loading &&
          !error &&
          requests.map((request) => (
            <div
              className="request-card"
              key={request.id}
            >
              <div className="request-info">
                <h3>{request.customer_name}</h3>

                <p>{request.requested_service}</p>

                <span>
                  Scheduled: {request.scheduled_date}
                </span>
              </div>

              <div className="request-status">
                <span
                  className={`status ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>

                <button
                  className="view-btn"
                  onClick={() =>
                    handleEditClick(request)
                  }
                >
                  Edit
                </button>

                <button
                  className="view-btn"
                  onClick={() =>
                    handleViewDetails(request.id)
                  }
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}

export default App;
