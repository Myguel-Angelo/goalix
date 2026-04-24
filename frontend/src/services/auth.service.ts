import api from '../lib/axios';
import { AxiosError } from 'axios';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RequestVerificationResponse {
  message: string;
}

export interface ConfirmVerificationResponse {
  message: string;
  token?: string;
}

export interface RegisterTenantUserResponse {
  message: string;
  userId: string;
  tenantId: string;
}

export interface RegisterTenantUserPayload {
  fullName: string;
  email: string;
  password: string;
  token: string;
  industry: string;
  companySize: string;
  role: string;
  objective: string;
  company_name: string;
}

function handleAxiosError(error: unknown): { success: false; error: string } {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data;
    return {
      success: false,
      error: errorData?.message || errorData?.detail || 'Ocorreu um erro. Tente novamente.',
    };
  }
  return {
    success: false,
    error: 'Erro de conexão. Verifique sua internet e tente novamente.',
  };
}

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

export async function registerTenantUser(
  payload: RegisterTenantUserPayload
): Promise<ApiResponse<RegisterTenantUserResponse>> {
  try {
    const response = await api.post<RegisterTenantUserResponse>('/auth/register-tenant-user/', {
      full_name: payload.fullName,
      email: payload.email,
      password: payload.password,
      token: payload.token,
      company_sector: payload.industry,
      company_size: payload.companySize,
      title: payload.role,
      objective: payload.objective,
      company_name: payload.company_name,
      company_country: "BR",
    });
    return { success: true, data: response.data };
  } catch (error) {
    return handleAxiosError(error);
  }
}