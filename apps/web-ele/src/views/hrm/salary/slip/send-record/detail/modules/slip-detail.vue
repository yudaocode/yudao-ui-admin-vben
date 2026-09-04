<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipApi } from '#/api/hrm/salary/slip';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalarySlip } from '#/api/hrm/salary/slip';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import { useSlipOptionGridColumns } from '../../data';

defineOptions({ name: 'HrmSalarySlipDetail' });

const detail = ref<HrmSalarySlipApi.SalarySlip>({});

function getOptionRowKey(option: HrmSalarySlipApi.SlipOption) {
  return option.code === undefined
    ? `category-${option.sort}`
    : `option-${option.code}`;
}

/** 补充树节点 key，并去掉叶子节点的空 children */
function normalizeSlipOptions(options?: HrmSalarySlipApi.SlipOption[]): any[] {
  return (options || []).map((option) => ({
    ...option,
    key: getOptionRowKey(option),
    children: option.children?.length
      ? normalizeSlipOptions(option.children)
      : undefined,
  }));
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useSlipOptionGridColumns(),
    data: [],
    minHeight: 260,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'key', isHover: true },
    toolbarConfig: { enabled: false },
    treeConfig: { childrenField: 'children', expandAll: true },
  } as VxeTableGridOptions<any>,
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      detail.value = {};
      return;
    }
    const { id } = modalApi.getData() as any;
    if (!id) return;
    modalApi.lock();
    try {
      const data = await getSalarySlip(id);
      const options = normalizeSlipOptions(data.options);
      detail.value = { ...data, options };
      await gridApi.grid.reloadData(options);
      await gridApi.grid.setAllTreeExpand(true);
    } finally {
      modalApi.unlock();
    }
  },
  title: '工资条明细',
});
</script>

<template>
  <Modal class="w-[600px]">
    <div class="min-h-[320px]">
      <div class="mb-5 text-center">
        <div class="text-2xl font-semibold">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </div>
        <div class="text-muted-foreground mt-2 text-sm">实发金额（元）</div>
      </div>
      <Grid class="w-full" />
    </div>
  </Modal>
</template>
