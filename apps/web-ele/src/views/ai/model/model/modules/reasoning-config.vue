<script lang="ts" setup>
import type { AiReasoningFormRow, AiReasoningFormValue } from '../reasoning';

import { computed } from 'vue';

import { AI_REASONING_PRESETS } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElInput, ElOption, ElSelect, ElSwitch } from 'element-plus';

import {
  buildReasoningFormValue,
  buildReasoningPresetFormValue,
  getReasoningFormLevels,
  getReasoningLevelOptionLabel,
} from '../reasoning';

/** AI 模型的思考配置：档位、每档思考参数、默认档位 */
defineOptions({ name: 'AiModelReasoningConfig' });

const props = defineProps<{
  disabled?: boolean;
  modelValue?: AiReasoningFormValue;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AiReasoningFormValue];
}>();

const value = computed(() => props.modelValue ?? buildReasoningFormValue());
const editDisabled = computed(() => !!props.disabled);
const optionsPlaceholder = '思考参数 JSON，如 {"reasoning_effort":"high"}';

const presetOptions = AI_REASONING_PRESETS.map((preset) => ({
  label: preset.name,
  value: preset.key,
}));
const defaultLevelOptions = computed(() =>
  getReasoningFormLevels(value.value)
    .filter((level, index, levels) => level && levels.indexOf(level) === index)
    .map((level) => ({
      label: getReasoningLevelOptionLabel(level),
      value: level,
    })),
);

function update(patch: Partial<AiReasoningFormValue>) {
  emit('update:modelValue', { ...value.value, ...patch });
}

function updateRows(rows: AiReasoningFormRow[]) {
  const levels = rows.map((row) => row.level.trim());
  const defaultLevel =
    value.value.defaultLevel && levels.includes(value.value.defaultLevel)
      ? value.value.defaultLevel
      : undefined;
  update({ rows, defaultLevel });
}

/** 切换思考配置开关：打开时如果没有档位，先加一行 */
function handleEnabledChange(enabled: any) {
  if (enabled && value.value.rows.length === 0) {
    update({ enabled: true, rows: [{ level: '', options: '{}' }] });
    return;
  }
  update({ enabled: !!enabled });
}

/** 从预设填入：整体替换档位、思考参数和默认档位 */
function handlePresetSelect(key: any) {
  const preset = AI_REASONING_PRESETS.find((item) => item.key === key);
  if (preset) {
    emit('update:modelValue', buildReasoningPresetFormValue(preset));
  }
}

function handleRowChange(index: number, row: Partial<AiReasoningFormRow>) {
  const rows = value.value.rows.map((item, i) =>
    i === index ? { ...item, ...row } : item,
  );
  updateRows(rows);
}

function handleRowAdd() {
  updateRows([...value.value.rows, { level: '', options: '{}' }]);
}

function handleRowDelete(index: number) {
  updateRows(value.value.rows.filter((_, i) => i !== index));
}

function handleRowMove(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= value.value.rows.length) {
    return;
  }
  const rows = [...value.value.rows];
  [rows[index], rows[target]] = [rows[target]!, rows[index]!];
  updateRows(rows);
}
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <div class="flex items-center gap-2">
      <ElSwitch
        :model-value="value.enabled"
        :disabled="editDisabled"
        @update:model-value="handleEnabledChange"
      />
      <span v-if="!value.enabled" class="text-sm text-gray-400">
        未配置：保持平台原有行为
      </span>
    </div>
    <template v-if="value.enabled">
      <div class="flex items-center gap-2">
        <ElSelect
          class="!w-80"
          placeholder="从预设填入"
          :model-value="undefined"
          :disabled="editDisabled"
          @change="handlePresetSelect"
        >
          <ElOption
            v-for="item in presetOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </div>
      <div class="text-xs text-gray-400">
        预设只是示例，保存前请按厂商文档核对。思考档位越高，越可能被回复 Token
        数截断。
      </div>
      <div
        v-for="(row, index) in value.rows"
        :key="index"
        class="flex items-start gap-2"
      >
        <ElInput
          class="!w-32"
          placeholder="档位值，如 high"
          :model-value="row.level"
          :disabled="editDisabled"
          @update:model-value="(level) => handleRowChange(index, { level })"
        />
        <ElInput
          class="flex-1 font-mono"
          type="textarea"
          :placeholder="optionsPlaceholder"
          :autosize="{ minRows: 1, maxRows: 6 }"
          :model-value="row.options"
          :disabled="editDisabled"
          @update:model-value="(options) => handleRowChange(index, { options })"
        />
        <ElButton
          size="small"
          class="!ml-0"
          :disabled="editDisabled || index === 0"
          @click="handleRowMove(index, -1)"
        >
          <IconifyIcon icon="lucide:arrow-up" />
        </ElButton>
        <ElButton
          size="small"
          class="!ml-0"
          :disabled="editDisabled || index === value.rows.length - 1"
          @click="handleRowMove(index, 1)"
        >
          <IconifyIcon icon="lucide:arrow-down" />
        </ElButton>
        <ElButton
          size="small"
          type="danger"
          plain
          class="!ml-0"
          :disabled="editDisabled"
          @click="handleRowDelete(index)"
        >
          <IconifyIcon icon="lucide:trash-2" />
        </ElButton>
      </div>
      <div>
        <ElButton
          size="small"
          :disabled="editDisabled"
          @click="handleRowAdd"
        >
          <IconifyIcon icon="lucide:plus" />
          添加档位
        </ElButton>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm">默认档位</span>
        <ElSelect
          class="!w-48"
          placeholder="请选择默认档位"
          :model-value="value.defaultLevel"
          :disabled="editDisabled"
          @change="(defaultLevel: any) => update({ defaultLevel })"
        >
          <ElOption
            v-for="item in defaultLevelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </div>
    </template>
  </div>
</template>
