<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MemberUserApi } from '#/api/member/user';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage } from '#/api/member/user';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格数据 */
function onRefresh() {
  gridApi.query();
}

/** 设置选中 ID */
const checkedIds = ref<number[]>([]);
function setCheckedIds({ records }: { records: MemberUserApi.User[] }) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 编辑住户 */
function handleEdit(row: MemberUserApi.User) {
  formModalApi.setData(row).open();
}

/** 查看住户详情 */
function handleViewDetail(row: MemberUserApi.User) {
  router.push({
    name: 'BdmUserDetail',
    query: {
      id: row.id,
    },
  });
}

/** 查看住户联系人 */
function handleViewContact(row: MemberUserApi.User) {
  router.push({
    name: 'MemberContact',
    query: {
      userId: row.id,
    },
  });
}

// 表格实例
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    checkboxConfig: {
      highlight: true,
      labelField: 'checkbox',
    },
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MemberUserApi.User>,
  gridEvents: {
    checkboxAll: setCheckedIds,
    checkboxChange: setCheckedIds,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="住户用户、标签、分组"
        url="https://doc.iocoder.cn/member/user/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="住户列表">
      <template #toolbar-tools>
        <TableAction :actions="[]" />
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: handleViewDetail.bind(null, row),
            },
            {
              label: '联系人',
              type: 'link',
              icon: 'carbon:notebook-reference',
              onClick: handleViewContact.bind(null, row),
            },
          ]"
          :drop-down-actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['member:user:update'],
              onClick: handleEdit.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
