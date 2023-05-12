<template>
  <span>
    <slot></slot>
    {{ title }}
    <FormOutlined />
  </span>
</template>
<script lang="ts" setup>
import { FormOutlined } from '@ant-design/icons-vue'

defineOptions({ name: 'EditTableHeaderIcon' })

defineProps({ title: { type: String, default: '' } })
</script>
