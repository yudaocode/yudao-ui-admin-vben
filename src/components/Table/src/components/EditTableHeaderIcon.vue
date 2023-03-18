<template>
  <span>
    <slot></slot>
    {{ title }}
    <FormOutlined />
  </span>
</template>
<script lang="ts" setup name="EditTableHeaderIcon">
import { FormOutlined } from '@ant-design/icons-vue'

defineProps({ title: { type: String, default: '' } })
</script>
