<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmBusinessApi } from '#/api/crm/business';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBusinessPageByCustomer } from '#/api/crm/business';
import { $t } from '#/locales';

import { useDetailListColumns } from './detail-data';
import Form from './form.vue';

const props = defineProps<{
  customerId?: number; // 关联联系人与商机时，需要传入 customerId 进行筛选
}>();

const emit = defineEmits(['success']);

const { push } = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const checkedRows = ref<CrmBusinessApi.Business[]>([]);
function setCheckedRows({ records }: { records: CrmBusinessApi.Business[] }) {
  checkedRows.value = records;
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建商机 */
function handleCreate() {
  formModalApi.setData({ customerId: props.customerId }).open();
}

/** 查看商机详情 */
function handleDetail(row: CrmBusinessApi.Business) {
  push({ name: 'CrmBusinessDetail', params: { id: row.id } });
}

/** 查看客户详情 */
function handleCustomerDetail(row: CrmBusinessApi.Business) {
  push({ name: 'CrmCustomerDetail', params: { id: row.customerId } });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (checkedRows.value.length === 0) {
      message.error('请先选择商机后操作！');
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      const businessIds = checkedRows.value.map((item) => item.id);
      // 关闭并提示
      await modalApi.close();
      emit('success', businessIds, checkedRows.value);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<any>();
    if (!data) {
      return;
    }
    modalApi.lock();
    try {
      // 设置到 values
      // await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        fieldName: 'name',
        label: '商机名称',
        component: 'Input',
      },
    ],
  },
  gridOptions: {
    columns: useDetailListColumns(),
    height: 600,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getBusinessPageByCustomer({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            customerId: props.customerId,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<CrmBusinessApi.Business>,
  gridEvents: {
    checkboxAll: setCheckedRows,
    checkboxChange: setCheckedRows,
  },
});
</script>

<template>
  <Modal title="关联商机" class="w-2/5">
    <FormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['商机']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['crm:business:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #name="{ row }">
        <Button type="link" @click="handleDetail(row)">
          {{ row.name }}
        </Button>
      </template>
      <template #customerName="{ row }">
        <Button type="link" @click="handleCustomerDetail(row)">
          {{ row.customerName }}
        </Button>
      </template>
    </Grid>
  </Modal>
</template>
