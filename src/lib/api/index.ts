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

  getById: (id: string) => api.get<GarmentDetailDto>(`/garments/${id}`),

  create: (data: CreateGarmentRequest) => api.post<GarmentDto>("/garments", data),

  update: (id: string, data: UpdateGarmentRequest) => api.patch<GarmentDto>(`/garments/${id}`, data),

  updateLocation: (id: string, data: UpdateLocationRequest) =>
    api.patch<{ garmentId: string; rack: string; shelf?: string }>(`/garments/${id}/location`, data),

  updateStatus: (id: string, data: UpdateStatusRequest) =>
    api.patch<{ garmentId: string; status: string }>(`/garments/${id}/status`, data),

  getAvailability: (from: string, to: string, category?: string) =>
    api.get<{ items: AvailabilityRow[] }>(`/garments/availability${toQueryString({ from, to, category })}`),
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

  getById: (id: string) => api.get<CustomerDto>(`/customers/${id}`),

  createOrUpdate: (data: CustomerInput) => api.post<CustomerDto>("/customers", data),

  update: (id: string, data: Partial<CustomerInput>) => api.patch<CustomerDto>(`/customers/${id}`, data),
};

// ======================== BOOKINGS ========================
export const bookingsApi = {
  quote: (data: QuoteRequest) => api.post<QuoteResponse>("/bookings/quote", data),

  create: (data: CreateBookingRequest) => api.post<BookingDto>("/bookings", data),

  list: async (query: BookingListQuery = {}) => {
    const res = await api.get<{ bookings?: BookingDto[]; items?: BookingDto[]; nextCursor?: string }>(
      `/bookings${toQueryString(query)}`
    );
    return {
      items: res.items ?? res.bookings ?? [],
      nextCursor: res.nextCursor,
    };
  },

  getById: (id: string) => api.get<BookingDto>(`/bookings/${id}`),

  update: (id: string, data: UpdateBookingRequest) => api.patch<BookingDto>(`/bookings/${id}`, data),

  pickup: (id: string, data: PickupRequest) => api.post<BookingDto>(`/bookings/${id}/pickup`, data),

  return: (id: string, data: ReturnRequest) => api.post<ReturnResponse>(`/bookings/${id}/return`, data),

  addPayment: (id: string, data: AddPaymentRequest) => api.post<BookingDto>(`/bookings/${id}/payments`, data),

  cancel: (id: string, data: CancelRequest) => api.post<BookingDto>(`/bookings/${id}/cancel`, data),
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

  create: (data: CreateCareRequest) => api.post<CareJobDto>("/care", data),

  receive: (id: string, data: ReceiveCareRequest) => api.post<CareJobDto>(`/care/${id}/receive`, data),
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

  create: (data: Omit<ExpenseDto, "id">) => api.post<ExpenseDto>("/expenses", data),

  update: (id: string, data: Partial<Omit<ExpenseDto, "id">>) => api.patch<ExpenseDto>(`/expenses/${id}`, data),

  delete: (id: string) => api.del<{ ok: boolean }>(`/expenses/${id}`),
};

// ======================== CASH CLOSING ========================
export const cashApi = {
  getToday: (date?: string) => api.get<CashTodayDto>(`/cash/today${toQueryString({ date })}`),

  close: (data: CloseCashRequest) => api.post<CashClosingDto>("/cash/closing", data),

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
  get: () => api.get<SettingsDto>("/settings"),

  update: (data: Partial<SettingsDto>) => api.patch<SettingsDto>("/settings", data),
};
