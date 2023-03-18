<template>
  <SiderTrigger v-if="sider" />
  <HeaderTrigger v-else :theme="theme" />
</template>
<script lang="ts" setup name="LayoutTrigger">
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'
import { propTypes } from '@/utils/propTypes'
import HeaderTrigger from './HeaderTrigger.vue'

const SiderTrigger = createAsyncComponent(() => import('./SiderTrigger.vue'))
defineProps({
  sider: propTypes.bool.def(true),
  theme: propTypes.oneOf(['light', 'dark'])
})
</script>
