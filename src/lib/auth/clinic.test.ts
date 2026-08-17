import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireClinicUser } from "@/lib/auth/clinic";
import { prisma } from "@/lib/db/prisma";
import { resetDatabase } from "@/lib/db/repositories/test-helpers";
import { create } from "@/lib/db/repositories/userAccount.repo";

const hoisted = vi.hoisted(() => {
  const roleHolder: { user: { id: string; role: string } | null } = {
    user: null,
  };
  return { roleHolder };
});

vi.mock("@/lib/auth/session", async () => {
  const { AppError } = await import("@/lib/errors");
  return {
    requireRole: async (..._roles: string[]) => {
      if (!hoisted.roleHolder.user) {
        throw new AppError("UNAUTHORIZED", "请先登录", 401);
      }
      return hoisted.roleHolder.user;
    },
  };
});

describe("requireClinicUser", () => {
  beforeEach(resetDatabase);
  afterEach(() => prisma.$disconnect());

  it("非 clinic 角色 → 403", async () => {
    hoisted.roleHolder.user = { id: "u1", role: "user" };
    await expect(requireClinicUser()).rejects.toMatchObject({ status: 403 });
  });

  it("clinic 但无 ClinicStaff → 403", async () => {
    const u = await create({
      email: "c2@example.com",
      authProvider: "email",
      role: "clinic",
    });
    hoisted.roleHolder.user = { id: u.id, role: "clinic" };
    await expect(requireClinicUser()).rejects.toMatchObject({ status: 403 });
  });

  it("clinic + ClinicStaff → 返回 clinicId", async () => {
    const u = await create({
      email: "c3@example.com",
      authProvider: "email",
      role: "clinic",
    });
    const clinic = await prisma.clinic.create({ data: { name: "T" } });
    await prisma.clinicStaff.create({
      data: { clinicId: clinic.id, userId: u.id },
    });
    hoisted.roleHolder.user = { id: u.id, role: "clinic" };
    const r = await requireClinicUser();
    expect(r.clinicId).toBe(clinic.id);
  });
});
