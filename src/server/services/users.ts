import type { Row } from "@tursodatabase/serverless/compat";
import type { UserDto } from "@/types/api";

export const USER_COLS = "id,name,username,role,phone,active,created_at";

export const userDto = (r: Row): UserDto => ({
  id: String(r.id),
  name: String(r.name),
  username: String(r.username),
  role: r.role as UserDto["role"],
  ...(r.phone ? { phone: String(r.phone) } : {}),
  active: Boolean(Number(r.active)),
  createdAt: String(r.created_at),
});
