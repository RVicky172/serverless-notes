import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../features/auth/authContext";
import * as auth from "../features/auth/authService";
import { LoginPage } from "../features/auth/components/LoginPage";

vi.mock("../features/auth/authService", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signOut: vi.fn(),
  getIdToken: vi.fn(),
}));

function renderLogin() {
  const markSignedIn = vi.fn();
  render(
    <AuthContext value={{ status: "signedOut", markSignedIn, signOut: vi.fn() }}>
      <LoginPage />
    </AuthContext>,
  );
  return { markSignedIn, user: userEvent.setup() };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("signs in and tells the app", async () => {
    vi.mocked(auth.signIn).mockResolvedValue("signedIn");
    const { markSignedIn, user } = renderLogin();

    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "Secret123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(markSignedIn).toHaveBeenCalledOnce();
    });
    expect(auth.signIn).toHaveBeenCalledWith("me@example.com", "Secret123");
  });

  it("shows the error message when sign-in fails", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new Error("Incorrect username or password."));
    const { markSignedIn, user } = renderLogin();

    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-pass");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect username or password.");
    expect(markSignedIn).not.toHaveBeenCalled();
  });

  it("goes from sign-up to email confirmation, then back to sign-in", async () => {
    vi.mocked(auth.signUp).mockResolvedValue();
    vi.mocked(auth.confirmSignUp).mockResolvedValue();
    const { user } = renderLogin();

    await user.click(screen.getByRole("button", { name: "Need an account? Sign up" }));
    expect(screen.getByRole("heading", { name: "Create an account" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "Secret123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Confirm your email" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Verification code"), "123456");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(auth.confirmSignUp).toHaveBeenCalledWith("new@example.com", "123456");
  });

  it("asks for the code when the account is not confirmed yet", async () => {
    vi.mocked(auth.signIn).mockResolvedValue("confirmSignUp");
    const { user } = renderLogin();

    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "Secret123");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Confirm your email" })).toBeInTheDocument();
  });
});
