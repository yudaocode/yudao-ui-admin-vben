<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportPost, getPostPage, type PostVO } from '#/api/system/post';
import { ActionButtons, IconEnum } from '#/components/action-buttons';

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
  formModalApi.setData({});
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
        <ActionButtons
          :actions="[
            {
              type: 'primary',
              label: $t('page.action.add'),
              preIcon: IconEnum.ADD,
              auth: ['system:post:create'],
              onClick: handleCreate.bind(null),
            },
            {
              label: $t('page.action.export'),
              preIcon: IconEnum.EXPORT,
              auth: ['system:post:export'],
              onClick: handleExport.bind(null),
            },
          ]"
        />
      </template>
      <template #action="{ row }">
        <ActionButtons
          :actions="[
            {
              type: 'link',
              label: $t('page.action.edit'),
              preIcon: IconEnum.EDIT,
              auth: ['system:post:update'],
              onClick: handleEdit.bind(null, row.id),
            },
            {
              type: 'link',
              danger: true,
              label: $t('page.action.delete'),
              preIcon: IconEnum.DELETE,
              auth: ['system:post:delete'],
              onClick: handleDelete.bind(null, row.id),
            },
          ]"
        />
      </template>
    </Grid>
    <FormModal />
  </Page>
</template>
