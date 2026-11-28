import { api, ApiError } from "./client";
import type {
  SessionUser,
  LoginRequest,
  LoginResponse,
  MeResponse,
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  GarmentDto,
  GarmentDetailDto,
  GarmentListQuery,
  CreateGarmentRequest,
  UpdateGarmentRequest,
  UpdateLocationRequest,
  UpdateStatusRequest,
  AvailabilityRow,
  CustomerDto,
  CustomerInput,
  QuoteRequest,
  QuoteResponse,
  CreateBookingRequest,
  BookingDto,
  BookingListQuery,
  PickupRequest,
  AddPaymentRequest,
  ReturnRequest,
  ReturnResponse,
  CancelRequest,
  UpdateBookingRequest,
  CareJobDto,
  CreateCareRequest,
  ReceiveCareRequest,
  PresignRequest,
  PresignResponse,
  RegisterPhotoRequest,
  PhotoDto,
  AlertDto,
  ExpenseDto,
  CashClosingDto,
  CashTodayDto,
  CloseCashRequest,
  ReportSummary,
  SyncStatus,
  SettingsDto,
} from "@/types/api";

export { ApiError };

function toQueryString(params: Record<string, any>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      q.set(key, String(val));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : "";
}

/**
 * The server wraps single-object responses ({ booking }, { garment }, { job }, ...).
 * Unwrap by key so callers get the bare DTO their types promise; a bare object passes through unchanged.
 */
async function unwrap<T>(p: Promise<any>, key: string): Promise<T> {
  const res = await p;
  return (res && typeof res === "object" && key in res ? res[key] : res) as T;
}

// ======================== AUTH ========================
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),
  logout: () => api.post<{ ok: boolean }>("/auth/logout"),
  getMe: () => api.get<MeResponse>("/auth/me"),
};

// ======================== USERS (Admin) ========================
export const usersApi = {
  list: () => api.get<{ users: UserDto[] }>("/users"),
  create: (data: CreateUserRequest) => api.post<{ user: UserDto }>("/users", data),
  update: (id: string, data: UpdateUserRequest) => api.patch<{ user: UserDto }>(`/users/${id}`, data),
  resetPassword: (id: string, data: ResetPasswordRequest) => api.post<{ ok: boolean }>(`/users/${id}/reset-password`, data),
  deleteSessions: (id: string) => api.del<{ ok: boolean }>(`/users/${id}/sessions`),
};

// ======================== GARMENTS ========================
export const garmentsApi = {
  list: async (query: GarmentListQuery = {}) => {
    const res = await api.get<{ garments?: GarmentDto[]; items?: GarmentDto[]; nextCursor?: string }>(
      `/garments${toQueryString(query)}`
    );
    return {
      items: res.items ?? res.garments ?? [],
      nextCursor: res.nextCursor,
    };
  },

  getById: (id: string) => unwrap<GarmentDetailDto>(api.get(`/garments/${id}`), "garment"),

  create: (data: CreateGarmentRequest) => unwrap<GarmentDto>(api.post("/garments", data), "garment"),

  update: (id: string, data: UpdateGarmentRequest) => unwrap<GarmentDto>(api.patch(`/garments/${id}`, data), "garment"),

  updateLocation: (id: string, data: UpdateLocationRequest) =>
    unwrap<GarmentDto>(api.patch(`/garments/${id}/location`, data), "garment"),

  updateStatus: (id: string, data: UpdateStatusRequest) =>
    unwrap<GarmentDto>(api.patch(`/garments/${id}/status`, data), "garment"),

  getAvailability: async (from: string, to: string, category?: string) => {
    const res = await api.get<{ rows?: AvailabilityRow[]; items?: AvailabilityRow[] }>(
      `/garments/availability${toQueryString({ from, to, category })}`
    );
    return { items: res.items ?? res.rows ?? [] };
  },
};

// ======================== CUSTOMERS ========================
export const customersApi = {
  list: async (q?: string) => {
    const res = await api.get<{ customers?: CustomerDto[]; items?: CustomerDto[] }>(
      `/customers${toQueryString({ q })}`
    );
    return {
      items: res.items ?? res.customers ?? [],
    };
  },

  getById: (id: string) => unwrap<CustomerDto>(api.get(`/customers/${id}`), "customer"),

  createOrUpdate: (data: CustomerInput) => unwrap<CustomerDto>(api.post("/customers", data), "customer"),

  update: (id: string, data: Partial<CustomerInput>) => unwrap<CustomerDto>(api.patch(`/customers/${id}`, data), "customer"),
};

