<template>
  <SiderTrigger v-if="sider" />
  <HeaderTrigger v-else :theme="theme" />
</template>
<script lang="ts" setup>
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'
import { propTypes } from '@/utils/propTypes'
import HeaderTrigger from './HeaderTrigger.vue'

const SiderTrigger = createAsyncComponent(() => import('./SiderTrigger.vue'))

defineOptions({ name: 'LayoutTrigger' })

defineProps({
  sider: propTypes.bool.def(true),
  theme: propTypes.oneOf(['light', 'dark'])
})
</script>
