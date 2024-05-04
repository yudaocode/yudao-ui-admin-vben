<script lang="ts" setup>
import { DocAlert } from '@/components/DocAlert'
</script>

<template>
  <div>
    <DocAlert
      title="【库存】库存调拨、库存盘点"
      url="https://doc.iocoder.cn/erp/stock-move-check/"
    />

    <a-button danger type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3">
      该功能支持 Vue3 + element-plus 版本！
    </a-button>
    <br />
    <a-button type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/erp/stock/check/index.vue">
      可参考 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/erp/sale/check/index.vue 代码，pull request 贡献给我们！
    </a-button>
  </div>
</template>
