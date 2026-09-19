import { requestClient } from '#/api/request';

export namespace OaMailFolderApi {
  /** OA 邮箱文件夹 */
  export interface MailFolder {
    key: string; // 目录查询标识
    name: string; // 显示名称
    unreadCount: number; // 未读数量
  }
}

/** 获得文件夹列表 */
export function getMailFolderList(accountId: number) {
  return requestClient.get<OaMailFolderApi.MailFolder[]>(
    '/oa/mail-folder/list',
    { params: { accountId } },
  );
}
