<script lang="ts" setup>
import { CheckOutlined } from '@ant-design/icons-vue'

import { baseHandler } from '../handler'
import type { HandlerEnum } from '../enum'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ThemeColorPicker' })

const props = defineProps({
  colorList: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  event: {
    type: Number as PropType<HandlerEnum>,
  },
  def: {
    type: String,
  },
})
const { prefixCls } = useDesign('setting-theme-picker')

function handleClick(color: string) {
  props.event && baseHandler(props.event, color)
}
</script>

<template>
  <div :class="prefixCls">
    <template v-for="color in colorList || []" :key="color">
      <span
        :class="[
          `${prefixCls}__item`,
          {
            [`${prefixCls}__item--active`]: def === color,
          },
        ]"
        :style="{ background: color }"
        @click="handleClick(color)"
      >
        <CheckOutlined />
      </span>
    </template>
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-setting-theme-picker';

.@{prefix-cls} {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  margin: 16px 0;

  &__item {
    width: 20px;
    height: 20px;
    cursor: pointer;
    border: 1px solid #ddd;
    border-radius: 2px;

    svg {
      display: none;
    }

    &--active {
      svg {
        display: inline-block;
        margin: 0 0 3px 3px;
        font-size: 12px;
        fill: @white !important;
      }
    }
  }
}
</style>
