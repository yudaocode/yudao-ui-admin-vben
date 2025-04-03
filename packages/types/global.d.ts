import type { RouteMeta as IRouteMeta } from '@vben-core/typings';

import 'vue-router';

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends IRouteMeta {}
}

export interface VbenAdminProAppConfigRaw {
  VITE_GLOB_API_URL: string;
  VITE_APP_TENANT_ENABLE: boolean;
  VITE_APP_CAPTCHA_ENABLE: boolean;
  VITE_APP_WEBSITE: string;
}

export interface ApplicationConfig {
  apiURL: string;
  captchaEnable: boolean;
  tenantEnable: boolean;
  website: string;
}

declare global {
  interface Window {
    _VBEN_ADMIN_PRO_APP_CONF_: VbenAdminProAppConfigRaw;
  }
}
