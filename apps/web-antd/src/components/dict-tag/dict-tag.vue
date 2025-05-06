<script setup lang="ts">
import { computed } from 'vue';

import { Tag } from 'ant-design-vue';

// import { isHexColor } from '@/utils/color' // TODO @芋艿：【可优化】增加 cssClass 的处理 https://gitee.com/yudaocode/yudao-ui-admin-vben/blob/v2.4.1/src/components/DictTag/src/DictTag.vue#L60
import { getDictObj } from '#/utils';

interface DictTagProps {
  /**
   * 字典类型
   */
  type: string;
  /**
   * 字典值
   */
  value: any;
  /**
   * 图标
   */
  icon?: string;
}

const props = defineProps<DictTagProps>();

/** 获取字典标签 */
const dictTag = computed(() => {
  // 校验参数有效性
  if (!props.type || props.value === undefined || props.value === null) {
    return null;
  }

  // 获取字典对象
  const dict = getDictObj(props.type, String(props.value));
  if (!dict) {
    return null;
  }

  // 处理颜色类型
  let colorType = dict.colorType;
  switch (colorType) {
    case 'danger': {
      colorType = 'error';
      break;
    }
    case 'info': {
      colorType = 'default';
      break;
    }
    case 'primary': {
      colorType = 'processing';
      break;
    }
    default: {
      if (!colorType) {
        colorType = 'default';
      }
    }
  }

  return {
    label: dict.label || '',
    colorType,
  };
});
</script>

<template>
  <Tag v-if="dictTag" :color="dictTag.colorType">
    {{ dictTag.label }}
  </Tag>
</template>
