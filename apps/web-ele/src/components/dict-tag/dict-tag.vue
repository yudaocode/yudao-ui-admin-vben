<script setup lang="ts">
import { computed } from 'vue';

// import { isHexColor } from '@/utils/color' // TODO @芋艿：【可优化】增加 cssClass 的处理 https://gitee.com/yudaocode/yudao-ui-admin-vben/blob/v2.4.1/src/components/DictTag/src/DictTag.vue#L60 @xingyu：这个要适配掉 ele 版本里么？
import { getDictObj } from '@vben/hooks';

import { ElTag } from 'element-plus';

interface DictTagProps {
  type: string; // 字典类型
  value: any; // 字典值
  icon?: string; // 图标
}

type TagType = '' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
type TagProps = { type?: Exclude<TagType, ''> };

const props = defineProps<DictTagProps>();

/** 获取标签类型 */
function getTagType(colorType?: string): TagType {
  switch (colorType) {
    case 'danger': {
      return 'danger';
    }
    case 'default': {
      return '';
    }
    case 'info': {
      return 'info';
    }
    case 'primary': {
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
  const defaultDict: { colorType: TagType; label: string } = {
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
  };
});

/** 获取标签属性 */
const tagProps = computed<TagProps>(() =>
  dictTag.value.colorType ? { type: dictTag.value.colorType } : {},
);
</script>

<template>
  <ElTag v-if="dictTag.label" v-bind="tagProps">
    {{ dictTag.label }}
  </ElTag>
</template>
