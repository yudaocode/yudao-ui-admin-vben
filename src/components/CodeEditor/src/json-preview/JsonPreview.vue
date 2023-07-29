<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

defineProps({
  data: Object,
})
</script>

<template>
  <VueJsonPretty path="res" :deep="3" :show-length="true" :data="data" />
</template>
