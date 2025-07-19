<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmBusinessApi } from '#/api/crm/business';
import type { CrmContractApi } from '#/api/crm/contract';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getContractPageByBusiness,
  getContractPageByCustomer,
} from '#/api/crm/contract';
import { BizTypeEnum } from '#/api/crm/permission';
import { $t } from '#/locales';

import { useDetailListColumns } from './detail-data';
import Form from './form.vue';

const props = defineProps<{
  bizId: number; // 业务编号
  bizType: number; // 业务类型
}>();

const { push } = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const checkedRows = ref<CrmContractApi.Contract[]>([]);
function setCheckedRows({ records }: { records: CrmContractApi.Contract[] }) {
  checkedRows.value = records;
}

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建合同 */
function handleCreate() {
  formModalApi
    .setData(
      props.bizType === BizTypeEnum.CRM_CUSTOMER
        ? {
            customerId: props.bizId,
          }
        : { businessId: props.bizId },
    )
    .open();
}

/** 查看合同详情 */
function handleDetail(row: CrmContractApi.Contract) {
  push({ name: 'CrmContractDetail', params: { id: row.id } });
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDetailListColumns(),
    height: 600,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          if (props.bizType === BizTypeEnum.CRM_CUSTOMER) {
            return await getContractPageByCustomer({
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              customerId: props.bizId,
              ...formValues,
            });
          } else if (props.bizType === BizTypeEnum.CRM_CONTACT) {
            return await getContractPageByBusiness({
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              businessId: props.bizId,
              ...formValues,
            });
          } else {
            return [];
          }
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
  <div>
    <FormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['合同']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['crm:contract:create'],
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
    </Grid>
  </div>
</template>
