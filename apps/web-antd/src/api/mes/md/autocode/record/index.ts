import { requestClient } from '#/api/request';

/** 生成 MES 编码 */
export function generateAutoCode(ruleCode: string, inputChar?: string) {
  return requestClient.post<string>('/mes/md/auto-code-record/generate', {
    inputChar,
    ruleCode,
  });
}
