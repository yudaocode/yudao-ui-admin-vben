<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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
    ElMessage.warning('请先填写新增的淘汰原因');
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
    ElMessage.warning('淘汰原因不能为空');
    return;
  }
  if (new Set(reasons).size !== reasons.length) {
    ElMessage.warning('淘汰原因不能重复');
    return;
  }

  saving.value = true;
  try {
    await saveRecruitEliminateReason(reasons);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    <ElCard header="原因列表">
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

      <ElTable v-loading="loading" :data="reasonList" border>
        <ElTableColumn align="center" label="序号" type="index" width="80" />
        <ElTableColumn label="淘汰原因" min-width="320">
          <template #default="{ row }">
            <ElInput
              v-model="row.reason"
              :maxlength="255"
              clearable
              placeholder="请输入淘汰原因"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" label="操作" width="100">
          <template #default="{ $index }">
            <ElButton
              v-access:code="['hrm:recruit:config:update']"
              link
              type="danger"
              @click="handleRemove($index)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </Page>
</template>
