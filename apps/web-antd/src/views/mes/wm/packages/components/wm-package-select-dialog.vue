<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmPackageApi } from '#/api/mes/wm/packages';

import { nextTick, ref } from 'vue';

import { Alert, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPackagePage } from '#/api/mes/wm/packages';
import { MesWmPackageStatusEnum } from '#/views/mes/utils/constants';

import { useSelectGridColumns, useSelectGridFormSchema } from '../data';

const props = withDefaults(
  defineProps<{
    childableOnly?: boolean; // 只展示可作为子箱的装箱单（无父箱 + 已完成状态）
    excludeId?: number; // 排除的编号（避免选择自己作为父箱）
  }>(),
  {
    childableOnly: false,
    excludeId: undefined,
  },
);

const emit = defineEmits<{
  selected: [rows: MesWmPackageApi.Package[]];
}>();

const open = ref(false); // 弹窗是否打开
const multiple = ref(true); // 是否多选
const syncingSingleSelection = ref(false); // 单选模式同步勾选标记
const selectedRows = ref<MesWmPackageApi.Package[]>([]); // 已选装箱单
const preSelectedIds = ref<number[]>([]); // 预选装箱单编号

/** 单选模式同步 VXE 勾选状态 */
async function syncSingleSelection(row?: MesWmPackageApi.Package) {
  syncingSingleSelection.value = true;
  await nextTick();
  await gridApi.grid.clearCheckboxRow();
  if (row) {
    await gridApi.grid.setCheckboxRow(row, true);
  }
  await nextTick();
  syncingSingleSelection.value = false;
}

/** 处理勾选变化 */
async function handleCheckboxChange({
  checked,
  records,
  row,
}: {
  checked: boolean;
  records: MesWmPackageApi.Package[];
  row?: MesWmPackageApi.Package;
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  if (!multiple.value) {
    const selected = checked && row ? [row] : [];
    selectedRows.value = selected;
    await syncSingleSelection(selected[0]);
    return;
  }
  selectedRows.value = records;
}

/** 处理全选变化 */
function handleCheckboxAll({
  records,
}: {
  records: MesWmPackageApi.Package[];
}) {
  if (syncingSingleSelection.value) {
    return;
  }
  selectedRows.value = records;
}

/** 双击行：单选直接确认；多选切换勾选 */
async function handleRowDblclick({ row }: { row: MesWmPackageApi.Package }) {
  if (multiple.value) {
    const checked = !gridApi.grid.isCheckedByCheckboxRow(row);
    await gridApi.grid.setCheckboxRow(row, checked);
    handleCheckboxChange({
      checked,
      records:
        gridApi.grid.getCheckboxRecords() as MesWmPackageApi.Package[],
      row,
    });
    return;
  }
  selectedRows.value = [row];
  await syncSingleSelection(row);
  handleConfirm();
}

/** 回显预选 */
function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as MesWmPackageApi.Package[];
  for (const row of rows) {
    if (row.id && preSelectedIds.value.includes(row.id)) {
      gridApi.grid.setCheckboxRow(row, true);
      if (!multiple.value) {
        selectedRows.value = [row];
      }
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useSelectGridColumns(),
    height: 480,
    keepSource: true,
    checkboxConfig: {
      highlight: true,
      range: true,
      reserve: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const data = await getPackagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            // childableOnly 模式：固定过滤无父箱 + 已完成状态
            parentId: props.childableOnly ? 0 : undefined,
            status: props.childableOnly
              ? MesWmPackageStatusEnum.FINISHED
              : undefined,
          });
          // 排除指定编号，避免选择自己作为父箱
          const list = props.excludeId
            ? (data.list || []).filter((item) => item.id !== props.excludeId)
            : data.list || [];
          return { list, total: data.total };
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
  } as VxeTableGridOptions<MesWmPackageApi.Package>,
  gridEvents: {
    cellDblclick: handleRowDblclick,
    checkboxAll: handleCheckboxAll,
    checkboxChange: handleCheckboxChange,
  },
});

/** 重置查询和选择状态 */
async function resetQueryState() {
  selectedRows.value = [];
  await gridApi.grid.clearCheckboxRow();
  await gridApi.formApi.resetForm();
}

/** 打开弹窗 */
async function openModal(
  selectedIds?: number[],
  options?: { multiple?: boolean },
) {
  open.value = true;
  multiple.value = options?.multiple ?? true;
  preSelectedIds.value = selectedIds || [];
  await nextTick();
  await resetQueryState();
  await gridApi.query();
  await nextTick();
  applyPreSelection();
}

/** 关闭弹窗 */
async function closeModal() {
  open.value = false;
  await resetQueryState();
}

/** 确认选择 */
function handleConfirm() {
  if (selectedRows.value.length === 0) {
    message.warning(multiple.value ? '请至少选择一条数据' : '请选择一条数据');
    return;
  }
  emit(
    'selected',
    multiple.value ? selectedRows.value : [selectedRows.value[0]!],
  );
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    v-model:open="open"
    :destroy-on-close="true"
    title="装箱单选择"
    width="80%"
    @cancel="closeModal"
    @ok="handleConfirm"
  >
    <Alert
      v-if="childableOnly"
      class="mb-3"
      message="仅展示可作为子箱的装箱单（无父箱 + 已完成）"
      show-icon
      type="info"
    />
    <Grid table-title="装箱单列表" />
  </Modal>
</template>
