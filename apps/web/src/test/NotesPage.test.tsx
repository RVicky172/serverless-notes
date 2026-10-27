import type { Note } from "@notes/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotesPage } from "../features/notes/components/NotesPage";
import * as api from "../features/notes/notesApi";

vi.mock("../features/notes/notesApi", () => ({
  listNotes: vi.fn(),
  getNote: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  uploadAttachment: vi.fn(),
}));

const note: Note = {
  userId: "u1",
  noteId: "0192f1d2-7a3b-7c4d-8e5f-0123456789ab",
  title: "Groceries",
  content: "Milk, eggs",
  attachmentKey: "u1/list.pdf",
  createdAt: "2026-10-27T10:00:00.000Z",
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NotesPage />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotesPage", () => {
  it("lists the user's notes", async () => {
    vi.mocked(api.listNotes).mockResolvedValue([note]);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Groceries" })).toBeInTheDocument();
    expect(screen.getByText("Milk, eggs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open attachment" })).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(api.listNotes).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/No notes yet/)).toBeInTheDocument();
  });

  it("shows an error when notes cannot be loaded", async () => {
    vi.mocked(api.listNotes).mockRejectedValue(new Error("Network down"));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Network down");
  });

  it("creates a note and refreshes the list", async () => {
    vi.mocked(api.listNotes).mockResolvedValueOnce([]).mockResolvedValue([note]);
    vi.mocked(api.createNote).mockResolvedValue(note);
    const user = renderPage();

    await user.type(screen.getByLabelText("Title"), "Groceries");
    await user.type(screen.getByLabelText("Content"), "Milk, eggs");
    await user.click(screen.getByRole("button", { name: "Add note" }));

    await waitFor(() => {
      expect(api.createNote).toHaveBeenCalledWith({
        title: "Groceries",
        content: "Milk, eggs",
        attachmentKey: undefined,
      });
    });
    expect(api.uploadAttachment).not.toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "Groceries" })).toBeInTheDocument();
  });

  it("validates with the shared schema before calling the API", async () => {
    vi.mocked(api.listNotes).mockResolvedValue([]);
    const user = renderPage();

    await user.type(screen.getByLabelText("Title"), "   ");
    await user.click(screen.getByRole("button", { name: "Add note" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("title is required");
    expect(api.createNote).not.toHaveBeenCalled();
  });
});
