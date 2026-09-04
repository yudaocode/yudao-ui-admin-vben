<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { Descriptions, Divider, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import { archiveProject, recycleProject } from '#/api/pms/pm/project';
import { formatPmsDate } from '#/views/pms/pm/utils/format';

import ProjectForm from '../list/modules/form.vue';

defineOptions({ name: 'PmsProjectBasicInfo' });

const props = defineProps<{
  editable: boolean;
  project: PmsProjectApi.Project;
}>();

const emit = defineEmits<{ success: [] }>(); // 项目更新成功事件

const { push } = useRouter(); // 路由操作

const [ProjectFormModal, projectFormModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: ProjectForm,
});

/** 归档项目 */
async function handleArchive() {
  await archiveProject(props.project.id);
  message.success('项目已归档');
  await push({ name: 'PmsProjectArchive' });
}

/** 将项目移入回收站 */
async function handleRecycle() {
  await recycleProject(props.project.id);
  message.success('项目已移入回收站');
  await push({ name: 'PmsProjectRecycle' });
}
</script>

<template>
  <div>
    <!-- 基本信息标题与操作 -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <h3 class="m-0 text-lg font-semibold">项目基本信息</h3>
      <TableAction
        v-if="project.adminStatus && editable"
        :actions="[
          {
            label: '编辑项目',
            type: 'primary',
            icon: ACTION_ICON.EDIT,
            auth: ['pms:pm:project:update'],
            onClick: () =>
              projectFormModalApi
                .setData({ formType: 'update', id: project.id })
                .open(),
          },
        ]"
      />
    </div>

    <!-- 项目基础字段 -->
    <Descriptions :column="2" bordered size="small">
      <Descriptions.Item label="项目名称">{{ project.name }}</Descriptions.Item>
      <Descriptions.Item label="项目类型">
        {{ getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, project.type) || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="项目周期">
        {{ project.startTime ? formatPmsDate(project.startTime) : '未设置' }}
        至
        {{ project.endTime ? formatPmsDate(project.endTime) : '未设置' }}
      </Descriptions.Item>
      <Descriptions.Item label="可见范围">
        {{ project.openStatus ? '公开项目' : '私有项目' }}
      </Descriptions.Item>
      <Descriptions.Item label="项目描述" :span="2">
        {{ project.description || '暂无项目描述' }}
      </Descriptions.Item>
    </Descriptions>

    <!-- 项目生命周期管理 -->
    <template v-if="project.adminStatus && editable">
      <Divider orientation="left">项目管理</Divider>
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-semibold">归档项目</div>
          <div class="mt-1 text-[13px] leading-5 text-muted-foreground">
            归档后项目只允许查看，不能继续维护项目中的迭代和工作项。
          </div>
        </div>
        <TableAction
          :actions="[
            {
              label: '归档',
              auth: ['pms:pm:project:update'],
              popConfirm: {
                title: '归档后将不能继续操作项目中的数据，确认归档该项目吗？',
                confirm: handleArchive,
              },
            },
          ]"
        />
      </div>
      <Divider />
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-semibold">移入回收站</div>
          <div class="mt-1 text-[13px] leading-5 text-muted-foreground">
            项目进入回收站后不可访问；只有项目拥有者可以在回收站彻底删除。
          </div>
        </div>
        <TableAction
          :actions="[
            {
              label: '移入回收站',
              danger: true,
              auth: ['pms:pm:project:update'],
              popConfirm: {
                title: '确认将该项目移入回收站吗？',
                confirm: handleRecycle,
              },
            },
          ]"
        />
      </div>
    </template>

    <!-- 项目表单 -->
    <ProjectFormModal @success="emit('success')" />
  </div>
</template>
