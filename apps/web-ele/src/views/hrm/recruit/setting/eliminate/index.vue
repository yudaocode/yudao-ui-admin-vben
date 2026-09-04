<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { nextTick, onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { ElInput, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getRecruitEliminateReasonList,
  saveRecruitEliminateReason,
} from '#/api/hrm/recruit/config';
import { $t } from '#/locales';

import { parseRecruitEliminateReasons, useGridColumns } from './data';

defineOptions({ name: 'HrmRecruitEliminateReason' });

const saving = ref(false);
const reasonList = ref<any[]>([]);
let rowKeySeed = 0;

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useGridColumns(),
    data: reasonList.value,
    height: 'auto',
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'key', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>,
});

/** 查询列表 */
async function getReasonList() {
  gridApi.setLoading(true);
  try {
    const list = await getRecruitEliminateReasonList();
    reasonList.value = (list || []).map((reason) => ({
      key: ++rowKeySeed,
      reason,
    }));
    await nextTick();
    await gridApi.grid.reloadData(reasonList.value);
  } finally {
    gridApi.setLoading(false);
  }
}

/** 新增一行 */
async function handleAdd() {
  if (reasonList.value.some((row) => !row.reason.trim())) {
    ElMessage.warning('请先填写新增的淘汰原因');
    return;
  }
  reasonList.value.push({ key: ++rowKeySeed, reason: '' });
  await gridApi.grid.reloadData(reasonList.value);
}

/** 删除一行 */
async function handleRemove(row: any) {
  reasonList.value = reasonList.value.filter((item) => item.key !== row.key);
  await gridApi.grid.reloadData(reasonList.value);
}

/** 保存整表 */
async function handleSave() {
  const { error, reasons } = parseRecruitEliminateReasons(reasonList.value);
  if (error) {
    ElMessage.warning(error);
    return;
  }

  saving.value = true;
  try {
    await saveRecruitEliminateReason(reasons!);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getReasonList();
  } finally {
    saving.value = false;
  }
}

onMounted(getReasonList);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【招聘】招聘管理"
        url="https://doc.iocoder.cn/hrm/recruit/"
      />
    </template>
    <Grid table-title="原因列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:recruit:config:update'],
              onClick: handleAdd,
            },
            {
              label: '保存',
              type: 'primary',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:recruit:config:update'],
              loading: saving,
              onClick: handleSave,
            },
          ]"
        />
      </template>
      <template #reason="{ row }">
        <ElInput
          v-model="row.reason"
          :maxlength="255"
          clearable
          placeholder="请输入淘汰原因"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:recruit:config:update'],
              onClick: () => handleRemove(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
