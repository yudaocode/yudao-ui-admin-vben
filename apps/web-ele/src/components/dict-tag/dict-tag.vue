<script setup lang="ts">
import { computed } from 'vue';

import { getDictObj } from '@vben/hooks';
import { isValidColor, TinyColor } from '@vben/utils';

import { ElTag } from 'element-plus';

interface DictTagProps {
  type: string; // 字典类型
  value: any; // 字典值
  icon?: string; // 图标
}

type TagType = '' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
type TagProps = {
  color?: string;
  style?: { color: string };
  type?: Exclude<TagType, ''>;
};

const props = defineProps<DictTagProps>();

/** 获取标签类型 */
function getTagType(colorType?: string): TagType {
  switch (colorType) {
    case 'danger':
    case 'error': {
      return 'danger';
    }
    case 'default': {
      return '';
    }
    case 'info': {
      return 'info';
    }
    case 'primary':
    case 'processing': {
      return 'primary';
    }
    case 'success': {
      return 'success';
    }
    case 'warning': {
      return 'warning';
    }
    default: {
      return '';
    }
  }
}

/** 获取字典标签 */
const dictTag = computed(() => {
  const defaultDict: { color?: string; colorType: TagType; label: string } = {
    label: '',
    colorType: '',
  };
  // 校验参数有效性
  if (!props.type || props.value === undefined || props.value === null) {
    return defaultDict;
  }

  // 获取字典对象
  const dict = getDictObj(props.type, String(props.value));
  if (!dict) {
    return defaultDict;
  }

  return {
    label: dict.label || '',
    colorType: getTagType(dict.colorType),
    color: isValidColor(dict.cssClass)
      ? new TinyColor(dict.cssClass).toHexString()
      : undefined,
  };
});

/** 获取标签属性 */
const tagProps = computed<TagProps>(() => ({
  ...(dictTag.value.colorType ? { type: dictTag.value.colorType } : {}),
  ...(dictTag.value.color
    ? { color: dictTag.value.color, style: { color: '#fff' } }
    : {}),
}));
</script>

<template>
  <ElTag v-if="dictTag.label" v-bind="tagProps">
    {{ dictTag.label }}
  </ElTag>
</template>
