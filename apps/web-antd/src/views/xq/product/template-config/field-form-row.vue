<script lang="ts" setup>
import type { EnumOpt } from '../enum-options';

import { computed } from 'vue';

import { Input, Select, Tag } from 'ant-design-vue';

import { normalizeEnumOptions } from '../enum-options';
import { translateFieldLabel } from './field-label-zh';
import { VALUE_SOURCE_SELECT_OPTIONS } from './value-sources';

export type FieldFillMode = 'fixed' | 'optional' | 'required';

const props = defineProps<{
  compact?: boolean;
  element: {
    code: string;
    defaultValue: string;
    fixed?: boolean;
    groupLabel?: string;
    label: string;
    options?: EnumOpt[];
    remark?: string;
    required?: boolean;
    type?: string;
    valuesList?: string;
    valueSource: string | undefined;
  };
  showZh: boolean;
}>();

const emit = defineEmits<{
  fillModeChange: [mode: FieldFillMode];
  'update:defaultValue': [value: string];
  'update:remark': [value: string];
  'update:valueSource': [value: string | undefined];
}>();

const FILL_OPTIONS = [
  { value: 'required', label: '必填' },
  { value: 'optional', label: '非必填' },
  { value: 'fixed', label: '固定' },
];

const title = computed(() =>
  props.showZh
    ? translateFieldLabel(props.element.label, props.element.code)
    : props.element.label,
);

/** 副标题始终带编码，避免多个「Color」看不清是哪个字段 */
const desc = computed(() => {
  const code = props.element.code || '';
  if (props.showZh && title.value !== props.element.label) {
    return `${props.element.label} · ${code}`;
  }
  return code;
});

const fillMode = computed<FieldFillMode>(() => {
  const g = props.element.groupLabel || '';
  if (props.element.fixed || g === '固定') return 'fixed';
  if (g === '必填') return 'required';
  if (g === '非必填' || g === '选填') return 'optional';
  if (props.element.required) return 'required';
  return 'optional';
});

const modeTag = computed(() => {
  if (fillMode.value === 'fixed') return { color: 'purple', text: '固定' };
  if (fillMode.value === 'required') return { color: 'red', text: '必填' };
  return { color: 'default', text: '非必填' };
});

const enumOptions = computed(() =>
  normalizeEnumOptions(props.element.options, {
    type: props.element.type,
    valuesList: props.element.valuesList,
  }),
);

const useEnumSelect = computed(() => enumOptions.value.length > 0);
</script>

<template>
  <div class="field-form-row" :class="{ compact }">
    <span class="drag-handle" title="拖动">⋮⋮</span>
    <div class="lab">
      <div class="lab-name">
        {{ title }}
        <Tag :color="modeTag.color" class="mode-tag">{{ modeTag.text }}</Tag>
        <Tag v-if="useEnumSelect" class="enum-tag">枚举</Tag>
        <button v-if="showZh" class="zh-tag" type="button" tabindex="-1">
          译
        </button>
      </div>
      <p class="lab-desc">{{ desc }}</p>
      <p v-if="element.remark" class="lab-remark">{{ element.remark }}</p>
    </div>
    <div class="ctrls">
      <div class="ctrl">
        <span class="ctrl-lab">默认</span>
        <Select
          v-if="useEnumSelect"
          :value="element.defaultValue || undefined"
          allow-clear
          show-search
          size="small"
          option-filter-prop="label"
          :options="enumOptions"
          placeholder="枚举默认值"
          @update:value="
            (v) => emit('update:defaultValue', (v as string) ?? '')
          "
        />
        <Input
          v-else
          :value="element.defaultValue"
          allow-clear
          size="small"
          placeholder="默认值"
          @update:value="(v) => emit('update:defaultValue', v ?? '')"
        />
      </div>
      <div class="ctrl">
        <span class="ctrl-lab">映射</span>
        <Select
          :value="element.valueSource"
          allow-clear
          show-search
          size="small"
          option-filter-prop="label"
          :options="VALUE_SOURCE_SELECT_OPTIONS"
          placeholder="映射"
          @update:value="(v) => emit('update:valueSource', v)"
        />
      </div>
      <div class="ctrl">
        <span class="ctrl-lab">备注</span>
        <Input
          :value="element.remark || ''"
          allow-clear
          size="small"
          placeholder="给业务看"
          @update:value="(v) => emit('update:remark', v ?? '')"
        />
      </div>
      <div class="ctrl ctrl-status">
        <span class="ctrl-lab">状态</span>
        <Select
          :value="fillMode"
          size="small"
          :options="FILL_OPTIONS"
          @update:value="(v) => emit('fillModeChange', v as FieldFillMode)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-form-row {
  display: grid;
  grid-template-columns: 18px minmax(150px, 1.1fr) minmax(360px, 2.2fr);
  gap: 8px 12px;
  align-items: center;
  padding: 8px 6px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.field-form-row.compact {
  grid-template-columns: 18px 1fr;
  align-items: start;
}

.field-form-row.compact .ctrls {
  grid-template-columns: 1fr 1fr;
  grid-column: 2;
}

.drag-handle {
  font-size: 13px;
  line-height: 1;
  color: #9ca3af;
  letter-spacing: -2px;
  cursor: grab;
  user-select: none;
}

.lab-name {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: #1f1f1f;
}

.mode-tag,
.enum-tag {
  margin: 0;
  font-weight: 500;
}

.enum-tag {
  color: #0f766e;
  background: #ccfbf1;
  border: 0;
}

.zh-tag {
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: #1677ff;
  cursor: default;
  background: #e6f4ff;
  border: 0;
  border-radius: 4px;
}

.lab-desc {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: #8c8c8c;
}

.lab-remark {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: #7c3aed;
}

.ctrls {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 1fr) 92px;
  gap: 6px 8px;
  align-items: end;
  min-width: 0;
}

.field-form-row.compact .ctrl-status {
  grid-column: 1 / -1;
  max-width: 160px;
}

.ctrl {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ctrl-lab {
  font-size: 11px;
  line-height: 1.2;
  color: #9ca3af;
}

.ctrl :deep(.ant-select),
.ctrl :deep(.ant-input-affix-wrapper),
.ctrl :deep(.ant-input) {
  width: 100%;
}
</style>
