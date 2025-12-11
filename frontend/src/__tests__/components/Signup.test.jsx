import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Signup from "../../pages/Signup";

const mockNavigate = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal("fetch", (...args) => mockFetch(...args));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Signup Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockFetch.mockReset();
  });

  function renderSignup() {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );
  }

  it("renders signup form correctly", () => {
    renderSignup();

    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it("shows password validation errors", async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^password/i), "weak");
    await user.type(screen.getByLabelText(/confirm/i), "weak");
    await user.selectOptions(screen.getByLabelText(/role/i), "patient");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/password needs/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^password/i), "Password123");
    await user.type(screen.getByLabelText(/confirm/i), "Password456");
    await user.selectOptions(screen.getByLabelText(/role/i), "patient");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("successfully creates account with valid data", async () => {
    const user = userEvent.setup();
    renderSignup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ msg: "ok" }),
    });

    await user.type(screen.getByLabelText(/email/i), "new@test.com");
    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/^password/i), "Password123");
    await user.type(screen.getByLabelText(/confirm/i), "Password123");
    await user.selectOptions(screen.getByLabelText(/role/i), "doctor");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows error for already registered email", async () => {
    const user = userEvent.setup();
    renderSignup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Email already registered" }),
    });

    await user.type(screen.getByLabelText(/email/i), "patient@test.com");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^password/i), "Password123");
    await user.type(screen.getByLabelText(/confirm/i), "Password123");
    await user.selectOptions(screen.getByLabelText(/role/i), "patient");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("validates role selection is required", async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^password/i), "Password123");
    await user.type(screen.getByLabelText(/confirm/i), "Password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("updates password match message in real-time", async () => {
    const user = userEvent.setup();
    renderSignup();

    const pw = screen.getByLabelText(/^password/i);
    const conf = screen.getByLabelText(/confirm/i);

    await user.type(pw, "Password123");
    await user.type(conf, "Password");

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    await user.clear(conf);
    await user.type(conf, "Password123");

    await waitFor(() => {
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });
  });
});