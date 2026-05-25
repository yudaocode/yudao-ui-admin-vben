import type { Rule } from 'ant-design-vue/es/form';

import type { PageParam, PageResult } from '@vben/request';

import { isEmpty } from '@vben/utils';

import { requestClient } from '#/api/request';

export namespace ThingModelApi {
  /** IoT 物模型数据 */
  export interface ThingModel {
    id?: number;
    productId?: number;
    productKey?: string;
    identifier?: string;
    name?: string;
    description?: string;
    dataType?: string;
    type?: number; // 参见 IoTThingModelTypeEnum 枚举类
    property?: Property;
    event?: Event;
    service?: Service;
  }

  /** IoT 物模型属性 */
  export interface Property {
    identifier?: string;
    name?: string;
    accessMode?: string;
    required?: boolean;
    dataType?: string;
    description?: string;
    dataSpecs?: any;
    dataSpecsList?: any[];
  }

  /** IoT 物模型服务 */
  export interface Service {
    identifier?: string;
    name?: string;
    required?: boolean;
    callType?: string;
    description?: string;
    inputParams?: Param[];
    outputParams?: Param[];
    method?: string;
  }

  /** IoT 物模型事件 */
  export interface Event {
    identifier?: string;
    name?: string;
    required?: boolean;
    type?: string;
    description?: string;
    outputParams?: Param[];
    method?: string;
  }

  /** IoT 物模型参数 */
  export interface Param {
    identifier?: string;
    name?: string;
    direction?: string;
    paraOrder?: number;
    dataType?: string;
    dataSpecs?: any;
    dataSpecsList?: any[];
  }

  /** IoT 物模型 TSL（树形）响应 */
  export interface ThingModelTSL {
    productId?: number;
    productKey?: string;
    properties?: Property[];
    events?: Event[];
    services?: Service[];
  }

  /** IoT 数据定义（数值型） */
  export interface DataSpecsNumberData {
    min?: number | string;
    max?: number | string;
    step?: number | string;
    unit?: string;
    unitName?: string;
  }

  /** IoT 数据定义（枚举/布尔型） */
  export interface DataSpecsEnumOrBoolData {
    value: number | string;
    name: string;
  }
}

/** 生成「必填 + 数字」类校验器：拼到 size / length / 枚举值上 */
function buildRequiredNumberValidator(label: string) {
  return (_rule: any, value: any, callback: any) => {
    if (isEmpty(value)) {
      callback(new Error(`${label}不能为空`));
      return;
    }
    if (Number.isNaN(Number(value))) {
      callback(new Error(`${label}必须是数字`));
      return;
    }
    callback();
  };
}

/** 生成「标识符样式」名称校验器：开头需为中文 / 英文 / 数字，整体仅允许中文、英文、数字、下划线、短划线，长度 ≤ 20 */
export function buildIdentifierLikeNameValidator(label: string) {
  return (_rule: any, value: string, callback: any) => {
    if (isEmpty(value)) {
      callback(new Error(`${label}不能为空`));
      return;
    }
    if (!/^[一-龥A-Za-z0-9]/.test(value)) {
      callback(new Error(`${label}必须以中文、英文字母或数字开头`));
      return;
    }
    if (!/^[一-龥A-Za-z0-9][\w一-龥-]*$/.test(value)) {
      callback(
        new Error(`${label}只能包含中文、英文字母、数字、下划线和短划线`),
      );
      return;
    }
    if (value.length > 20) {
      callback(new Error(`${label}长度不能超过 20 个字符`));
      return;
    }
    callback();
  };
}

/** IoT 物模型表单校验规则 */
export const ThingModelFormRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '功能名称不能为空', trigger: 'blur' },
    {
      pattern: /^[一-龥A-Za-z0-9][一-龥A-Za-z0-9\-_/.]{0,29}$/,
      message:
        '支持中文、大小写字母、日文、数字、短划线、下划线、斜杠和小数点，必须以中文、英文或数字开头，不超过 30 个字符',
      trigger: 'blur',
    },
  ],
  type: [{ required: true, message: '功能类型不能为空', trigger: 'blur' }],
  identifier: [
    { required: true, message: '标识符不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/,
      message: '支持大小写字母、数字和下划线，必须以字母开头，不超过 32 个字符',
      trigger: 'blur',
    },
    {
      validator: (_rule: any, value: string, callback: any) => {
        const reservedKeywords = [
          'set',
          'get',
          'post',
          'property',
          'event',
          'time',
          'value',
        ];
        if (reservedKeywords.includes(value)) {
          callback(
            new Error(
              'set, get, post, property, event, time, value 是系统保留字段，不能用于标识符定义',
            ),
          );
          return;
        }
        if (/^\d+$/.test(value)) {
          callback(new Error('标识符不能是纯数字'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  childDataType: [{ required: true, message: '元素类型不能为空' }],
  size: [
    {
      required: true,
      validator: buildRequiredNumberValidator('元素个数'),
      trigger: 'blur',
    },
  ],
  length: [
    {
      required: true,
      validator: buildRequiredNumberValidator('文本长度'),
      trigger: 'blur',
    },
  ],
  accessMode: [
    { required: true, message: '请选择读写类型', trigger: 'change' },
  ],
  callType: [{ required: true, message: '请选择调用方式', trigger: 'change' }],
  eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
};

/** 校验布尔值名称 */
export const validateBoolName = buildIdentifierLikeNameValidator('布尔值名称');

/** 查询产品物模型分页 */
export function getThingModelPage(params: PageParam) {
  return requestClient.get<PageResult<ThingModelApi.ThingModel>>(
    '/iot/thing-model/page',
    { params },
  );
}

/** 查询产品物模型详情 */
export function getThingModel(id: number) {
  return requestClient.get<ThingModelApi.ThingModel>(
    `/iot/thing-model/get?id=${id}`,
  );
}

/** 根据产品 ID 查询物模型列表 */
export function getThingModelListByProductId(productId: number) {
  return requestClient.get<ThingModelApi.ThingModel[]>(
    '/iot/thing-model/list',
    {
      params: { productId },
    },
  );
}

/** 新增物模型 */
export function createThingModel(data: ThingModelApi.ThingModel) {
  return requestClient.post('/iot/thing-model/create', data);
}

/** 修改物模型 */
export function updateThingModel(data: ThingModelApi.ThingModel) {
  return requestClient.put('/iot/thing-model/update', data);
}

/** 删除物模型 */
export function deleteThingModel(id: number) {
  return requestClient.delete(`/iot/thing-model/delete?id=${id}`);
}

/** 获取物模型 TSL */
export function getThingModelTSLByProductId(productId: number) {
  return requestClient.get<ThingModelApi.ThingModelTSL>(
    '/iot/thing-model/get-tsl',
    {
      params: { productId },
    },
  );
}
