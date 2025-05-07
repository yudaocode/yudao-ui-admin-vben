<script lang="ts" setup>
defineOptions({ name: 'CrmPermissionList' });

defineProps<{
  bizId: number | undefined; // 模块数据编号
  bizType: number; // 模块类型
  showAction: boolean; // 是否展示操作按钮
}>();
</script>

<template>
  <div>
    <p>待完成</p>
  </div>
</template>
