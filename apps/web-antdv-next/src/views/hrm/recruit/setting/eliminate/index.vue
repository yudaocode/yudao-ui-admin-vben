<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Button, Card, Input, message, Table } from 'antdv-next';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  getRecruitEliminateReasonList,
  saveRecruitEliminateReason,
} from '#/api/hrm/recruit/config';
import { $t } from '#/locales';

defineOptions({ name: 'HrmRecruitEliminateReason' });

interface ReasonRow {
  key: number;
  reason: string;
}

const loading = ref(false);
const saving = ref(false);
const reasonList = ref<ReasonRow[]>([]);
let rowKeySeed = 0;

const columns: TableColumnsType<ReasonRow> = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center',
  },
  {
    title: '淘汰原因',
    dataIndex: 'reason',
    minWidth: 320,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
  },
];

/** 查询列表 */
async function getReasonList() {
  loading.value = true;
  try {
    const list = await getRecruitEliminateReasonList();
    reasonList.value = (list || []).map((reason) => ({
      key: ++rowKeySeed,
      reason,
    }));
  } finally {
    loading.value = false;
  }
}

/** 新增一行 */
function handleAdd() {
  if (reasonList.value.some((row) => !row.reason.trim())) {
    message.warning('请先填写新增的淘汰原因');
    return;
  }
  reasonList.value.push({ key: ++rowKeySeed, reason: '' });
}

/** 删除一行 */
function handleRemove(index: number) {
  reasonList.value.splice(index, 1);
}

/** 保存整表 */
async function handleSave() {
  const reasons = reasonList.value.map((row) => row.reason.trim());
  if (reasons.some((reason) => !reason)) {
    message.warning('淘汰原因不能为空');
    return;
  }
  if (new Set(reasons).size !== reasons.length) {
    message.warning('淘汰原因不能重复');
    return;
  }

  saving.value = true;
  try {
    await saveRecruitEliminateReason(reasons);
    message.success($t('ui.actionMessage.operationSuccess'));
    await getReasonList();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  getReasonList();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【招聘】招聘管理"
        url="https://doc.iocoder.cn/hrm/recruit/"
      />
    </template>
    <Card title="原因列表">
      <div class="mb-4 flex justify-end">
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
      </div>

      <Table
        :columns="columns"
        :data-source="reasonList"
        :loading="loading"
        :pagination="false"
        bordered
        row-key="key"
        size="middle"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.dataIndex === 'reason'">
            <Input
              v-model:value="record.reason"
              :maxlength="255"
              allow-clear
              placeholder="请输入淘汰原因"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              v-access:code="['hrm:recruit:config:update']"
              danger
              type="link"
              @click="handleRemove(index)"
            >
              删除
            </Button>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
