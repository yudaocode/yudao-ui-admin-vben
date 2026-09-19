<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelApplyApi } from '#/api/oa/travel/apply';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Radio } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getApprovedTravelApplyList } from '#/api/oa/travel/apply';

import { useApplySelectGridColumns, useApplySelectGridFormSchema } from '../data';

defineOptions({ name: 'OaTravelApplySelectModal' });

const emit = defineEmits<{
  select: [apply: OaTravelApplyApi.TravelApply];
}>();

const selectedId = ref<number>(); // 选中申请编号
const selectedApply = ref<OaTravelApplyApi.TravelApply>(); // 待确认的申请，取消不修改主表单

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useApplySelectGridFormSchema(),
  },
  gridOptions: {
    columns: useApplySelectGridColumns(),
    height: 440,
    keepSource: true,
    proxyConfig: {
      ajax: {
        // 每次查询重新拉取本人已审批通过的申请，本地过滤并按页截取
        query: async ({ page }, formValues) => {
          const applyList = await getApprovedTravelApplyList();
          const filteredList = applyList.filter(
            (item) =>
              (!formValues.no || (item.no || '').includes(formValues.no)) &&
              (!formValues.reason ||
                (item.reason || '').includes(formValues.reason)) &&
              (formValues.reimburseStatus === undefined ||
                formValues.reimburseStatus === null ||
                formValues.reimburseStatus === item.reimburseStatus),
          );
          const start = (page.currentPage - 1) * page.pageSize;
          return {
            list: filteredList.slice(start, start + page.pageSize),
            total: filteredList.length,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isCurrent: true,
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaTravelApplyApi.TravelApply>,
  gridEvents: {
    cellClick: ({ row }: { row: OaTravelApplyApi.TravelApply }) =>
      handleSelect(row),
    cellDblclick: ({ row }: { row: OaTravelApplyApi.TravelApply }) =>
      handleConfirmRow(row),
  },
});

/** 选中申请 */
function handleSelect(row: OaTravelApplyApi.TravelApply) {
  selectedId.value = row.id;
  selectedApply.value = row;
}

/** 双击申请直接确认 */
function handleConfirmRow(row: OaTravelApplyApi.TravelApply) {
  handleSelect(row);
  onConfirm();
}

/** 确认选择 */
function onConfirm() {
  if (!selectedApply.value) {
    message.warning('请选择出差申请单');
    return;
  }
  emit('select', selectedApply.value);
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  onConfirm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      selectedId.value = undefined;
      selectedApply.value = undefined;
      return;
    }
    // 回显原有选择
    const data = modalApi.getData() as { id?: number };
    selectedId.value = data?.id;
    selectedApply.value = undefined;
    modalApi.lock();
    try {
      if (selectedId.value) {
        const applyList = await getApprovedTravelApplyList();
        selectedApply.value = applyList.find(
          (item) => item.id === selectedId.value,
        );
      }
      await nextTick();
      await gridApi.query();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="选择出差申请单" class="w-[1100px]">
    <Grid>
      <template #radioSelect="{ row }">
        <Radio
          :checked="selectedId === row.id"
          :aria-label="`选择 ${ row.no}`"
          @change="handleSelect(row)"
        />
      </template>
    </Grid>
  </Modal>
</template>
