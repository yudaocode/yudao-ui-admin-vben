<script lang="ts" setup>
import { computed } from 'vue';

import { Input } from 'ant-design-vue';

import { translateFieldLabel } from '../template-config/field-label-zh';

const props = defineProps<{
  code: string;
  label: string;
  modelValue?: string;
  placeholder?: string;
  required?: boolean;
  showZh: boolean;
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
</script>

<template>
  <div class="edit-field-row" :class="{ req: required }">
    <div class="lab">
      <div class="lab-name">
        <i v-if="required" class="star">*</i>
        {{ title }}
        <button v-if="showZh" class="zh-tag" type="button" tabindex="-1">
          译
        </button>
      </div>
      <p class="lab-desc">{{ desc }}</p>
    </div>
    <div class="ctrls">
      <Input
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
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(200px, 1.2fr);
  gap: 8px 12px;
  align-items: start;
  padding: 10px 8px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.edit-field-row.req {
  background: #fffafa;
}

.lab-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: #1f1f1f;
}

.star {
  margin-right: 2px;
  font-style: normal;
  color: #ff4d4f;
}

.zh-tag {
  padding: 0 5px;
  margin-left: 6px;
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

.ctrls {
  min-width: 0;
}
</style>
