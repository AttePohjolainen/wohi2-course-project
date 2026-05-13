import { describe, it, expect } from "vitest";
import helpers from "./helpers.js";

const { request, app } = helpers;

describe("auth routes", () => {
  it("returns error when login body is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(res.status).toBe(400);
  });
});
