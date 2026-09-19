<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaVehicleApplyApi } from '#/api/oa/vehicle/apply';

import { nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getVehicleApply,
  getVehicleApplyPage,
} from '#/api/oa/vehicle/apply';

defineOptions({ name: 'OaVehicleApplySelect' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean; // 是否禁用
    modelValue?: number; // 用车申请编号
    placeholder?: string; // 占位文本
    returnStatus?: number; // 还车状态，由调用方限定可选范围
    status?: number; // 审批状态，由调用方限定可选范围
  }>(),
  {
    modelValue: undefined,
    status: undefined,
    returnStatus: undefined,
    disabled: false,
    placeholder: '请选择用车申请单',
  },
);

const emit = defineEmits<{
  change: [item: OaVehicleApplyApi.VehicleApply | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const open = ref(false); // 选择申请弹窗是否打开
const selectedItem = ref<OaVehicleApplyApi.VehicleApply>(); // 当前选中的申请
const selectedRow = ref<OaVehicleApplyApi.VehicleApply>(); // 弹窗中选中的申请

/** 搜索表单 */
function useSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'vehicleNo',
      label: '车辆',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入车牌号',
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
      title: '单据编号',
      minWidth: 200,
    },
    {
      field: 'vehicleNo',
      title: '车牌号',
      width: 120,
    },
    {
      field: 'reason',
      title: '用车事由',
      minWidth: 160,
    },
    {
      field: 'startTime',
      title: '出车时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '回车时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'userName',
      title: '申请人',
      width: 120,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 140,
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
          return await getVehicleApplyPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: props.status,
            returnStatus: props.returnStatus,
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
  } as VxeTableGridOptions<OaVehicleApplyApi.VehicleApply>,
  gridEvents: {
    radioChange: ({ row }: { row: OaVehicleApplyApi.VehicleApply }) => {
      selectedRow.value = row;
    },
  },
});

/** 打开选择弹窗，重置搜索条件和页码，恢复当前申请选择 */
async function openSelect() {
  if (props.disabled) {
    return;
  }
  selectedRow.value = selectedItem.value;
  open.value = true;
  await nextTick();
  await gridApi.formApi.reset();
  // 同步清空后的查询条件，并回到第一页
  await gridApi.formApi.submit();
}

/** 确认选择 */
function handleOk() {
  if (!selectedRow.value) {
    message.warning('请选择用车申请单');
    return;
  }
  selectedItem.value = selectedRow.value;
  emit('update:modelValue', selectedRow.value.id);
  emit('change', selectedRow.value);
  open.value = false;
}

/** 清空选择 */
function handleClear() {
  selectedItem.value = undefined;
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 根据申请编号回显 */
watch(
  () => props.modelValue,
  async (id) => {
    if (id == null) {
      selectedItem.value = undefined;
    } else if (selectedItem.value?.id !== id) {
      selectedItem.value = undefined;
      const item = await getVehicleApply(id);
      // 编辑对象切换时，不回填上一次请求的结果
      if (props.modelValue === id) {
        selectedItem.value = item;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="w-full">
    <Input
      readonly
      :value="selectedItem ? `${selectedItem.no} / ${selectedItem.vehicleNo}` : ''"
      :placeholder="placeholder"
      :disabled="disabled"
      @click="openSelect"
    >
      <template #suffix>
        <IconifyIcon
          v-if="!disabled && modelValue != null"
          class="cursor-pointer"
          icon="ant-design:close-circle-outlined"
          @click.stop="handleClear"
        />
        <IconifyIcon v-else icon="ant-design:search-outlined" />
      </template>
    </Input>
    <Modal
      v-model:open="open"
      title="选择用车申请单"
      width="80%"
      :ok-button-props="{ disabled: !selectedRow }"
      @cancel.stop="open = false"
      @ok.stop="handleOk"
    >
      <Grid table-title="用车申请列表" />
    </Modal>
  </div>
</template>
