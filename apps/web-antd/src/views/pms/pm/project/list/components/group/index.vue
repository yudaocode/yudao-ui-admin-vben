<script lang="ts" setup>
import { useRouter } from 'vue-router';

defineOptions({ name: 'PmsProjectGroup' });

// 项目分组通过项目列表的“管理分组”弹窗维护，本入口重定向回项目列表
// TODO @AI：这个是不是没有用噢？
const { replace } = useRouter();
replace('/pms/pm/project/list');
</script>

<template>
  <div></div>
</template>
