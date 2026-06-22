import { Injectable, isDevMode } from '@angular/core';

/**
 * Centralised logger for the Adyen Spartacus library.
 *
 * Delegates to the browser `console` only when the application runs in
 * development mode (i.e. `enableProdMode()` has not been called by the host
 * storefront). In production builds every method is a no-op, which avoids
 * leaking payment, error and flow data into customer browsers and keeps
 * production logs quiet.
 *
 * Use this service instead of calling `console.*` directly from components
 * and services.
 */
@Injectable({ providedIn: 'root' })
export class AdyenLoggerService {
  log(...args: Parameters<typeof console.log>): void {
    if (isDevMode()) {
      /* eslint-disable-next-line no-console */
      console.log(...args);
    }
  }

  warn(...args: Parameters<typeof console.warn>): void {
    if (isDevMode()) {
      /* eslint-disable-next-line no-console */
      console.warn(...args);
    }
  }

  error(...args: Parameters<typeof console.error>): void {
    if (isDevMode()) {
      /* eslint-disable-next-line no-console */
      console.error(...args);
    }
  }

  info(...args: Parameters<typeof console.info>): void {
    if (isDevMode()) {
      /* eslint-disable-next-line no-console */
      console.info(...args);
    }
  }

  debug(...args: Parameters<typeof console.debug>): void {
    if (isDevMode()) {
      /* eslint-disable-next-line no-console */
      console.debug(...args);
    }
  }
}
