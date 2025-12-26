<script lang="ts" setup>
import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { BpmProcessListenerApi } from '#/api/bpm/processListener';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProcessListenerPage } from '#/api/bpm/processListener';

import { useGridColumns } from './data';

defineOptions({ name: 'ProcessListenerSelectModal' });

const emit = defineEmits<{
  select: [listener: BpmProcessListenerApi.ProcessListener];
}>();

// 查询参数
const queryParams = ref({
  type: '',
  status: CommonStatusEnum.ENABLE,
});

// 配置 VxeGrid
const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    showOverflow: true,
    minHeight: 300,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getProcessListenerPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type: queryParams.value.type,
            status: queryParams.value.status,
          });
        },
      },
    } as VxeGridPropTypes.ProxyConfig,
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

// 配置 Modal
const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      queryParams.value.type = '';
      return;
    }
    const data = modalApi.getData<{ type: string }>();
    if (data?.type) {
      queryParams.value.type = data.type;
    }
  },
  destroyOnClose: true,
});

// 选择监听器
function handleSelect(row: BpmProcessListenerApi.ProcessListener) {
  emit('select', row);
  modalApi.close();
}
</script>

<template>
  <Modal class="w-4/5" title="请选择监听器">
    <Grid>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '选择',
              type: 'primary',
              link: true,
              icon: 'lucide:pointer',
              onClick: handleSelect.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
