<script lang="ts" setup>
import AppSearchKeyItem from './AppSearchKeyItem.vue'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'

const { prefixCls } = useDesign('app-search-footer')
const { t } = useI18n()
</script>

<template>
  <div class="relative h-10 flex flex-shrink-0 items-center border-t-1 rounded-bl-2xl px-4 py-0 dark:border-light-100">
    <AppSearchKeyItem :class="`${prefixCls}-item`" icon="ant-design:enter-outlined" />
    <span>{{ t('component.app.toSearch') }}</span>
    <AppSearchKeyItem :class="`${prefixCls}-item`" icon="ion:arrow-up-outline" />
    <AppSearchKeyItem :class="`${prefixCls}-item`" icon="ion:arrow-down-outline" />
    <span>{{ t('component.app.toNavigate') }}</span>
    <AppSearchKeyItem :class="`${prefixCls}-item`" icon="mdi:keyboard-esc" />
    <span>{{ t('common.closeText') }}</span>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-app-search-footer';

.@{prefix-cls} {
  &-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 18px;
    padding-bottom: 2px;
    margin-right: 0.4em;
    background-color: linear-gradient(-225deg, #d5dbe4, #f8f8f8);
    border-radius: 4px;
    box-shadow:
      inset 0 -2px 0 0 #cdcde6,
      inset 0 0 1px 1px #fff,
      0 1px 2px 1px rgb(30 35 90 / 40%);

    &:nth-child(2),
    &:nth-child(3),
    &:nth-child(6) {
      margin-left: 14px;
    }
  }
}
</style>
