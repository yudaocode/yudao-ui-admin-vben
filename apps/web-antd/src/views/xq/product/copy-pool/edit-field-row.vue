<script lang="ts" setup>
import { computed } from 'vue';

import { Input, Select, Tag } from 'ant-design-vue';

import { normalizeEnumOptions } from '../enum-options';
import { translateFieldLabel } from '../template-config/field-label-zh';

const props = defineProps<{
  code: string;
  fixed?: boolean;
  groupLabel?: string;
  label: string;
  modelValue?: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
  remark?: string;
  required?: boolean;
  showZh: boolean;
  type?: string;
  valuesList?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const title = computed(() =>
  props.showZh ? translateFieldLabel(props.label, props.code) : props.label,
);

const desc = computed(() => {
  if (props.showZh && title.value !== props.label) {
    return props.label;
  }
  return props.code;
});

const modeTag = computed(() => {
  const g = props.groupLabel || '';
  if (props.fixed || g === '固定') return { color: 'purple', text: '固定' };
  if (g === '必填' || (!g && props.required))
    return { color: 'red', text: '必填' };
  return { color: 'default', text: g === '选填' ? '非必填' : g || '非必填' };
});

const enumOptions = computed(() =>
  normalizeEnumOptions(props.options, {
    type: props.type,
    valuesList: props.valuesList,
  }),
);

const useEnumSelect = computed(() => enumOptions.value.length > 0);

const isLongText = computed(() =>
  String(props.type || '')
    .toUpperCase()
    .includes('LONG'),
);
</script>

<template>
  <div class="edit-field-row">
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
      <p v-if="remark" class="lab-remark">{{ remark }}</p>
    </div>
    <div class="ctrls">
      <Select
        v-if="useEnumSelect"
        :value="modelValue || undefined"
        allow-clear
        show-search
        size="small"
        option-filter-prop="label"
        :options="enumOptions"
        :placeholder="placeholder || '选择枚举值'"
        @update:value="(v) => emit('update:modelValue', String(v ?? ''))"
      />
      <Input.TextArea
        v-else-if="isLongText"
        :value="modelValue"
        allow-clear
        :rows="3"
        size="small"
        :placeholder="placeholder || code"
        @update:value="(v) => emit('update:modelValue', String(v ?? ''))"
      />
      <Input
        v-else
        :value="modelValue"
        allow-clear
        size="small"
        :placeholder="placeholder || code"
        @update:value="(v) => emit('update:modelValue', String(v ?? ''))"
      />
    </div>
  </div>
</template>

<style scoped>
.edit-field-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 10px 12px;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.lab-name {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
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
  line-height: 1.45;
  color: #8c8c8c;
}

.lab-remark {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #7c3aed;
}

.ctrls {
  min-width: 0;
}

.ctrls :deep(.ant-select) {
  width: 100%;
}
</style>
