import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from './logger';

export interface FetchOptions {
  retries?: number;
  baseDelay?: number;
  module?: string;
}

export async function fetchWithRetry(axiosConfig: AxiosRequestConfig, options: FetchOptions = {}): Promise<AxiosResponse> {
  const { retries = 4, baseDelay = 1000, module = 'unknown' } = options;
  const instance = axios.create({ timeout: 30000 });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await instance(axiosConfig);
      return response;
    } catch (err: any) {
      const isLast = attempt === retries;
      const status = err.response?.status;
      const delay = baseDelay * Math.pow(2, attempt - 1);

      if (status && status >= 400 && status < 500 && status !== 429) {
        logger.error(`[${module}] HTTP ${status} — not retrying. ${axiosConfig.url}`);
        throw err;
      }

      if (isLast) {
        logger.error(`[${module}] All ${retries} attempts failed: ${err.message}`);
        throw err;
      }

      logger.warn(`[${module}] Attempt ${attempt} failed (${err.message}). Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable code');
}
