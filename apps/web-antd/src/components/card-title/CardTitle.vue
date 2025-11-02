<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});

defineComponent({
  name: 'CardTitle',
});
</script>

<template>
  <span class="card-title">{{ title }}</span>
</template>

<style scoped lang="scss">
.card-title {
  font-size: 14px;
  font-weight: 600;

  &::before {
    position: relative;
    top: 8px;
    left: -5px;
    display: inline-block;
    width: 3px;
    height: 14px;
    content: '';
    //background-color: #105cfb;
    background: var(--el-color-primary);
    border-radius: 5px;
    transform: translateY(-50%);
  }
}
</style>
