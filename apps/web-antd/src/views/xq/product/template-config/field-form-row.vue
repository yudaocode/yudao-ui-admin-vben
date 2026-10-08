<script lang="ts" setup>
import { computed } from 'vue';

import { Input, Select, Switch } from 'ant-design-vue';

import { translateFieldLabel } from './field-label-zh';
import { VALUE_SOURCE_SELECT_OPTIONS } from './value-sources';

const props = defineProps<{
  compact?: boolean;
  element: {
    code: string;
    defaultValue: string;
    label: string;
    required?: boolean;
    valueSource: string | undefined;
  };
  showZh: boolean;
}>();

const emit = defineEmits<{
  requiredChange: [checked: boolean];
  'update:defaultValue': [value: string];
  'update:valueSource': [value: string | undefined];
}>();

const title = computed(() =>
  props.showZh
    ? translateFieldLabel(props.element.label, props.element.code)
    : props.element.label,
);

const desc = computed(() => {
  if (props.showZh && title.value !== props.element.label) {
    return props.element.label;
  }
  return props.element.code;
});
</script>

<template>
  <div class="field-form-row" :class="{ compact, req: element.required }">
    <span class="drag-handle" title="拖动">⋮⋮</span>
    <div class="lab">
      <div class="lab-name">
        <i v-if="element.required" class="star">*</i>
        {{ title }}
        <button v-if="showZh" class="zh-tag" type="button" tabindex="-1">
          译
        </button>
      </div>
      <p class="lab-desc">{{ desc }}</p>
    </div>
    <div class="ctrls">
      <Input
        :value="element.defaultValue"
        allow-clear
        size="small"
        placeholder="默认值"
        @update:value="(v) => emit('update:defaultValue', v ?? '')"
      />
      <Select
        :value="element.valueSource"
        allow-clear
        show-search
        size="small"
        option-filter-prop="label"
        :options="VALUE_SOURCE_SELECT_OPTIONS"
        placeholder="AI / 商品映射"
        @update:value="(v) => emit('update:valueSource', v)"
      />
    </div>
    <label class="req-switch" @click.stop>
      必填
      <Switch
        :checked="!!element.required"
        size="small"
        @change="(v: any) => emit('requiredChange', !!v)"
      />
    </label>
  </div>
</template>

<style scoped>
.field-form-row {
  display: grid;
  grid-template-columns: 18px minmax(160px, 1fr) minmax(200px, 1.15fr) auto;
  gap: 8px 12px;
  align-items: start;
  padding: 10px 8px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.field-form-row.compact {
  grid-template-columns: 18px 1fr;
}

.field-form-row.compact .ctrls,
.field-form-row.compact .req-switch {
  grid-column: 2;
}

.field-form-row.req {
  background: #fffafa;
}

.drag-handle {
  padding-top: 4px;
  font-size: 13px;
  line-height: 1;
  color: #9ca3af;
  letter-spacing: -2px;
  cursor: grab;
  user-select: none;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.req-switch {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding-top: 2px;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}
</style>
