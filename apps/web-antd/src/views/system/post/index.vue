<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportPost, getPostPage, type PostVO } from '#/api/system/post';

import { columns, formSchema } from './post.data';
import PostModal from './PostModal.vue';

defineOptions({ name: 'SystemPost' });

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: formSchema,
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

const gridOptions: VxeGridProps<PostVO> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'id',
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getPostPage({
          page: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: PostModal,
});

function handleCreate() {
  formModalApi.setData({
    valuse: {},
  });
  formModalApi.open();
}
async function handleEdit(id: number) {
  formModalApi.setData({ id });
  formModalApi.open();
}
// TODO
function handleDelete(id: number) {
  message.success(id);
}
// TODO
async function handleExport() {
  await exportPost(tableApi.formApi.form.values);
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <Button
          type="primary"
          v-access:code="['system:post:create']"
          @click="handleCreate"
        >
          {{ $t('page.action.add') }}
        </Button>
        <Button
          class="ml-4"
          v-access:code="['system:post:export']"
          @click="handleExport"
        >
          {{ $t('page.action.export') }}
        </Button>
      </template>
      <template #action="{ row }">
        <Button
          type="link"
          v-access:code="['system:post:update']"
          @click="handleEdit(row.id)"
        >
          {{ $t('page.action.edit') }}
        </Button>
        <Button
          danger
          type="link"
          v-access:code="['system:post:delete']"
          @click="handleDelete(row.id)"
        >
          {{ $t('page.action.delete') }}
        </Button>
      </template>
    </Grid>
    <FormModal />
  </Page>
</template>
