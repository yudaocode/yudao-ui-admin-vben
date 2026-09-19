<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaVehicleApi } from '#/api/oa/vehicle';

import { nextTick, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAvailableVehiclePage } from '#/api/oa/vehicle/apply';

defineOptions({ name: 'OaVehicleSelectDialog' });

const emit = defineEmits<{
  selected: [item: OaVehicleApi.Vehicle];
}>();

const open = ref(false); // 弹窗是否打开
const selectedItem = ref<OaVehicleApi.Vehicle>(); // 当前选中的车辆，翻页时保留

/** 搜索表单 */
function useSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '车牌号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车牌号',
      },
    },
    {
      fieldName: 'brandModel',
      label: '品牌型号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入品牌型号',
      },
    },
    {
      fieldName: 'type',
      label: '车型',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车型',
      },
    },
    {
      fieldName: 'category',
      label: '车辆分类',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_VEHICLE_CATEGORY, 'string'),
        allowClear: true,
        placeholder: '请选择车辆分类',
      },
    },
  ];
}

/** 表格列配置 */
function useSelectGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'radio',
      title: '选择',
      width: 60,
      align: 'center',
    },
    {
      field: 'no',
      title: '车牌号',
      minWidth: 130,
    },
    {
      field: 'name',
      title: '车辆名称',
      minWidth: 160,
    },
    {
      field: 'brandModel',
      title: '品牌型号',
      minWidth: 150,
    },
    {
      field: 'type',
      title: '车型',
      minWidth: 100,
    },
    {
      field: 'category',
      title: '车辆分类',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_VEHICLE_CATEGORY },
      },
    },
    {
      field: 'seatCount',
      title: '座位数',
      width: 90,
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useSelectGridColumns(),
    height: 520,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAvailableVehiclePage({
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
    radioConfig: {
      trigger: 'row',
      highlight: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaVehicleApi.Vehicle>,
  gridEvents: {
    radioChange: ({ row }: { row: OaVehicleApi.Vehicle }) => {
      selectedItem.value = row;
    },
  },
});

/** 恢复已选车辆的行选中，仅当该车位于当前页 */
async function applyPreSelection() {
  const id = selectedItem.value?.id;
  if (id === undefined) {
    return;
  }
  const rows = gridApi.grid.getData() as OaVehicleApi.Vehicle[];
  const row = rows.find((item) => item.id === id);
  if (row) {
    await gridApi.grid.setRadioRow(row);
  }
}

/** 打开弹窗，重置搜索条件和页码，恢复当前车辆选择 */
async function openDialog(item?: OaVehicleApi.Vehicle) {
  selectedItem.value = item;
  open.value = true;
  await nextTick();
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.reset();
  await gridApi.query();
  await applyPreSelection();
}

/** 确认选择 */
function handleConfirm() {
  if (!selectedItem.value) {
    return;
  }
  emit('selected', selectedItem.value);
  open.value = false;
}

defineExpose({ open: openDialog }); // 提供 open 方法，用于打开弹窗
</script>

<template>
  <Modal
    v-model:open="open"
    title="选择车辆"
    width="1200px"
    :ok-button-props="{ disabled: !selectedItem }"
    @cancel.stop="open = false"
    @ok.stop="handleConfirm"
  >
    <Grid table-title="车辆列表" />
  </Modal>
</template>
