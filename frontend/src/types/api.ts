export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors: ApiErrorField[];
  traceId?: string;
}
