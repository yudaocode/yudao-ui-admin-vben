<!-- 积分活动表格选择器 -->
<script lang="ts" setup>
// TODO @puhui999：看看是不是整体优化下代码风格，参考别的模块
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallPointActivityApi } from '#/api/mall/promotion/point';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Checkbox, Radio } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPointActivityPage } from '#/api/mall/promotion/point';

interface PointTableSelectProps {
  multiple?: boolean;
}

const props = withDefaults(defineProps<PointTableSelectProps>(), {
  multiple: false,
});

const emit = defineEmits<{
  change: [
    value:
      | MallPointActivityApi.PointActivity
      | MallPointActivityApi.PointActivity[],
  ];
}>();

// 单选：选中的活动 ID
const selectedActivityId = ref<number>();
// 多选：选中状态映射
const checkedStatus = ref<Record<number, boolean>>({});
// 多选：选中的活动列表
const checkedActivities = ref<MallPointActivityApi.PointActivity[]>([]);

// 全选状态
const isCheckAll = ref(false);
const isIndeterminate = ref(false);

// 搜索表单配置
const formSchema = computed<VbenFormSchema[]>(() => {
  return [
    {
      fieldName: 'status',
      label: '活动状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择活动状态',
        allowClear: true,
      },
    },
  ];
});

// 列配置
const gridColumns = computed<VxeGridProps['columns']>(() => {
  const columns: VxeGridProps['columns'] = [];

  // 多选模式
  if (props.multiple) {
    columns.push({
      field: 'checkbox',
      title: '',
      width: 55,
      align: 'center',
      slots: { default: 'checkbox-column', header: 'checkbox-header' },
    });
  } else {
    // 单选模式
    columns.push({
      field: 'radio',
      title: '#',
      width: 55,
      align: 'center',
      slots: { default: 'radio-column' },
    });
  }

  columns.push(
    {
      field: 'id',
      title: '活动编号',
      minWidth: 80,
    },
    {
      field: 'picUrl',
      title: '商品图片',
      minWidth: 80,
      cellRender: {
        name: 'CellImage',
        props: {
          height: 40,
        },
      },
    },
    {
      field: 'spuName',
      title: '商品标题',
      minWidth: 300,
    },
    {
      field: 'marketPrice',
      title: '原价',
      minWidth: 100,
      formatter: 'formatAmount',
    },
    {
      field: 'status',
      title: '活动状态',
      minWidth: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: {
          type: DICT_TYPE.COMMON_STATUS,
        },
      },
    },
    {
      field: 'stock',
      title: '库存',
      minWidth: 80,
      align: 'center',
    },
    {
      field: 'totalStock',
      title: '总库存',
      minWidth: 80,
      align: 'center',
    },
    {
      field: 'redeemedQuantity',
      title: '已兑换数量',
      minWidth: 100,
      align: 'center',
      formatter: ({ row }) => (row.totalStock || 0) - (row.stock || 0),
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
  );

  return columns;
});

// 初始化表格
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema.value,
  },
  gridOptions: {
    columns: gridColumns.value,
    height: 500,
    border: true,
    showOverflow: true,
    proxyConfig: {
      ajax: {
        async query({ page }: any, formValues: any) {
          try {
            const params: any = {
              pageNo: page.currentPage,
              pageSize: page.pageSize,
            };
            if (formValues.status !== undefined) {
              params.status = formValues.status;
            }
            const data = await getPointActivityPage(params);
            const list = data.list || [];

            // 初始化 checkbox 绑定
            list.forEach(
              (activityVO) =>
                (checkedStatus.value[activityVO.id] =
                  checkedStatus.value[activityVO.id] || false),
            );

            // 计算全选框状态
            calculateIsCheckAll(list);

            return {
              items: list,
              total: data.total || 0,
            };
          } catch (error) {
            console.error('加载积分活动数据失败:', error);
            return { items: [], total: 0 };
          }
        },
      },
    },
  },
});

