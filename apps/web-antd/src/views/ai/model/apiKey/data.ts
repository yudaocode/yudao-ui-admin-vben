import type { GatewayType } from './gateway-presets';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

import {
  CAPABILITY_OPTIONS,
  GATEWAY_PRESETS,
  getGatewayPreset,
  parseCapabilities,
} from './gateway-presets';

const BODY_STYLE_OPTIONS = [
  { label: 'Aixoras（aspect_ratio）', value: 'aixoras' },
  { label: 'OpenAI 标准', value: 'openai' },
  { label: 'HaoAI', value: 'hao' },
  { label: 'ToAPIs', value: 'toapis' },
];

const DETAIL_OPTIONS = [
  { label: 'low（省流量）', value: 'low' },
  { label: 'auto', value: 'auto' },
  { label: 'high', value: 'high' },
  { label: 'original', value: 'original' },
];

function hasCap(caps: unknown, key: string) {
  return parseCapabilities(caps as string | string[]).includes(key);
}

function presetOf(values: Record<string, any>) {
  return getGatewayPreset(values.gatewayType as GatewayType);
}

/** 按接入类型显隐：官方与各中转不是同一套字段 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'gatewayType',
      label: '接入类型',
      component: 'Select',
      help: '官方 API 与各中转形态不同；多中转请新增多条密钥',
      rules: 'required',
      defaultValue: 'openai_compatible',
      componentProps: {
        options: GATEWAY_PRESETS.map((p) => ({
          label: p.label,
          value: p.value,
        })),
        placeholder: '先选官方或中转类型',
      },
    },
    {
      fieldName: 'platform',
      label: '所属平台',
      component: 'Select',
      componentProps: {
        placeholder: '请选择所属平台',
        options: getDictOptions(DICT_TYPE.AI_PLATFORM, 'string'),
        allowClear: true,
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '名称',
      rules: 'required',
      componentProps: {
        placeholder: '如 OpenAI官方 / Aixoras主线 / Hao备用（不要填模型名）',
      },
    },
    {
      component: 'Input',
      fieldName: 'apiKey',
      label: '密钥',
      rules: 'required',
      componentProps: {
        placeholder: '该接入源的 API Key',
      },
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: 'API Base URL',
      help: '官方默认 api.openai.com；中转填各自网关，建议含 /v1',
      componentProps: {
        placeholder: 'https://api.openai.com/v1 或中转地址',
      },
    },
    {
      fieldName: 'capabilities',
      label: '启用能力',
      component: 'CheckboxGroup',
      help: '本密钥用于哪些能力；未勾选的模型字段会隐藏',
      defaultValue: ['chat', 'vision'],
      componentProps: {
        options: CAPABILITY_OPTIONS,
      },
    },
    {
      component: 'Input',
      fieldName: 'chatModel',
      label: '对话模型',
      componentProps: {
        allowClear: true,
        placeholder: '可选，如 gpt-5.4-mini',
      },
      dependencies: {
        triggerFields: ['capabilities'],
        show: (values) => hasCap(values.capabilities, 'chat'),
      },
    },
    {
      component: 'Input',
      fieldName: 'visionModel',
      label: '识图模型',
      help: '空则沿用对话模型',
      componentProps: {
        allowClear: true,
        placeholder: '可选，如 gpt-5.6-terra',
      },
      dependencies: {
        triggerFields: ['capabilities'],
        show: (values) => hasCap(values.capabilities, 'vision'),
      },
    },
    {
      component: 'Input',
      fieldName: 'imageModel',
      label: '生图模型',
      componentProps: {
        allowClear: true,
        placeholder: '可选，如 gpt-image-2.5-flare',
      },
      dependencies: {
        triggerFields: ['capabilities'],
        show: (values) => hasCap(values.capabilities, 'image_gen'),
      },
    },
    {
      component: 'Input',
      fieldName: 'imageEditModel',
      label: '改图模型',
      componentProps: {
        allowClear: true,
        placeholder: '可选；空则沿用生图模型',
      },
      dependencies: {
        triggerFields: ['capabilities'],
        show: (values) => hasCap(values.capabilities, 'image_edit'),
      },
    },
    {
      fieldName: 'imageBodyStyle',
      label: '生图请求风格',
      component: 'Select',
      help: '仅中转需要；官方隐藏',
      componentProps: {
        allowClear: true,
        options: BODY_STYLE_OPTIONS,
      },
      dependencies: {
        triggerFields: ['gatewayType', 'capabilities'],
        show: (values) =>
          presetOf(values).showRelayImageStyle &&
          (hasCap(values.capabilities, 'image_gen') ||
            hasCap(values.capabilities, 'image_edit')),
      },
    },
    {
      fieldName: 'visionImageDetail',
      label: '识图清晰度',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: DETAIL_OPTIONS,
      },
      dependencies: {
        triggerFields: ['gatewayType', 'capabilities'],
        show: (values) =>
          presetOf(values).showVisionDetail &&
          hasCap(values.capabilities, 'vision'),
      },
    },
    {
      fieldName: 'preferResponsesApi',
      label: '优先 Responses',
      component: 'RadioGroup',
      help: '部分中转（如 Aixoras）推荐；官方按需',
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
      dependencies: {
        triggerFields: ['gatewayType'],
        show: (values) => presetOf(values).showResponses,
      },
    },
    {
      fieldName: 'supportsAsync',
      label: '支持异步生图',
      component: 'RadioGroup',
      help: '仅部分中转有异步任务接口',
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 0 },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
      dependencies: {
        triggerFields: ['gatewayType', 'capabilities'],
        show: (values) =>
          presetOf(values).showAsync &&
          (hasCap(values.capabilities, 'image_gen') ||
            hasCap(values.capabilities, 'image_edit')),
      },
    },
    {
      component: 'Textarea',
      fieldName: 'extraConfig',
      label: '扩展 JSON',
      help: '各站私有参数，如 {"orgId":"...","quality":"high"}；不认识可留空',
      componentProps: {
        rows: 3,
        placeholder: '{"key":"value"}',
      },
      dependencies: {
        triggerFields: ['gatewayType'],
        show: (values) => presetOf(values).showExtraConfig,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        rows: 2,
        placeholder: '可选',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: { placeholder: '请输入名称', allowClear: true },
    },
    {
      fieldName: 'gatewayType',
      label: '接入类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: GATEWAY_PRESETS.map((p) => ({
          label: p.label,
          value: p.value,
        })),
      },
    },
    {
      fieldName: 'platform',
      label: '平台',
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '请选择平台',
        options: getDictOptions(DICT_TYPE.AI_PLATFORM, 'string'),
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '请选择状态',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
  ];
}

const GATEWAY_LABEL: Record<string, string> = Object.fromEntries(
  GATEWAY_PRESETS.map((p) => [p.value, p.label]),
);

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'gatewayType',
      title: '接入类型',
      minWidth: 120,
      formatter: ({ cellValue }) =>
        GATEWAY_LABEL[String(cellValue || '')] || cellValue || '-',
    },
    {
      field: 'name',
      title: '名称',
      minWidth: 120,
    },
    {
      field: 'platform',
      title: '平台',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.AI_PLATFORM },
      },
      minWidth: 90,
    },
    {
      field: 'url',
      title: 'Base URL',
      minWidth: 180,
    },
    {
      field: 'capabilities',
      title: '能力',
      minWidth: 120,
      formatter: ({ cellValue }) =>
        parseCapabilities(cellValue).join(',') || '-',
    },
    {
      field: 'visionModel',
      title: '识图/对话',
      minWidth: 120,
      formatter: ({ row }) => row.visionModel || row.chatModel || '-',
    },
    {
      field: 'imageModel',
      title: '生图',
      minWidth: 120,
      formatter: ({ row }) => row.imageModel || '-',
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
      minWidth: 80,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
