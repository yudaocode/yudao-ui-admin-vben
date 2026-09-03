<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectAnnouncementApi } from '#/api/pms/pm/project/announcement';

import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElLink,
  ElMessage,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProjectAnnouncement,
  getProjectAnnouncementList,
} from '#/api/pms/pm/project/announcement';

import { useAnnouncementColumns } from './data';
import ProjectAnnouncementForm from './project-announcement-form.vue';

defineOptions({ name: 'PmsProjectAnnouncementList' });

// TODO @AI：删除改 TableAction popConfirm。createTime 走 formatter。补 destroyOnClose。

const props = defineProps<{ editable: boolean; projectId: number }>();

const total = ref(0); // 公告总数

const [ProjectAnnouncementFormModal, projectAnnouncementFormModalApi] =
  useVbenModal({
    connectedComponent: ProjectAnnouncementForm,
  });

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useAnnouncementColumns(props.editable),
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getProjectAnnouncementList(props.projectId);
          total.value = list.length;
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<PmsProjectAnnouncementApi.ProjectAnnouncement>,
});

/** 添加/修改操作 */
function openForm(formType: 'create' | 'update', id?: number) {
  projectAnnouncementFormModalApi
    .setData({ formType, projectId: props.projectId, id })
    .open();
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await confirm('是否确认删除该公告？');
    // 发起删除
    await deleteProjectAnnouncement(id);
    ElMessage.success('删除成功');
    // 刷新列表
    await gridApi.query();
  } catch {
  }
}
</script>

<template>
  <div>
    <!-- 公告列表标题与操作 -->
    <div class="mb-4 flex items-center justify-between">
      <h3 class="m-0 text-lg font-semibold">项目公告（{{ total }}）</h3>
      <ElButton
        v-if="editable"
        v-access:code="['pms:pm:project:update']"
        type="primary"
        @click="openForm('create')"
      >
        发布公告
      </ElButton>
    </div>

    <!-- 公告列表 -->
    <Grid>
      <template #content="{ row }">
        <div class="line-clamp-2 whitespace-pre-wrap leading-[22px]">
          {{ row.content }}
        </div>
      </template>
      <template #fileUrls="{ row }">
        <ElDropdown v-if="row.fileUrls?.length" trigger="click">
          <ElButton link type="primary">
            {{ row.fileUrls.length }} 个附件
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem v-for="(url, index) in row.fileUrls" :key="url">
                <ElLink :href="url" target="_blank">
                  附件 {{ Number(index) + 1 }}
                </ElLink>
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <span v-else>--</span>
      </template>
      <template #createTime="{ row }">
        {{ formatDateTime(row.createTime) }}
      </template>
      <template #action="{ row }">
        <ElButton
          v-access:code="['pms:pm:project:update']"
          link
          type="primary"
          @click="openForm('update', row.id)"
        >
          编辑
        </ElButton>
        <ElButton
          v-access:code="['pms:pm:project:update']"
          link
          type="danger"
          @click="handleDelete(row.id!)"
        >
          删除
        </ElButton>
      </template>
    </Grid>

    <!-- 添加或修改项目公告对话框 -->
    <ProjectAnnouncementFormModal @success="gridApi.query()" />
  </div>
</template>
