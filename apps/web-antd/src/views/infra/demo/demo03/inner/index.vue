<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/inner';

import { h, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus, Trash2 } from '@vben/icons';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { Button, message, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDemo03Student,
  deleteDemo03StudentList,
  exportDemo03Student,
  getDemo03StudentPage,
} from '#/api/infra/demo/demo03/inner';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Demo03CourseList from './modules/demo03-course-list.vue';
import Demo03GradeList from './modules/demo03-grade-list.vue';
import Form from './modules/form.vue';

/** 子表的列表 */
const subTabsName = ref('demo03Course');

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.reload();
}

/** 创建学生 */
function onCreate() {
  formModalApi.setData({}).open();
}

/** 编辑学生 */
function onEdit(row: Demo03StudentApi.Demo03Student) {
  formModalApi.setData(row).open();
}

/** 删除学生 */
async function onDelete(row: Demo03StudentApi.Demo03Student) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo03Student(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除学生 */
async function onDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo03StudentList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: Demo03StudentApi.Demo03Student[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function onExport() {
  const data = await exportDemo03Student(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '学生.xls', source: data });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<Demo03StudentApi.Demo03Student>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getDemo03StudentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<Demo03StudentApi.Demo03Student>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />

    <Grid table-title="学生列表">
      <template #expand_content="{ row }">
        <!-- 子表的表单 -->
        <Tabs v-model:active-key="subTabsName" class="mx-8">
          <Tabs.TabPane key="demo03Course" tab="学生课程" force-render>
            <Demo03CourseList :student-id="row?.id" />
          </Tabs.TabPane>
          <Tabs.TabPane key="demo03Grade" tab="学生班级" force-render>
            <Demo03GradeList :student-id="row?.id" />
          </Tabs.TabPane>
        </Tabs>
      </template>
      <template #toolbar-tools>
        <Button
          :icon="h(Plus)"
          type="primary"
          @click="onCreate"
          v-access:code="['infra:demo03-student:create']"
        >
          {{ $t('ui.actionTitle.create', ['学生']) }}
        </Button>
        <Button
          :icon="h(Download)"
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:demo03-student:export']"
        >
          {{ $t('ui.actionTitle.export') }}
        </Button>
        <Button
          :icon="h(Trash2)"
          type="primary"
          danger
          class="ml-2"
          :disabled="isEmpty(checkedIds)"
          @click="onDeleteBatch"
          v-access:code="['infra:demo03-student:delete']"
        >
          批量删除
        </Button>
      </template>
    </Grid>
  </Page>
</template>
