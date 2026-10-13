import { requestClient } from '#/api/request';

export namespace XqRpaConfigApi {
  /** commander=影刀控制中枢；script=自写脚本；exe=本地可执行文件 */
  export type RunnerMode = 'commander' | 'exe' | 'script';

  export interface Config {
    globalConfigured?: boolean;
    globalBaseUrl?: string;
    globalAppKeyMasked?: string;
    imageJobUuid?: string;
    copyJobUuid?: string;
    erpSiteUrl?: string;
    account?: string;
    hasPassword?: boolean;
    runnerMode?: RunnerMode;
    runnerPath?: string;
    runnerArgs?: string;
    runnerWorkdir?: string;
  }

  export interface SaveReq {
    imageJobUuid?: string;
    copyJobUuid?: string;
    erpSiteUrl?: string;
    account?: string;
    password?: string;
    runnerMode?: RunnerMode;
    runnerPath?: string;
    runnerArgs?: string;
    runnerWorkdir?: string;
  }

  export interface TriggerReq {
    jobKind: 'copy' | 'image';
  }

  export interface TriggerResp {
    jobKind?: string;
    jobUuid?: string;
    workUuid?: string;
    inputParamSent?: boolean;
    runnerMode?: RunnerMode | string;
    runnerPath?: string;
    runnerCommandPreview?: string;
    message?: string;
  }
}

export function getXqRpaConfig() {
  return requestClient.get<XqRpaConfigApi.Config>('/xq/rpa-config/get');
}

export function saveXqRpaConfig(data: XqRpaConfigApi.SaveReq) {
  return requestClient.post<boolean>('/xq/rpa-config/save', data);
}

export function triggerXqRpa(data: XqRpaConfigApi.TriggerReq) {
  return requestClient.post<XqRpaConfigApi.TriggerResp>(
    '/xq/rpa-config/trigger',
    data,
  );
}
