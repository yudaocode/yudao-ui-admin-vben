<script lang="ts" setup>
import { DocAlert } from '@/components/DocAlert'
</script>

<template>
  <div>
    <DocAlert title="【库存】其它入库、其它出库" url="https://doc.iocoder.cn/erp/stock-in-out/" />

    <a-button danger type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3">
      该功能支持 Vue3 + element-plus 版本！
    </a-button>
    <br />
    <a-button type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/erp/stock/in/index.vue">
      可参考 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/erp/sale/in/index.vue 代码，pull request 贡献给我们！
    </a-button>
  </div>
</template>
