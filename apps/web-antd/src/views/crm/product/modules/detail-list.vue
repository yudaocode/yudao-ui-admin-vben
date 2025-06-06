<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmBusinessApi } from '#/api/crm/business';
import type { CrmContractApi } from '#/api/crm/contract';
import type { CrmProductApi } from '#/api/crm/product';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { BizTypeEnum } from '#/api/crm/permission';
import { erpPriceInputFormatter } from '#/utils';

import { useDetailListColumns } from '../data';

const props = defineProps<{
  bizType: BizTypeEnum;
  business?: CrmBusinessApi.Business; // 商机
  contract?: CrmContractApi.Contract; // 合同
}>();

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useDetailListColumns(props.bizType === BizTypeEnum.CRM_BUSINESS),
    data:
      props.bizType === BizTypeEnum.CRM_BUSINESS
        ? props.business?.products
        : props.contract?.products,
    height: 600,
    pagerConfig: {
      enabled: false,
    },
    keepSource: true,
    rowConfig: {
      keyField: 'id',
    },
  } as VxeTableGridOptions<CrmProductApi.Product>,
});
</script>

<template>
  <div>
    <Grid />
    <div class="flex justify-end">
      <span class="font-bold text-red-500">
        整单折扣：{{
          erpPriceInputFormatter(
            business ? business.discountPercent : contract?.discountPercent,
          )
        }}%
      </span>
      <span class="ml-4 font-bold text-red-500">
        产品总金额：{{
          erpPriceInputFormatter(
            business ? business.totalProductPrice : contract?.totalProductPrice,
          )
        }}
        元
      </span>
    </div>
  </div>
</template>
