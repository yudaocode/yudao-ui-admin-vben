<script lang="ts" setup>
import type { HrmSalarySlipApi } from '#/api/hrm/salary/slip';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Spin, Table } from 'antdv-next';

import { getSalarySlip } from '#/api/hrm/salary/slip';
import { formatHrmMoney } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmSalarySlipDetail' });

const loading = ref(false);
const detail = ref<HrmSalarySlipApi.SalarySlip>({});
const expandedRowKeys = ref<string[]>([]);

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

function collectExpandedKeys(
  options?: HrmSalarySlipApi.SlipOption[],
): string[] {
  const keys: string[] = [];
  for (const option of options || []) {
    if (option.children?.length) {
      keys.push(
        getOptionRowKey(option),
        ...collectExpandedKeys(option.children),
      );
    }
  }
  return keys;
}

const [Modal, modalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      detail.value = {};
      expandedRowKeys.value = [];
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
  expandedRowKeys.value = [];
  try {
    const data = await getSalarySlip(id);
    const options = normalizeSlipOptions(data.options);
    detail.value = { ...data, options };
    expandedRowKeys.value = collectExpandedKeys(options);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[600px]">
    <Spin :spinning="loading">
      <div class="min-h-[320px]">
        <div class="mb-5 text-center">
          <div class="text-2xl font-semibold">
            {{ formatHrmMoney(detail.realPaySalary) }}
          </div>
          <div class="text-muted-foreground mt-2 text-sm">实发金额（元）</div>
        </div>
        <Table
          v-model:expanded-row-keys="expandedRowKeys"
          bordered
          size="small"
          :columns="[
            { title: '项目', dataIndex: 'name', key: 'name' },
            { title: '金额', key: 'value', align: 'right', width: 150 },
          ]"
          :data-source="detail.options || []"
          :pagination="false"
          :row-key="getOptionRowKey"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'value'">
              {{ record.children?.length ? '-' : formatHrmMoney(record.value) }}
            </template>
          </template>
        </Table>
      </div>
    </Spin>
  </Modal>
</template>
