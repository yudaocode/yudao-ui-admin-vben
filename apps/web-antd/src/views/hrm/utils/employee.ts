import type { Router } from 'vue-router';

import { getEmployeeBindStatus } from '#/api/hrm/portal/employee';

export const HRM_PORTAL_HOME_PATH = '/hrm/portal/home';
export const HRM_PORTAL_OPENING_GUIDE_PATH = '/hrm/portal/opening-guide';

/** 校验当前账号是否已绑定员工档案 */
export async function checkHrmPortalAccess(router: Router) {
  try {
    if (await getEmployeeBindStatus()) {
      return true;
    }
    await router.replace(HRM_PORTAL_OPENING_GUIDE_PATH);
    return false;
  } catch {
    return true;
  }
}

/** 已绑定员工档案时，从开通引导页返回员工端工作台 */
export async function redirectBoundEmployeeFromOpeningGuide(router: Router) {
  try {
    if (!(await getEmployeeBindStatus())) {
      return false;
    }
    await router.replace(HRM_PORTAL_HOME_PATH);
    return true;
  } catch {
    return false;
  }
}
