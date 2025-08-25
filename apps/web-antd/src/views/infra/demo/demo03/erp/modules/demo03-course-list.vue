<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { Demo03StudentApi } from '#/api/infra/demo/demo03/erp';

import { h, nextTick, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Plus, Trash2 } from '@vben/icons';
import { isEmpty } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDemo03Course,
  deleteDemo03CourseList,
  getDemo03CoursePage,
} from '#/api/infra/demo/demo03/erp';
import { $t } from '#/locales';

import {
  useDemo03CourseGridColumns,
  useDemo03CourseGridFormSchema,
} from '../data';
import Demo03CourseForm from './demo03-course-form.vue';

const props = defineProps<{
  studentId?: number; // 学生编号（主表的关联字段）
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Demo03CourseForm,
  destroyOnClose: true,
});

/** 创建学生课程 */
function onCreate() {
  if (!props.studentId) {
    message.warning('请先选择一个学生!');
    return;
  }
  formModalApi.setData({ studentId: props.studentId }).open();
}

/** 编辑学生课程 */
function onEdit(row: Demo03StudentApi.Demo03Course) {
  formModalApi.setData(row).open();
}

/** 删除学生课程 */
async function onDelete(row: Demo03StudentApi.Demo03Course) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo03Course(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除学生课程 */
async function onDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteDemo03CourseList(checkedIds.value);
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
  records: Demo03StudentApi.Demo03Course[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<Demo03StudentApi.Demo03Course>) {
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
    schema: useDemo03CourseGridFormSchema(),
  },
  gridOptions: {
    columns: useDemo03CourseGridColumns(onActionClick),
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (!props.studentId) {
            return [];
          }
          return await getDemo03CoursePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            studentId: props.studentId,
            ...formValues,
          });
        },
      },
    },
    pagerConfig: {
      enabled: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    height: '600px',
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<Demo03StudentApi.Demo03Course>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 刷新表格 */
const onRefresh = async () => {
  await gridApi.query();
};

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    if (!val) {
      return;
    }
    await nextTick();
    await onRefresh();
  },
  { immediate: true },
);
</script>

<template>
  <FormModal @success="onRefresh" />
  <Grid table-title="学生课程列表">
    <template #toolbar-tools>
      <Button
        :icon="h(Plus)"
        type="primary"
        @click="onCreate"
        v-access:code="['infra:demo03-student:create']"
      >
        {{ $t('ui.actionTitle.create', ['学生课程']) }}
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
</template>
