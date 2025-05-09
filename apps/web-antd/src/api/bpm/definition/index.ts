import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/** 流程定义 */
export namespace BpmDefinitionApi {
  export interface ProcessDefinitionVO {
    id: string;
    version: number;
    deploymentTime: number;
    suspensionState: number;
    formType?: number;
  }
}

/** 查询流程定义 */
export async function getProcessDefinition(id?: string, key?: string) {
  return requestClient.get<BpmDefinitionApi.ProcessDefinitionVO>(
    '/bpm/process-definition/get',
    {
      params: { id, key },
    },
  );
}

/** 分页查询流程定义 */
export async function getProcessDefinitionPage(params: PageParam) {
  return requestClient.get<PageResult<BpmDefinitionApi.ProcessDefinitionVO>>(
    '/bpm/process-definition/page',
    { params },
  );
}

/** 查询流程定义列表 */
export async function getProcessDefinitionList(params: any) {
  return requestClient.get<PageResult<BpmDefinitionApi.ProcessDefinitionVO>>(
    '/bpm/process-definition/list',
    {
      params,
    },
  );
}

/** 查询流程定义列表（简单列表） */
export async function getSimpleProcessDefinitionList() {
  return requestClient.get<PageResult<BpmDefinitionApi.ProcessDefinitionVO>>(
    '/bpm/process-definition/simple-list',
  );
}
