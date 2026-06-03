import { ServiceUnavailableException } from '@nestjs/common';

export async function fetchJsonWithTimeout(
  url: string,
  source: string,
  timeoutMs: number,
  init?: RequestInit,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ServiceUnavailableException({
        error: {
          code: 'TRACKING_SOURCE_HTTP_ERROR',
          message: 'Nguồn tra cứu đang lỗi',
          source,
          statusCode: response.status,
        },
      });
    }

    const text = await response.text();

    if (!text.trim()) {
      return undefined;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    if (error instanceof ServiceUnavailableException) {
      throw error;
    }

    throw new ServiceUnavailableException({
      error: {
        code: 'TRACKING_SOURCE_TIMEOUT_OR_UNAVAILABLE',
        message: 'Không thể kết nối nguồn tra cứu',
        source,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
