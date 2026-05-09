import api from '../lib/axios';
import { AxiosError } from 'axios';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RequestVerificationResponse {
  detail: string;
}

export interface ConfirmVerificationResponse {
  token: string;
}

// RegisterOwner agora retorna JWT de registro (sem tenant)
export interface RegisterOwnerResponse {
  detail: string;
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    code: string;
  };
}

export interface RegisterOwnerPayload {
  full_name: string;
  email: string;
  password?: string;
  token?: string;
  google_id?: string;
  title?: string;
}

// Fix #6: LoginResponse agora inclui tenant e user
export interface LoginResponse {
  access: string;
  refresh: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    code: string;
  };
}

// RegisterTenant agora retorna JWT completo (com tenant)
export interface RegisterTenantResponse {
  detail: string;
  workspace: string;
  access: string;
  refresh: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface RegisterTenantPayload {
  company_name: string;
  company_sector: string;
  company_size: string;
  company_country: string;
  company_cnpj?: string;
}

function handleAxiosError(error: unknown): { success: false; error: string } {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || 'Ocorreu um erro. Tente novamente.',
    };
  }
  return {
    success: false,
    error: 'Erro de conexão. Verifique sua internet e tente novamente.',
  };
}

// --- Step 1: Email verification ---

export async function requestVerification(email: string): Promise<ApiResponse<RequestVerificationResponse>> {
  try {
    const response = await api.post<RequestVerificationResponse>('/auth/request-verification/', { email });
    return { success: true, data: response.data };
  } catch (error) {
    return handleAxiosError(error);
  }
}

export async function confirmVerification(
  email: string,
  code: string
): Promise<ApiResponse<ConfirmVerificationResponse>> {
  try {
    const response = await api.post<ConfirmVerificationResponse>('/auth/confirm-verification/', { email, code });
    return { success: true, data: response.data };
  } catch (error) {
    return handleAxiosError(error);
  }
}

// --- Step 2: Register owner (user) → retorna JWT de registro ---

export async function registerOwner(
  payload: RegisterOwnerPayload
): Promise<ApiResponse<RegisterOwnerResponse>> {
  try {
    const response = await api.post<RegisterOwnerResponse>('/auth/register/owner/', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return handleAxiosError(error);
  }
}

// --- Step 3: Register tenant (company) — requires JWT de registro ---

export async function registerTenant(
  payload: RegisterTenantPayload,
  accessToken: string
): Promise<ApiResponse<RegisterTenantResponse>> {
  try {
    const response = await api.post<RegisterTenantResponse>('/auth/register/tenant/', payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return handleAxiosError(error);
  }
}

// --- Login (pós-registro, para login normal) ---

export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await api.post<LoginResponse>('/auth/login/', { email, password });
    return { success: true, data: response.data };
  } catch (error) {
    return handleAxiosError(error);
  }
}

// --- Google OAuth ---

export function getGoogleAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return `${baseUrl}/auth/google/`;
}
