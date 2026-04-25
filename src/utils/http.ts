export function _sendSuccessResponse<T>(message: string, data: T): { success: true; message: string; data: T } {
  return {
    success: true,
    message,
    data,
  };
}

export function _sendErrorResponse(
  message: string,
  code: string
): { success: false; error: { code: string; message: string } } {
  return {
    success: false,
    error: { code, message },
  };
}
