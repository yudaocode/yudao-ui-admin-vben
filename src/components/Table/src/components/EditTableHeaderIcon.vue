<script lang="ts" setup>
import { FormOutlined } from '@ant-design/icons-vue'

defineOptions({ name: 'EditTableHeaderIcon' })

defineProps({ title: { type: String, default: '' } })
</script>

<template>
  <span>
    <slot />
    {{ title }}
    <FormOutlined />
  </span>
</template>
