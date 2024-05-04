<script lang="ts" setup>
import { DocAlert } from '@/components/DocAlert'
</script>

<template>
  <div>
    <DocAlert title="【回款】回款管理、回款计划" url="https://doc.iocoder.cn/crm/receivable/" />
    <DocAlert title="【通用】数据权限" url="https://doc.iocoder.cn/crm/permission/" />

    <a-button danger type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3">
      该功能支持 Vue3 + element-plus 版本！
    </a-button>
    <br />
    <a-button type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/crm/receivable/plan/index.vue">
      可参考 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/crm/receivable/plan/index.vue 代码，pull request 贡献给我们！
    </a-button>
  </div>
</template>
