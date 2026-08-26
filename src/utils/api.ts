/**
 * Safe API request helper to prevent JSON parse errors when the server returns HTML or unexpected formats.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    let parsedData: any = null;
    if (contentType.includes('application/json')) {
      try {
        parsedData = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse JSON response:', jsonErr);
        parsedData = { error: 'Invalid JSON response from server' };
      }
    } else {
      const text = await res.text();
      // If it looks like HTML, do not throw, instead format a user-friendly error
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<!doctype')) {
        parsedData = { error: `Server returned unexpected HTML page (HTTP ${res.status}).` };
      } else {
        parsedData = { error: text || `HTTP ${res.status}` };
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: parsedData?.error || `Request failed with status ${res.status}`,
        data: parsedData,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData,
    };
  } catch (err: any) {
    console.error(`Fetch to ${url} failed:`, err);
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network error occurred. Please check connection.',
    };
  }
}
