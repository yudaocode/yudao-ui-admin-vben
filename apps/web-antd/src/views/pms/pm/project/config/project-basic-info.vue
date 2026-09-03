<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { useRouter } from 'vue-router';

import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { Button, Descriptions, Divider, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { archiveProject, recycleProject } from '#/api/pms/pm/project';

import ProjectForm from '../components/project-form.vue';

defineOptions({ name: 'PmsProjectBasicInfo' });

// TODO @AI：日期用 formatDateTime，不要页面里 dayjs.format。归档/回收站对齐 TableAction 或补 auth。empty catch 处理下。补 destroyOnClose。
const props = defineProps<{
  editable: boolean;
  project: PmsProjectApi.Project;
}>();

const emit = defineEmits<{ success: [] }>(); // 项目更新成功事件

const { push } = useRouter(); // 路由操作

const [ProjectFormModal, projectFormModalApi] = useVbenModal({
  connectedComponent: ProjectForm,
});

/** 归档项目 */
async function handleArchive() {
  try {
    // 归档的二次确认
    await confirm('归档后将不能继续操作项目中的数据，确认归档该项目吗？');
    // 执行项目归档
    await archiveProject(props.project.id);
    // 提示结果并进入归档项目列表
    message.success('项目已归档');
    await push({ name: 'PmsProjectArchive' });
  } catch {}
}

/** 将项目移入回收站 */
async function handleRecycle() {
  try {
    // 移入回收站的二次确认
    await confirm('确认将该项目移入回收站吗？');
    // 将项目移入回收站
    await recycleProject(props.project.id);
    // 提示结果并进入项目回收站
    message.success('项目已移入回收站');
    await push({ name: 'PmsProjectRecycle' });
  } catch {
  }
}
</script>

<template>
  <div>
    <!-- 基本信息标题与操作 -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <h3 class="m-0 text-lg font-semibold">项目基本信息</h3>
      <Button
        v-if="project.adminStatus && editable"
        v-access:code="['pms:pm:project:update']"
        type="primary"
        @click="
          projectFormModalApi
            .setData({ formType: 'update', id: project.id })
            .open()
        "
      >
        编辑项目
      </Button>
    </div>

    <!-- 项目基础字段 -->
    <Descriptions :column="2" bordered size="small">
      <Descriptions.Item label="项目名称">{{ project.name }}</Descriptions.Item>
      <Descriptions.Item label="项目类型">
        {{ getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, project.type) || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="项目周期">
        {{
          project.startTime
            ? dayjs(project.startTime).format('YYYY-MM-DD')
            : '未设置'
        }}
        至
        {{
          project.endTime
            ? dayjs(project.endTime).format('YYYY-MM-DD')
            : '未设置'
        }}
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
        <Button @click="handleArchive">归档</Button>
      </div>
      <Divider />
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-semibold">移入回收站</div>
          <div class="mt-1 text-[13px] leading-5 text-muted-foreground">
            项目进入回收站后不可访问；只有项目拥有者可以在回收站彻底删除。
          </div>
        </div>
        <Button danger @click="handleRecycle">移入回收站</Button>
      </div>
    </template>

    <!-- 项目表单 -->
    <ProjectFormModal @success="emit('success')" />
  </div>
</template>
