
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'FRED_API_KEY': '964a5f86a627ed7041815d81e16d24bc'
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url.replace('/api', '')}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || `${res.status}: ${res.statusText}`);
    } catch {
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
  
  return res;
}

export async function fetchMarketOverview() {
  try {
    const response = await apiRequest('GET', '/api/market/overview');
    return response.json();
  } catch (error) {
    console.error('Failed to fetch market overview:', error);
    throw error;
  }
}

export async function fetchIndicator(symbol: string, startDate?: string, endDate?: string, frequency?: string) {
  try {
    let url = `/api/market/indicators/${encodeURIComponent(symbol)}`;
    
    // Add query parameters if provided
    if (startDate) url += `?start_date=${encodeURIComponent(startDate)}`;
    if (endDate) url += `${startDate ? '&' : '?'}end_date=${encodeURIComponent(endDate)}`;
    if (frequency) url += `${(startDate || endDate) ? '&' : '?'}frequency=${encodeURIComponent(frequency)}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch indicator ${symbol}:`, error);
    throw error;
  }
}

export async function runEtlPipeline(seriesId: string, startDate?: string, endDate?: string) {
  try {
    const payload = {
      series_id: seriesId,
      start_date: startDate,
      end_date: endDate
    };
    
    const response = await apiRequest('POST', '/api/etl/run', payload);
    return response.json();
  } catch (error) {
    console.error('Failed to run ETL pipeline:', error);
    throw error;
  }
}

export async function fetchEtlJobs(limit?: number) {
  try {
    let url = '/api/etl/jobs';
    if (limit) url += `?limit=${limit}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch ETL jobs:', error);
    throw error;
  }
}

export async function fetchSystemStatus() {
  try {
    const response = await apiRequest('GET', '/api/status/');
    return response.json();
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    throw error;
  }
}

export async function runAnalysis(type: string, params: Record<string, any>) {
  try {
    let url = `/api/analysis/${type}`;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
    
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    
    const response = await apiRequest('GET', url);
    return response.json();
  } catch (error) {
    console.error(`Failed to run ${type} analysis:`, error);
    throw error;
  }
}

export async function searchIndicators(query: string, limit: number = 10) {
  try {
    const url = `/api/market/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await apiRequest('GET', url);
    return response.json();
  } catch (error) {
    console.error('Failed to search indicators:', error);
    throw error;
  }
}
