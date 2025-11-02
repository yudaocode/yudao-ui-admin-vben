<script lang="ts" setup>
defineOptions({ name: 'CardTitle' });

// TODO @jawe from xingyu：https://gitee.com/yudaocode/yudao-ui-admin-vben/pulls/243/files#diff_note_47350213；这个组件没有必要，直接用antdv card 的slot去做就行了，只有这一个地方用，没有必要单独写一个组件
defineProps({
  title: {
    type: String,
    required: true,
  },
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
