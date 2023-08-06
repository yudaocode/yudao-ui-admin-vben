<script lang="ts" setup>
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { BasicTitle } from '@/components/Basic'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'BasicDrawerHeader' })

defineProps({
  isDetail: propTypes.bool,
  showDetailBack: propTypes.bool,
  title: propTypes.string,
})
const emit = defineEmits(['close'])

const { prefixCls } = useDesign('basic-drawer-header')

function handleClose() {
  emit('close')
}
</script>

<template>
  <BasicTitle v-if="!isDetail" :class="prefixCls">
    <slot name="title" />
    {{ !$slots.title ? title : '' }}
  </BasicTitle>

  <div v-else :class="[prefixCls, `${prefixCls}--detail`]">
    <span :class="`${prefixCls}__twrap`">
      <span v-if="showDetailBack" @click="handleClose">
        <ArrowLeftOutlined :class="`${prefixCls}__back`" />
      </span>
      <span v-if="title">{{ title }}</span>
    </span>

    <span :class="`${prefixCls}__toolbar`">
      <slot name="titleToolbar" />
    </span>
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-basic-drawer-header';
@footer-height: 60px;
.@{prefix-cls} {
  display: flex;
  align-items: center;
  height: 100%;

  &__back {
    padding: 0 12px;
    cursor: pointer;
  }

  &__twrap {
    flex: 1;
  }

  &__toolbar {
    padding-right: 50px;
  }
}
</style>
