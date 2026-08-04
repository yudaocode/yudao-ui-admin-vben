<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipApi } from '#/api/hrm/salary/slip';

import { ref } from 'vue';

import { confirm, prompt } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getSalarySlipPage,
  updateSalarySlipRemark,
} from '#/api/hrm/salary/slip';
import { executeBatch } from '#/views/hrm/utils/batch';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import SlipDetail from './slip-detail.vue';

defineOptions({ name: 'HrmSalarySlipList' });

const props = defineProps<{ sendRecordId: number }>();

const checkedRows = ref<HrmSalarySlipApi.SalarySlip[]>([]);
const slipDetailRef = ref<InstanceType<typeof SlipDetail>>();

function handleRowCheckboxChange({
  records,
}: {
  records: HrmSalarySlipApi.SalarySlip[];
}) {
  checkedRows.value = records;
}

async function handleBatchRemark(clear: boolean) {
  let remark = '';
  try {
    if (clear) {
      await confirm('确认清除所选工资条的备注？');
    } else {
      const result = await prompt({
        content: '请输入备注',
        title: '编辑备注',
      });
      remark = result || '';
      if (remark.length > 500) {
        message.warning('备注不能超过 500 个字符');
        return;
      }
    }
    const success = await executeBatch(
      checkedRows.value
        .filter(
          (item): item is HrmSalarySlipApi.SalarySlip & { id: number } =>
            !!item.id,
        )
        .map((item) => updateSalarySlipRemark({ id: item.id, remark })),
    );
    if (success) {
      await gridApi.query();
    }
  } catch {}
}

function openDetail(id?: number) {
  slipDetailRef.value?.open(id);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        fieldName: 'search',
        label: '员工',
        component: 'Input',
        componentProps: {
          allowClear: true,
          placeholder: '请输入员工姓名或工号',
        },
      },
      {
        fieldName: 'deptId',
        label: '部门',
        component: 'ApiTreeSelect',
        componentProps: {
          allowClear: true,
          api: async () => {
            const { getSimpleDeptList } = await import('#/api/system/dept');
            const { handleTree } = await import('@vben/utils');
            return handleTree(await getSimpleDeptList());
          },
          labelField: 'name',
          valueField: 'id',
          childrenField: 'children',
          placeholder: '请选择部门',
          treeDefaultExpandAll: true,
        },
      },
      {
        fieldName: 'readStatus',
        label: '查看状态',
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: getDictOptions(
            DICT_TYPE.HRM_SALARY_SLIP_READ_STATUS,
            'number',
          ),
          placeholder: '请选择查看状态',
        },
      },
      {
        fieldName: 'remark',
        label: '备注',
        component: 'Input',
        componentProps: {
          allowClear: true,
          placeholder: '请输入备注',
        },
      },
    ],
    submitOnEnter: true,
  },
  gridOptions: {
    columns: [
      { type: 'checkbox' as const, width: 50, fixed: 'left' },
      {
        field: 'employeeName',
        title: '员工姓名',
        minWidth: 130,
        showOverflow: true,
      },
      {
        field: 'jobNumber',
        title: '工号',
        minWidth: 120,
        showOverflow: true,
      },
      {
        field: 'deptName',
        title: '部门',
        minWidth: 140,
        showOverflow: true,
      },
      {
        field: 'postName',
        title: '岗位',
        minWidth: 140,
        showOverflow: true,
      },
      {
        field: 'mobile',
        title: '手机号',
        width: 130,
      },
      {
        field: 'readStatus',
        title: '查看状态',
        width: 110,
        align: 'center',
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.HRM_SALARY_SLIP_READ_STATUS },
        },
      },
      {
        field: 'realPaySalary',
        title: '实发工资',
        width: 130,
        align: 'right',
        formatter: ({ cellValue }) => formatHrmMoney(cellValue),
      },
      {
        field: 'remark',
        title: '备注',
        minWidth: 180,
        showOverflow: true,
      },
      {
        field: 'createTime',
        title: '创建时间',
        width: 180,
        align: 'center',
        formatter: 'formatDateTime',
      },
      {
        field: 'actions',
        title: '操作',
        width: 100,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSalarySlipPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            sendRecordId: props.sendRecordId,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    checkboxConfig: {
      highlight: true,
    },
  } as VxeTableGridOptions<HrmSalarySlipApi.SalarySlip>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <div class="h-full">
    <SlipDetail ref="slipDetailRef" />

    <Grid class="h-full">
      <template #toolbar-tools>
        <div v-if="checkedRows.length" class="mr-2 flex items-center gap-2">
          <span class="text-muted-foreground text-sm">
            已选择 {{ checkedRows.length }} 项
          </span>
          <TableAction
            :actions="[
              {
                label: '编辑备注',
                type: 'primary',
                icon: ACTION_ICON.EDIT,
                auth: ['hrm:salary:slip:update'],
                onClick: () => handleBatchRemark(false),
              },
              {
                label: '清除备注',
                icon: ACTION_ICON.DELETE,
                auth: ['hrm:salary:slip:update'],
                onClick: () => handleBatchRemark(true),
              },
            ]"
          />
        </div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '查看明细',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: () => openDetail(row.id),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
