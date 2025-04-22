<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { DocAlert } from '#/components/doc-alert';
</script>

<template>
  <Page>
    <DocAlert
      title="【合同】合同管理、合同提醒"
      url="https://doc.iocoder.cn/crm/contract/"
    />
    <DocAlert
      title="【通用】数据权限"
      url="https://doc.iocoder.cn/crm/permission/"
    />
    <Button
      danger
      type="link"
      target="_blank"
      href="https://github.com/yudaocode/yudao-ui-admin-vue3"
    >
      该功能支持 Vue3 + element-plus 版本！
    </Button>
    <br />
    <Button
      type="link"
      target="_blank"
      href="https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/crm/contract/config/index"
    >
      可参考
      https://github.com/yudaocode/yudao-ui-admin-vue3/blob/master/src/views/crm/contract/config/index
      代码，pull request 贡献给我们！
    </Button>
  </Page>
</template>
