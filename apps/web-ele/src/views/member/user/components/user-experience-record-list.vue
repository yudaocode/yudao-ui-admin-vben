<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MemberExperienceRecordApi } from '#/api/member/experience-record';

import { h } from 'vue';

import { ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getExperienceRecordPage } from '#/api/member/experience-record';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const props = defineProps<{
  userId: number;
}>();

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        fieldName: 'bizType',
        label: '业务类型',
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: getDictOptions(
            DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE,
            'number',
          ),
        },
      },
      {
        fieldName: 'title',
        label: '标题',
        component: 'Input',
      },
      {
        fieldName: 'createDate',
        label: '获得时间',
        component: 'RangePicker',
        componentProps: {
          ...getRangePickerDefaultProps(),
          allowClear: true,
        },
      },
    ],
  },
  gridOptions: {
    columns: [
      {
        field: 'id',
        title: '编号',
      },
      {
        field: 'createTime',
        title: '获得时间',
        formatter: 'formatDateTime',
      },
      {
        field: 'experience',
        title: '经验',
        slots: {
          default: ({ row }) => {
            return h(
              ElTag,
              {
                class: 'mr-1',
                color: row.experience > 0 ? 'blue' : 'red',
              },
              () =>
                row.experience > 0 ? `+${row.experience}` : row.experience,
            );
          },
        },
      },
      {
        field: 'totalExperience',
        title: '总经验',
      },
      {
        field: 'title',
        title: '标题',
      },
      {
        field: 'description',
        title: '描述',
      },
      {
        field: 'bizId',
        title: '业务编号',
      },
      {
        field: 'bizType',
        title: '业务类型',
        cellRender: {
          name: 'CellDict',
          props: { type: DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE },
        },
      },
    ],
    keepSource: true,
    pagerConfig: {
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getExperienceRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            userId: props.userId,
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
  } as VxeTableGridOptions<MemberExperienceRecordApi.ExperienceRecord>,
  separator: false,
});
</script>

<template>
  <Grid />
</template>
