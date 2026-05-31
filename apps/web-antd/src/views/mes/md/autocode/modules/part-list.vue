<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdAutoCodePartApi } from '#/api/mes/md/autocode/part';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAutoCodePart,
  getAutoCodePartListByRuleId,
} from '#/api/mes/md/autocode/part';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { usePartGridColumns } from '../data';
import PartForm from './part-form.vue';

const props = defineProps<{
  ruleId: number;
}>();

const list = ref<MesMdAutoCodePartApi.AutoCodePart[]>([]);

const [PartFormModal, partFormModalApi] = useVbenModal({
  connectedComponent: PartForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: usePartGridColumns(),
    data: list.value,
    minHeight: 240,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesMdAutoCodePartApi.AutoCodePart>,
});

/** 加载编码规则分段 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getAutoCodePartListByRuleId(props.ruleId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 创建编码规则分段 */
function handleCreate() {
  const maxSort =
    list.value.length > 0
      ? Math.max(...list.value.map((item) => item.sort || 0))
      : 0;
  partFormModalApi.setData({ maxSort, ruleId: props.ruleId }).open();
}

/** 编辑编码规则分段 */
function handleEdit(row: MesMdAutoCodePartApi.AutoCodePart) {
  partFormModalApi.setData({ id: row.id, ruleId: props.ruleId }).open();
}

/** 删除编码规则分段 */
async function handleDelete(row: MesMdAutoCodePartApi.AutoCodePart) {
  await deleteAutoCodePart(row.id!);
  message.success($t('ui.actionMessage.deleteSuccess', ['编码规则分段']));
  await getList();
}

watch(
  () => props.ruleId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <PartFormModal @success="getList" />
  <div class="mb-3 flex items-center justify-start">
    <TableAction
      :actions="[
        {
          label: $t('ui.actionTitle.create', ['分段']),
          type: 'primary',
          onClick: handleCreate,
        },
      ]"
    />
  </div>
  <Grid class="w-full" table-title="规则组成">
    <template #cycleMethod="{ row }">
      <DictTag
        v-if="row.cycleFlag"
        :type="DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD"
        :value="row.cycleMethod"
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'link',
            onClick: handleEdit.bind(null, row),
          },
          {
            label: $t('common.delete'),
            type: 'link',
            danger: true,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', ['编码规则分段']),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
