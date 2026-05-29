<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcDefectRecordApi } from '#/api/mes/qc/defectrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDefectRecord,
  getDefectRecordPage,
} from '#/api/mes/qc/defectrecord';
import { $t } from '#/locales';

import DefectRecordInlineForm from './defect-record-inline-form.vue';

defineOptions({ name: 'DefectRecordInlineList' });

const emit = defineEmits(['success']);

// TODO @AI：改成 QcData？？？
interface OpenData {
  formType?: string;
  lineId: number;
  qcId: number;
  qcType: number;
}

const qcData = ref<OpenData>();
const isReadonly = computed(() => qcData.value?.formType === 'detail');

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
  emit('success');
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DefectRecordInlineForm,
  destroyOnClose: true,
});

/** 新增缺陷 */
function handleCreate() {
  if (!qcData.value) {
    return;
  }
  formModalApi
    .setData({
      formType: 'create',
      lineId: qcData.value.lineId,
      qcId: qcData.value.qcId,
      qcType: qcData.value.qcType,
    })
    .open();
}

/** 编辑缺陷 */
function handleEdit(row: MesQcDefectRecordApi.DefectRecord) {
  if (!qcData.value) {
    return;
  }
  formModalApi
    .setData({
      formType: 'update',
      id: row.id,
      lineId: qcData.value.lineId,
      qcId: qcData.value.qcId,
      qcType: qcData.value.qcType,
    })
    .open();
}

/** 删除缺陷 */
async function handleDelete(row: MesQcDefectRecordApi.DefectRecord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteDefectRecord(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

// TODO @AI：搞个 data.ts？
// TODO @AI：代码风格，貌似不够一致；
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'name',
        title: '缺陷描述',
        minWidth: 200,
      },
      {
        field: 'level',
        title: '缺陷等级',
        width: 120,
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MES_DEFECT_LEVEL },
        },
      },
      {
        field: 'quantity',
        title: '缺陷数量',
        width: 100,
      },
      {
        field: 'remark',
        title: '备注',
        minWidth: 150,
      },
      {
        title: '操作',
        width: 130,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
    height: 320,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!qcData.value) {
            return { list: [], total: 0 };
          }
          return await getDefectRecordPage({
            lineId: qcData.value.lineId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            qcId: qcData.value.qcId,
            qcType: qcData.value.qcType,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MesQcDefectRecordApi.DefectRecord>,
});

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      qcData.value = undefined;
      return;
    }
    qcData.value = modalApi.getData<OpenData>();
    await gridApi.query();
  },
});
</script>

<template>
  <Modal title="缺陷记录" class="w-3/5">
    <FormModal @success="handleRefresh" />
    <Grid class="mx-4">
      <template v-if="!isReadonly" #toolbar-tools>
        <TableAction
          :actions="[
            {
              auth: ['mes:qc-defect:create'],
              icon: ACTION_ICON.ADD,
              label: '新增缺陷',
              onClick: handleCreate,
              type: 'primary',
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              auth: ['mes:qc-defect:update'],
              icon: ACTION_ICON.EDIT,
              ifShow: !isReadonly,
              label: $t('common.edit'),
              onClick: handleEdit.bind(null, row),
              type: 'link',
            },
            {
              auth: ['mes:qc-defect:delete'],
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: !isReadonly,
              label: $t('common.delete'),
              popConfirm: {
                confirm: handleDelete.bind(null, row),
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
              },
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
