import { requestClient } from '#/api/request';

export namespace HrmEmployeeConfigApi {
  /** 字段配置 */
  export interface FieldConfig {
    name: string; // 字段名称
    title: string; // 字段标题
    groupName: string; // 字段分组名称
    visible: boolean; // 是否显示
    editable?: boolean; // 是否允许员工编辑
    visibleLocked: boolean; // 是否锁定显示
    editableLocked: boolean; // 是否锁定编辑
  }
}

/** 查询员工档案列表 */
export function getEmployeeCreateFieldConfigList(entryStatus: number) {
  return requestClient.get<HrmEmployeeConfigApi.FieldConfig[]>(
    '/hrm/employee/config/create-field/list',
    { params: { entryStatus } },
  );
}

/** 保存新建员工字段配置 */
export function saveEmployeeCreateFieldConfig(data: {
  entryStatus: number;
  fields: Array<{ name: string; visible: boolean }>;
}) {
  return requestClient.put<boolean>(
    '/hrm/employee/config/create-field/save',
    data,
  );
}

/** 查询员工档案字段配置 */
export function getEmployeeArchiveFieldConfigList() {
  return requestClient.get<HrmEmployeeConfigApi.FieldConfig[]>(
    '/hrm/employee/config/archive-field/list',
  );
}

/** 保存员工档案字段配置 */
export function saveEmployeeArchiveFieldConfig(data: {
  fields: Array<{ editable?: boolean; name: string; visible: boolean }>;
}) {
  return requestClient.put<boolean>(
    '/hrm/employee/config/archive-field/save',
    data,
  );
}
