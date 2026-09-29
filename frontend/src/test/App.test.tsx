import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import App from "../App";

describe("App Login", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should login when valid credentials are submitted", async () => {
    vi.spyOn(window, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "test-token",
        user: {
          id: 1,
          name: "Rohit",
          email: "rohit@abcplumbing.com",
          workspaceId: 1,
        },
      }),
    } as Response);

    render(<App />);

    const emailInput = screen.getByPlaceholderText(
      "Enter your email"
    );

    const passwordInput = screen.getByPlaceholderText(
      "Enter your password"
    );

    const loginButton = screen.getByRole("button", {
      name: "Login",
    });

    fireEvent.change(emailInput, {
      target: {
        value: "rohit@abcplumbing.com",
      },
    });

    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });

    fireEvent.click(loginButton);

    await waitFor(() => {
  expect(
    screen.getByText("Customer Requests")
  ).toBeTruthy();
});

    expect(localStorage.getItem("token")).toBe("test-token");
  });
});