// ======================== BOOKINGS ========================
export const bookingsApi = {
  quote: (data: QuoteRequest) => api.post<QuoteResponse>("/bookings/quote", data),

  create: (data: CreateBookingRequest) => unwrap<BookingDto>(api.post("/bookings", data), "booking"),

  list: async (query: BookingListQuery = {}) => {
    const res = await api.get<{ bookings?: BookingDto[]; items?: BookingDto[]; nextCursor?: string }>(
      `/bookings${toQueryString(query)}`
    );
    return {
      items: res.items ?? res.bookings ?? [],
      nextCursor: res.nextCursor,
    };
  },

  getById: (id: string) => unwrap<BookingDto>(api.get(`/bookings/${id}`), "booking"),

  update: (id: string, data: UpdateBookingRequest) => unwrap<BookingDto>(api.patch(`/bookings/${id}`, data), "booking"),

  pickup: (id: string, data: PickupRequest) => unwrap<BookingDto>(api.post(`/bookings/${id}/pickup`, data), "booking"),

  return: (id: string, data: ReturnRequest) => api.post<ReturnResponse>(`/bookings/${id}/return`, data),

  addPayment: (id: string, data: AddPaymentRequest) => unwrap<BookingDto>(api.post(`/bookings/${id}/payments`, data), "booking"),

  cancel: (id: string, data: CancelRequest) => unwrap<BookingDto>(api.post(`/bookings/${id}/cancel`, data), "booking"),
};

// ======================== CARE ========================
export const careApi = {
  list: async (status?: "OUT" | "RECEIVED", garmentId?: string) => {
    const res = await api.get<{ jobs?: CareJobDto[]; items?: CareJobDto[] }>(
      `/care${toQueryString({ status, garmentId })}`
    );
    return {
      items: res.items ?? res.jobs ?? [],
    };
  },

  create: (data: CreateCareRequest) => unwrap<CareJobDto>(api.post("/care", data), "job"),

  receive: (id: string, data: ReceiveCareRequest) => unwrap<CareJobDto>(api.post(`/care/${id}/receive`, data), "job"),
};

// ======================== ALERTS ========================
export const alertsApi = {
  list: () => api.get<{ alerts: AlertDto[] }>("/alerts"),
};

// ======================== EXPENSES ========================
export const expensesApi = {
  list: async (from?: string, to?: string, category?: string) => {
    const res = await api.get<{ expenses?: ExpenseDto[]; items?: ExpenseDto[] }>(
      `/expenses${toQueryString({ from, to, category })}`
    );
    return {
      items: res.items ?? res.expenses ?? [],
    };
  },

  create: (data: Omit<ExpenseDto, "id">) => unwrap<ExpenseDto>(api.post("/expenses", data), "expense"),

  update: (id: string, data: Partial<Omit<ExpenseDto, "id">>) => unwrap<ExpenseDto>(api.patch(`/expenses/${id}`, data), "expense"),

  delete: (id: string) => api.del<{ ok: boolean }>(`/expenses/${id}`),
};

// ======================== CASH CLOSING ========================
export const cashApi = {
  getToday: (date?: string) => api.get<CashTodayDto>(`/cash/today${toQueryString({ date })}`),

  close: (data: CloseCashRequest) => unwrap<CashClosingDto>(api.post("/cash/closing", data), "closing"),

  getClosings: (limit?: number) => api.get<{ closings: CashClosingDto[] }>(`/cash/closings${toQueryString({ limit })}`),
};

// ======================== REPORTS ========================
export const reportsApi = {
  getSummary: (from?: string, to?: string) =>
    api.get<ReportSummary>(`/reports/summary${toQueryString({ from, to })}`),

  getExportUrl: (type: "bookings" | "payments" | "cashclosings" | "expenses" | "garments" | "customers") =>
    `/api/v1/reports/export.csv?type=${type}`,
};

// ======================== PHOTOS ========================
export const photosApi = {
  presign: (data: PresignRequest) => api.post<PresignResponse>("/photos/presign", data),

  uploadBinary: async (uploadUrl: string, fileBlob: Blob | File) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: fileBlob,
    });
    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }
  },

  register: (data: RegisterPhotoRequest) => api.post<{ photo: PhotoDto }>("/photos", data),

  delete: (id: string) => api.del<{ ok: boolean }>(`/photos/${id}`),
};

// ======================== SYNC ========================
export const syncApi = {
  getStatus: () => api.get<SyncStatus>("/sync/status"),

  syncNow: () => api.post<{ ok: boolean; tabs: number; rows: number; startedAt: string; finishedAt: string }>("/sync/sheets"),
};

// ======================== SETTINGS ========================
export const settingsApi = {
  get: () => unwrap<SettingsDto>(api.get("/settings"), "settings"),

  update: (data: Partial<SettingsDto>) => unwrap<SettingsDto>(api.patch("/settings", data), "settings"),
};