/**
 * 单选：处理选中
 */
function handleSingleSelected(row: MallPointActivityApi.PointActivity) {
  selectedActivityId.value = row.id;
  emit('change', row);
  modalApi.close();
}

/**
 * 多选：全选/全不选
 */
function handleCheckAll(e: any) {
  const checked = e.target.checked;
  isCheckAll.value = checked;
  isIndeterminate.value = false;

  const list = gridApi.grid.getData();
  list.forEach((pointActivity) =>
    handleCheckOne(checked, pointActivity, false),
  );
}

/**
 * 多选：选中一行
 */
function handleCheckOne(
  checked: boolean,
  pointActivity: MallPointActivityApi.PointActivity,
  isCalcCheckAll: boolean,
) {
  if (checked) {
    checkedActivities.value.push(pointActivity);
    checkedStatus.value[pointActivity.id] = true;
  } else {
    const index = findCheckedIndex(pointActivity);
    if (index > -1) {
      checkedActivities.value.splice(index, 1);
      checkedStatus.value[pointActivity.id] = false;
      isCheckAll.value = false;
    }
  }

  // 计算全选框状态
  if (isCalcCheckAll) {
    const list = gridApi.grid.getData();
    calculateIsCheckAll(list);
  }
}

/**
 * 查找活动在已选中列表中的索引
 */
function findCheckedIndex(activityVO: MallPointActivityApi.PointActivity) {
  return checkedActivities.value.findIndex((item) => item.id === activityVO.id);
}

/**
 * 计算全选框状态
 */
function calculateIsCheckAll(list: MallPointActivityApi.PointActivity[]) {
  isCheckAll.value = list.every(
    (activityVO) => checkedStatus.value[activityVO.id],
  );
  isIndeterminate.value =
    !isCheckAll.value &&
    list.some((activityVO) => checkedStatus.value[activityVO.id]);
}

/**
 * 多选：确认选择
 */
function handleConfirm() {
  emit('change', [...checkedActivities.value]);
  modalApi.close();
}

/**
 * 打开对话框
 */
function open(pointList?: MallPointActivityApi.PointActivity[]) {
  // 重置
  checkedActivities.value = [];
  checkedStatus.value = {};
  isCheckAll.value = false;
  isIndeterminate.value = false;

  // 处理已选中
  if (pointList && pointList.length > 0) {
    checkedActivities.value = [...pointList];
    checkedStatus.value = Object.fromEntries(
      pointList.map((activityVO) => [activityVO.id, true]),
    );
  }

  modalApi.open();
}

// 暴露 open 方法
defineExpose({ open });

// 初始化弹窗
const [Modal, modalApi] = useVbenModal({
  onConfirm: props.multiple ? handleConfirm : undefined,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 关闭时清理状态
      if (!props.multiple) {
        selectedActivityId.value = undefined;
      }
      return;
    }

    // 打开时触发查询
    await gridApi.query();
  },
});
</script>

<template>
  <Modal class="w-[70%]" title="选择活动">
    <Grid>
      <!-- 多选：表头 checkbox -->
      <template v-if="props.multiple" #checkbox-header>
        <Checkbox
          v-model:checked="isCheckAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAll"
        />
      </template>

      <!-- 多选：行 checkbox -->
      <template v-if="props.multiple" #checkbox-column="{ row }">
        <Checkbox
          v-model:checked="checkedStatus[row.id]"
          @change="(e: any) => handleCheckOne(e.target.checked, row, true)"
        />
      </template>

      <!-- 单选：行 radio -->
      <template v-if="!props.multiple" #radio-column="{ row }">
        <Radio
          :checked="selectedActivityId === row.id"
          :value="row.id"
          class="cursor-pointer"
          @click="handleSingleSelected(row)"
        />
      </template>
    </Grid>
  </Modal>
</template>
