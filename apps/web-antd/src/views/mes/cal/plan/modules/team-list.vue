<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalPlanTeamApi } from '#/api/mes/cal/plan/team';
import type { MesCalTeamApi } from '#/api/mes/cal/team';
import type { MesCalTeamMemberApi } from '#/api/mes/cal/team/member';

import { computed, ref, watch } from 'vue';

import { Card, message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { createPlanTeam, deletePlanTeam, getPlanTeamListByPlan } from '#/api/mes/cal/plan/team';
import { getTeamMemberListByTeam } from '#/api/mes/cal/team/member';
import { $t } from '#/locales';
import { CalTeamSelectDialog } from '#/views/mes/cal/team/components';

const props = withDefaults(defineProps<{ formType?: FormType; planId: number }>(), {
  formType: 'update',
});
const isEditable = computed(() => props.formType !== 'detail'); // 是否可编辑
const list = ref<MesCalPlanTeamApi.PlanTeam[]>([]); // 计划班组列表
const memberList = ref<MesCalTeamMemberApi.TeamMember[]>([]); // 班组成员列表
const selectedTeamId = ref<number>(); // 选中班组编号
const selectedTeamName = ref(''); // 选中班组名称
const teamDialogRef = ref<InstanceType<typeof CalTeamSelectDialog>>(); // 班组选择弹窗

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: [
      { field: 'teamId', title: '班组编号', width: 100 },
      { field: 'teamCode', title: '班组编码', minWidth: 120 },
      { field: 'teamName', title: '班组名称', minWidth: 120 },
      { field: 'remark', title: '备注', minWidth: 150 },
      {
        title: '操作',
        width: 90,
        fixed: 'right',
        slots: {
          default: 'actions',
        },
        visible: isEditable.value,
      },
    ],
    data: list.value,
    minHeight: 260,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isCurrent: true,
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesCalPlanTeamApi.PlanTeam>,
  gridEvents: {
    cellClick: ({ row }: { row: MesCalPlanTeamApi.PlanTeam }) => handleTeamSelect(row),
  },
});

const [MemberGrid, memberGridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: [
      { field: 'nickname', title: '用户昵称', minWidth: 100 },
      { field: 'telephone', title: '手机号', minWidth: 120 },
      { field: 'remark', title: '备注', minWidth: 120 },
    ],
    data: memberList.value,
    minHeight: 260,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesCalTeamMemberApi.TeamMember>,
});

/** 加载计划班组列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getPlanTeamListByPlan(props.planId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 选择班组后加载成员 */
async function handleTeamSelect(row?: MesCalPlanTeamApi.PlanTeam) {
  if (!row?.teamId) {
    selectedTeamId.value = undefined;
    selectedTeamName.value = '';
    memberList.value = [];
    memberGridApi.setGridOptions({ data: memberList.value });
    return;
  }
  selectedTeamId.value = row.teamId;
  selectedTeamName.value = row.teamName || '';
  memberGridApi.setLoading(true);
  try {
    memberList.value = await getTeamMemberListByTeam(row.teamId);
    memberGridApi.setGridOptions({ data: memberList.value });
  } finally {
    memberGridApi.setLoading(false);
  }
}

/** 打开班组选择弹窗 */
function openTeamSelect() {
  teamDialogRef.value?.open(list.value.map((item) => item.teamId!).filter(Boolean));
}

/** 处理班组选择 */
async function handleTeamsSelected(rows: MesCalTeamApi.Team[]) {
  const existingTeamIds = new Set(list.value.map((item) => item.teamId));
  const newTeams = rows.filter((team) => team.id && !existingTeamIds.has(team.id));
  if (newTeams.length === 0) {
    message.warning('所选班组已全部添加过');
    return;
  }
  gridApi.setLoading(true);
  try {
    for (const team of newTeams) {
      await createPlanTeam({ planId: props.planId, teamId: team.id });
    }
    message.success('成功添加 ' + newTeams.length + ' 个班组');
    await getList();
  } finally {
    gridApi.setLoading(false);
  }
}

/** 删除计划班组 */
async function handleDelete(row: MesCalPlanTeamApi.PlanTeam) {
  await deletePlanTeam(row.id!);
  message.success($t('ui.actionMessage.deleteSuccess', [row.teamName]));
  if (row.teamId === selectedTeamId.value) {
    await handleTeamSelect(undefined);
  }
  await getList();
}

watch(
  () => props.planId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <div v-if="isEditable" class="mb-3 flex items-center justify-start">
      <TableAction :actions="[{ label: '添加班组', type: 'primary', onClick: openTeamSelect }]" />
    </div>
    <div class="grid grid-cols-5 gap-4">
      <div class="col-span-3">
        <Grid class="w-full">
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  popConfirm: {
                    title: '确认删除该班组吗？',
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>
      <div class="col-span-2">
        <Card class="h-full" size="small">
          <template #title>
            {{ selectedTeamName ? `「${selectedTeamName}」班组成员` : '班组成员' }}
          </template>
          <div v-if="!selectedTeamId">
            <div class="py-8 text-center text-gray-400">请点击左侧班组查看成员</div>
          </div>
          <MemberGrid v-else class="w-full" />
        </Card>
      </div>
    </div>
    <CalTeamSelectDialog ref="teamDialogRef" :multiple="true" @selected="handleTeamsSelected" />
  </div>
</template>
