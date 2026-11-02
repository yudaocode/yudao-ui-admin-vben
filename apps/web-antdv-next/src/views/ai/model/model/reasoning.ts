import type { AiReasoningPreset } from '@vben/constants';

import type { AiModelModelApi } from '#/api/ai/model/model';

import { getReasoningLevelLabel } from '#/views/ai/utils/reasoning';

/**
 * AI 模型思考配置：管理端表单的转换和校验
 *
 * 档位、思考参数和默认档位由管理员在模型上配置，后端负责最终校验；前端不判断后端版本，也不判断平台或型号是否真的支持思考
 */

/** 获得档位的选项名：同时展示名称和档位值，例如「高（high）」 */
export function getReasoningLevelOptionLabel(level: string) {
  const label = getReasoningLevelLabel(level);
  return label === level ? level : `${label}（${level}）`;
}

// =========== 【管理端表单】相关 ===========

/** 表单中的一行档位：思考参数以 JSON 文本编辑 */
export interface AiReasoningFormRow {
  level: string; // 档位值
  options: string; // 思考参数 JSON 文本
}

/** 表单中的思考配置 */
export interface AiReasoningFormValue {
  enabled: boolean; // 是否配置思考
  rows: AiReasoningFormRow[]; // 档位行，从低到高
  defaultLevel?: string; // 默认档位
}

type AiReasoningModelFields = Pick<AiModelModelApi.Model, 'reasoningConfig'>;

/** 格式化思考参数为 JSON 文本 */
export function formatReasoningOptions(options: Record<string, unknown>) {
  return JSON.stringify(options, null, 2);
}

/** 解析思考参数 JSON 文本；不是 JSON 对象时返回 undefined */
export function parseReasoningOptions(
  text?: string,
): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(text ?? '');
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
  } catch {}
  return undefined;
}

/** 根据模型的思考配置，构建表单值；未配置档位时为关闭 */
export function buildReasoningFormValue(
  model?: AiReasoningModelFields,
): AiReasoningFormValue {
  const levels = model?.reasoningConfig?.levels ?? [];
  if (levels.length === 0) {
    return { enabled: false, rows: [], defaultLevel: undefined };
  }
  return {
    enabled: true,
    rows: levels.map((item) => ({
      level: item.level,
      options: formatReasoningOptions(item.options),
    })),
    defaultLevel: model?.reasoningConfig?.defaultLevel || undefined,
  };
}

/** 根据预设，构建表单值 */
export function buildReasoningPresetFormValue(
  preset: AiReasoningPreset,
): AiReasoningFormValue {
  return {
    enabled: true,
    rows: preset.levels.map(([level, options]) => ({
      level,
      options: formatReasoningOptions(options),
    })),
    defaultLevel: preset.defaultLevel,
  };
}

/** 获得表单中的档位值列表（去掉首尾空格） */
export function getReasoningFormLevels(value?: AiReasoningFormValue) {
  return (value?.rows ?? []).map((row) => row.level.trim());
}

/**
 * 校验表单中的思考配置：只做必填、档位值格式、判重、思考参数 JSON 和默认档位；null、平台和思考参数键由后端保存校验
 *
 * @return 错误提示；校验通过时返回 undefined
 */
export function validateReasoningFormValue(
  value?: AiReasoningFormValue,
): string | undefined {
  if (!value?.enabled) {
    return undefined;
  }
  const levels = getReasoningFormLevels(value);
  if (levels.length === 0) {
    return '请至少配置一个思考档位';
  }
  const seenLevels = new Set<string>();
  for (const [index, level] of levels.entries()) {
    if (!level) {
      return `第 ${index + 1} 个档位的档位值不能为空`;
    }
    if (!/^[a-z0-9_-]{1,32}$/.test(level)) {
      return `档位值「${level}」只能包含小写字母、数字、下划线和中划线，最长 32 位`;
    }
    if (seenLevels.has(level)) {
      return `档位值「${level}」重复`;
    }
    if (!parseReasoningOptions(value.rows[index]?.options)) {
      return `档位「${level}」的思考参数必须是 JSON 对象`;
    }
    seenLevels.add(level);
  }
  if (!value.defaultLevel) {
    return '请选择默认档位';
  }
  if (!levels.includes(value.defaultLevel)) {
    return `默认档位「${value.defaultLevel}」不在档位列表中`;
  }
  return undefined;
}

/**
 * 构建提交给后端的思考配置
 *
 * 关闭时提交空档位，后端据此清空；开启时整体替换
 */
export function buildReasoningSaveData(
  value?: AiReasoningFormValue,
): Required<AiReasoningModelFields> {
  if (!value?.enabled) {
    return { reasoningConfig: { levels: [] } };
  }
  const levels = getReasoningFormLevels(value).map((level, index) => ({
    level,
    options: parseReasoningOptions(value.rows[index]?.options) ?? {},
  }));
  return {
    reasoningConfig: { levels, defaultLevel: value.defaultLevel ?? '' },
  };
}