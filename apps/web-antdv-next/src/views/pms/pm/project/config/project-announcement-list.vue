<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectAnnouncementApi } from '#/api/pms/pm/project/announcement';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Dropdown, Menu, MenuItem, message } from 'antdv-next';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProjectAnnouncement,
  getProjectAnnouncementList,
} from '#/api/pms/pm/project/announcement';

import { useAnnouncementColumns } from './data';
import ProjectAnnouncementForm from './project-announcement-form.vue';

defineOptions({ name: 'PmsProjectAnnouncementList' });

const props = defineProps<{ editable: boolean; projectId: number }>();

const total = ref(0); // 公告总数

const [ProjectAnnouncementFormModal, projectAnnouncementFormModalApi] =
  useVbenModal({
  destroyOnClose: true,
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

/** 删除公告 */
async function handleDelete(id: number) {
  await deleteProjectAnnouncement(id);
  message.success('删除成功');
  gridApi.query();
}
</script>

<template>
  <div>
    <!-- 公告列表标题与操作 -->
    <div class="mb-4 flex items-center justify-between">
      <h3 class="m-0 text-lg font-semibold">项目公告（{{ total }}）</h3>
      <Button
        v-if="editable"
        v-access:code="['pms:pm:project:update']"
        type="primary"
        @click="openForm('create')"
      >
        发布公告
      </Button>
    </div>

    <!-- 公告列表 -->
    <Grid>
      <template #content="{ row }">
        <div class="line-clamp-2 whitespace-pre-wrap leading-[22px]">
          {{ row.content }}
        </div>
      </template>
      <template #fileUrls="{ row }">
        <Dropdown v-if="row.fileUrls?.length" :trigger="['click']">
          <Button type="link">{{ row.fileUrls.length }} 个附件</Button>
          <template #popupRender>
            <Menu>
              <MenuItem v-for="(url, index) in row.fileUrls" :key="url">
                <a :href="url" target="_blank">附件 {{ Number(index) + 1 }}</a>
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
        <span v-else>--</span>
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              auth: ['pms:pm:project:update'],
              onClick: () => openForm('update', row.id),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              auth: ['pms:pm:project:update'],
              popConfirm: {
                title: '是否确认删除该公告？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 添加或修改项目公告对话框 -->
    <ProjectAnnouncementFormModal @success="gridApi.query()" />
  </div>
</template>
