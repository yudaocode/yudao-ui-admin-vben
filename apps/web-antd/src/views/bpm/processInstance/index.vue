<script lang="ts" setup>
import { DocAlert } from '#/components/doc-alert';
import { Button } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
</script>

<template>
  <Page>
    <DocAlert title="流程发起、取消、重新发起" url="https://doc.iocoder.cn/bpm/process-instance/" />
    <Button danger type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3">
      该功能支持 Vue3 + element-plus 版本！
    </Button>
    <br />
    <Button type="link" target="_blank" href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/bpm/processInstance/index">
      可参考 https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/bpm/processInstance/index 代码，pull request 贡献给我们！
    </Button>
  </Page>
</template>