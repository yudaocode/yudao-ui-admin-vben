<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';

import { onMounted, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { ElAvatar, ElButton, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProjectMember,
  getProjectMemberList,
} from '#/api/pms/pm/project/member';

import { useProjectMemberGridColumns } from './data';
import ProjectMemberForm from './project-member-form.vue';

defineOptions({ name: 'PmsProjectMemberList' });

// TODO @AI：删除改 TableAction popConfirm，不要 confirm + empty catch。补 destroyOnClose。

const props = defineProps<{
  editable: boolean;
  project: PmsProjectApi.Project;
}>();

const memberList = ref<PmsProjectMemberApi.ProjectMember[]>([]); // 项目成员列表

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useProjectMemberGridColumns(
      props.project.adminStatus && props.editable,
    ),
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getProjectMemberList(props.project.id);
          memberList.value = list;
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'userId',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<PmsProjectMemberApi.ProjectMember>,
});

const [ProjectMemberFormModal, projectMemberFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: ProjectMemberForm,
});

/** 修改项目成员 */
function handleEdit(member: PmsProjectMemberApi.ProjectMember) {
  projectMemberFormModalApi
    .setData({
      formType: 'update',
      projectId: props.project.id,
      projectName: props.project.name,
      memberList: memberList.value,
      member,
    })
    .open();
}

/** 删除项目成员 */
async function handleDelete(member: PmsProjectMemberApi.ProjectMember) {
  try {
    // 删除的二次确认
    await confirm(`确认将“${member.nickname}”移出项目吗？`);
    // 删除成员并刷新列表
    await deleteProjectMember(props.project.id, member.userId);
    ElMessage.success('成员已移出项目');
    gridApi.query();
  } catch {
  }
}

/** 初始化 */
onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <div>
    <!-- 成员列表标题与操作 -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <h3 class="m-0 text-lg font-semibold">项目成员</h3>
      <ElButton
        v-if="project.adminStatus && editable"
        v-access:code="['pms:pm:project-member:update']"
        type="primary"
        @click="
          projectMemberFormModalApi
            .setData({
              formType: 'create',
              projectId: project.id,
              projectName: project.name,
              memberList,
            })
            .open()
        "
      >
        新增成员
      </ElButton>
    </div>

    <!-- 成员列表 -->
    <Grid>
      <template #nickname="{ row }">
        <div class="flex items-center">
          <ElAvatar :size="30" :src="row.avatar">
            {{ row.nickname?.slice(0, 1) }}
          </ElAvatar>
          <span class="ml-2">{{ row.nickname || `用户 #${row.userId}` }}</span>
          <ElTag
            v-if="row.creatorStatus"
            class="ml-2"
            effect="plain"
            type="success"
          >
            创建人
          </ElTag>
        </div>
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '修改',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['pms:pm:project-member:update'],
              disabled: row.creatorStatus,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['pms:pm:project-member:update'],
              disabled: row.creatorStatus,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 成员表单 -->
    <ProjectMemberFormModal @success="gridApi.query()" />
  </div>
</template>
