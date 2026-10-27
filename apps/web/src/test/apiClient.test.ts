import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getIdToken } from "../features/auth/authService";
import { ApiError, apiRequest } from "../lib/apiClient";

vi.mock("../features/auth/authService", () => ({ getIdToken: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(getIdToken).mockResolvedValue("id-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("apiRequest", () => {
  it("sends the Cognito ID token as a Bearer token", async () => {
    fetchMock.mockResolvedValue(Response.json([{ noteId: "1" }]));

    await expect(apiRequest("/notes")).resolves.toEqual([{ noteId: "1" }]);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.test/notes");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer id-token" });
  });

  it("serializes the body as JSON", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 201 }));
    await apiRequest("/notes", { method: "POST", body: { title: "x" } });
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: "POST", body: '{"title":"x"}' });
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiRequest("/notes/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws an ApiError with the API's message", async () => {
    fetchMock.mockResolvedValue(Response.json({ message: "title is required" }, { status: 400 }));

    const error = await apiRequest("/notes").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "title is required" });
  });

  it("does not call the API when signed out", async () => {
    vi.mocked(getIdToken).mockResolvedValue(undefined);
    await expect(apiRequest("/notes")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
