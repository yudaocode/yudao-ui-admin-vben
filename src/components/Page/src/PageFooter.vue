<script lang="ts" setup>
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'PageFooter', inheritAttrs: false })

const { prefixCls } = useDesign('page-footer')
const { getCalcContentWidth } = useMenuSetting()
</script>

<template>
  <div :class="prefixCls" :style="{ width: getCalcContentWidth }">
    <div :class="`${prefixCls}__left`">
      <slot name="left" />
    </div>
    <slot />
    <div :class="`${prefixCls}__right`">
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-page-footer';

.@{prefix-cls} {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: @page-footer-z-index;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 24px;
  line-height: 44px;
  border-top: 1px solid var(--border-color);
  box-shadow:
    0 -6px 16px -8px rgb(0 0 0 / 8%),
    0 -9px 28px 0 rgb(0 0 0 / 5%),
    0 -12px 48px 16px rgb(0 0 0 / 3%);
  transition: width 0.2s;

  &__left {
    flex: 1 1;
  }
}
</style>
