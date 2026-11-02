import type { AiModelModelApi } from '#/api/ai/model/model';

import { AI_REASONING_LEVEL_LABELS } from '@vben/constants';

/**
 * AI 思考：档位展示名、聊天页思考档位的计算方法
 *
 * 前端不判断后端版本，也不判断平台或型号是否真的支持思考；档位展示名、预设见 @vben/constants
 */

/** 获得思考档位的展示名 */
export function getReasoningLevelLabel(level?: string) {
  if (!level) {
    return '';
  }
  // 只认自有属性，避免 constructor、__proto__ 等档位值读到 Object 原型上的属性
  return Object.hasOwn(AI_REASONING_LEVEL_LABELS, level)
    ? AI_REASONING_LEVEL_LABELS[level]!
    : level;
}

// =========== 【聊天页】相关 ===========

/** 获得模型配置的思考档位：按配置顺序，含 off；未配置时为空数组 */
export function getReasoningLevels(
  config?: AiModelModelApi.ModelReasoningConfig,
) {
  return (config?.levels ?? []).map((item) => item.level);
}

/** 计算思考档位：选中的档位在模型配置中时使用，否则用默认档位；未配置档位时返回 undefined，请求不带 reasoningLevel */
export function resolveReasoningLevel(
  config?: AiModelModelApi.ModelReasoningConfig,
  selected?: string,
) {
  const levels = getReasoningLevels(config);
  if (levels.length === 0) {
    return undefined;
  }
  if (selected && levels.includes(selected)) {
    return selected;
  }
  const defaultLevel = config?.defaultLevel;
  return defaultLevel && levels.includes(defaultLevel)
    ? defaultLevel
    : levels[0];
}
