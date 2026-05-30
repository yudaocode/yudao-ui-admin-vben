<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcDefectRecordApi } from '#/api/mes/qc/defectrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDefectRecord,
  getDefectRecordPage,
} from '#/api/mes/qc/defectrecord';
import { $t } from '#/locales';

import { useDefectRecordInlineGridColumns } from './data';
import DefectRecordInlineForm from './inline-form.vue';

defineOptions({ name: 'DefectRecordInlineList' });

const emit = defineEmits(['success']);

/** 表单类型：父级检验单的模式（detail 时弹窗只读） */
type FormType = 'create' | 'detail' | 'update';

interface CtxData {
  formType?: FormType;
  lineId: number;
  qcId: number;
  qcType: number;
}

const ctxData = ref<CtxData>();
const isReadonly = computed(() => ctxData.value?.formType === 'detail');

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
  if (!ctxData.value) {
    return;
  }
  formModalApi
    .setData({
      formType: 'create',
      lineId: ctxData.value.lineId,
      qcId: ctxData.value.qcId,
      qcType: ctxData.value.qcType,
    })
    .open();
}

/** 编辑缺陷 */
function handleEdit(row: MesQcDefectRecordApi.DefectRecord) {
  if (!ctxData.value) {
    return;
  }
  formModalApi
    .setData({
      formType: 'update',
      id: row.id,
      lineId: ctxData.value.lineId,
      qcId: ctxData.value.qcId,
      qcType: ctxData.value.qcType,
    })
    .open();
}

/** 删除缺陷 */
async function handleDelete(row: MesQcDefectRecordApi.DefectRecord) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteDefectRecord(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDefectRecordInlineGridColumns(),
    height: 320,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!ctxData.value) {
            return { list: [], total: 0 };
          }
          return await getDefectRecordPage({
            lineId: ctxData.value.lineId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            qcId: ctxData.value.qcId,
            qcType: ctxData.value.qcType,
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
      ctxData.value = undefined;
      return;
    }
    ctxData.value = modalApi.getData<CtxData>();
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
              link: true,
              onClick: handleEdit.bind(null, row),
              type: 'primary',
            },
            {
              auth: ['mes:qc-defect:delete'],
              icon: ACTION_ICON.DELETE,
              ifShow: !isReadonly,
              label: $t('common.delete'),
              link: true,
              popConfirm: {
                confirm: handleDelete.bind(null, row),
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
              },
              type: 'danger',
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
