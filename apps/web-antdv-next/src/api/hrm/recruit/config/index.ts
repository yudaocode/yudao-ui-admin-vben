import { requestClient } from '#/api/request';

/** 保存招聘淘汰原因 */
export function saveRecruitEliminateReason(reasons: string[]) {
  return requestClient.post<boolean>(
    '/hrm/recruit/config/eliminate-reason/save',
    { reasons },
  );
}

/** 查询招聘淘汰原因列表 */
export function getRecruitEliminateReasonList() {
  return requestClient.get<string[]>(
    '/hrm/recruit/config/eliminate-reason/list',
  );
}
