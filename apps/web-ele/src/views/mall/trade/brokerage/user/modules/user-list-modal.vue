<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBrokerageUserPage } from '#/api/mall/trade/brokerage/user';
import { getRangePickerDefaultProps } from '#/utils';

defineOptions({ name: 'BrokerageUserListModal' });

const bindUserId = ref<number>();

const [Modal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      bindUserId.value = undefined;
      return;
    }
    const data = modalApi.getData<MallBrokerageUserApi.BrokerageUser>();
    if (!data || !data.id) {
      return;
    }
    bindUserId.value = data.id;
    // 等待弹窗打开后再查询
    setTimeout(() => {
      gridApi.query();
    }, 100);
  },
});

/** 搜索表单配置 */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'level',
      label: '用户类型',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '全部', value: undefined },
          { label: '一级推广人', value: '1' },
          { label: '二级推广人', value: '2' },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'bindUserTime',
      label: '绑定时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
function useColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '用户编号',
      minWidth: 80,
    },
    {
      field: 'avatar',
      title: '头像',
      minWidth: 70,
      cellRender: {
        name: 'CellImage',
        props: {
          width: 24,
          height: 24,
          shape: 'circle',
        },
      },
    },
    {
      field: 'nickname',
      title: '昵称',
      minWidth: 80,
    },
    {
      field: 'brokerageUserCount',
      title: '推广人数',
      minWidth: 80,
    },
    {
      field: 'brokerageOrderCount',
      title: '推广订单数量',
      minWidth: 110,
    },
    {
      field: 'brokerageEnabled',
      title: '推广资格',
      minWidth: 80,
      slots: { default: 'brokerageEnabled' },
    },
    {
      field: 'bindUserTime',
      title: '绑定时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useFormSchema(),
  },
  gridOptions: {
    columns: useColumns(),
    height: '600',
    keepSource: true,
    showOverflow: 'tooltip',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getBrokerageUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            bindUserId: bindUserId.value,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MallBrokerageUserApi.BrokerageUser>,
});
</script>

<template>
  <Modal title="推广人列表" class="w-3/5">
    <Grid table-title="推广人列表">
      <template #brokerageEnabled="{ row }">
        <ElTag v-if="row.brokerageEnabled" color="success">有</ElTag>
        <ElTag v-else>无</ElTag>
      </template>
    </Grid>
  </Modal>
</template>
