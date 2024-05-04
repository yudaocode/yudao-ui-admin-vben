<script lang="ts" setup>
import { DocAlert } from '@/components/DocAlert'
</script>

<template>
  <div>
    <DocAlert title="【商机】商机管理、商机状态" url="https://doc.iocoder.cn/crm/business/" />
    <DocAlert title="【通用】数据权限" url="https://doc.iocoder.cn/crm/permission/" />

    <a-button danger type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3">
      该功能支持 Vue3 + element-plus 版本！
    </a-button>
    <br />
    <a-button type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/crm/business/index.vue">
      可参考 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/crm/business/index.vue 代码，pull request 贡献给我们！
    </a-button>
  </div>
</template>
