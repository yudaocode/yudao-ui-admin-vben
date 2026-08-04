<script lang="ts" setup>
import type { HrmSalarySlipApi } from '#/api/hrm/salary/slip';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElTable, ElTableColumn } from 'element-plus';

import { getSalarySlip } from '#/api/hrm/salary/slip';
import { formatHrmMoney } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmSalarySlipDetail' });

const loading = ref(false);
const detail = ref<HrmSalarySlipApi.SalarySlip>({});

function getOptionRowKey(option: HrmSalarySlipApi.SlipOption) {
  return option.code === undefined
    ? `category-${option.sort}`
    : `option-${option.code}`;
}

/** 去掉空 children，避免叶子节点误显示展开按钮 */
function normalizeSlipOptions(
  options?: HrmSalarySlipApi.SlipOption[],
): HrmSalarySlipApi.SlipOption[] {
  return (options || []).map((option) => {
    const children = option.children?.length
      ? normalizeSlipOptions(option.children)
      : undefined;
    return { ...option, children };
  });
}

const [Modal, modalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      detail.value = {};
    }
  },
  title: '工资条明细',
});

async function open(id?: number) {
  if (!id) {
    return;
  }
  modalApi.open();
  loading.value = true;
  detail.value = {};
  try {
    const data = await getSalarySlip(id);
    detail.value = {
      ...data,
      options: normalizeSlipOptions(data.options),
    };
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[600px]">
    <div v-loading="loading" class="min-h-[320px]">
      <div class="mb-5 text-center">
        <div class="text-2xl font-semibold">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </div>
        <div class="text-muted-foreground mt-2 text-sm">实发金额（元）</div>
      </div>
      <ElTable
        border
        default-expand-all
        size="small"
        :data="detail.options || []"
        :row-key="getOptionRowKey"
      >
        <ElTableColumn label="项目" min-width="180" prop="name" />
        <ElTableColumn align="right" label="金额" width="150">
          <template #default="{ row }">
            {{ row.children?.length ? '-' : formatHrmMoney(row.value) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </Modal>
</template>
