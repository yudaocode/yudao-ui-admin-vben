<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMaterialApi } from '#/api/mp/material';

import { provide, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message, Tabs } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePermanentMaterial, getMaterialPage } from '#/api/mp/material';
import { WxAccountSelect } from '#/views/mp/components';

import {
  useGridFormSchema,
  useImageGridColumns,
  useVideoGridColumns,
  useVoiceGridColumns,
} from './modules/data';
import { UploadType } from './modules/upload';
import UploadFile from './modules/UploadFile.vue';
import UploadVideo from './modules/UploadVideo.vue';

defineOptions({ name: 'MpMaterial' });

const { hasAccessByCodes } = useAccess();

const type = ref<UploadType>(UploadType.Image); // 素材类型
const showCreateVideo = ref(false); // 是否新建视频的弹窗

const accountId = ref(-1);
provide('accountId', accountId);

// 根据类型获取对应的列配置
const getColumnsByType = () => {
  switch (type.value) {
    case UploadType.Image: {
      return useImageGridColumns();
    }
    case UploadType.Video: {
      return useVideoGridColumns();
    }
    case UploadType.Voice: {
      return useVoiceGridColumns();
    }
    default: {
      return [];
    }
  }
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: getColumnsByType(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {},
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const finalAccountId = formValues?.accountId ?? accountId.value;
          if (!finalAccountId || finalAccountId === -1) {
            return { list: [], total: 0 };
          }
          return await getMaterialPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type: type.value,
            permanent: true,
            accountId: finalAccountId,
            ...formValues,
          });
        },
      },
      autoLoad: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    cellConfig: {
      height: type.value === UploadType.Image ? 220 : undefined,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MpMaterialApi.Material>,
});

// 当 tab 切换时，更新 Grid 的 columns 和 rowConfig
async function onTabChange() {
  const columns = getColumnsByType();
  gridApi.setGridOptions({
    columns,
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    cellConfig: {
      height: type.value === UploadType.Image ? 220 : undefined,
    },
  });
  await gridApi.reload();
}

async function handleAccountChange(id: number) {
  accountId.value = id;
  // 同步设置表单值
  await gridApi.formApi.setValues({ accountId: id });
  await gridApi.formApi.submitForm();
}

async function handleRefresh() {
  await gridApi.query();
}

/** 处理删除操作 */
async function handleDelete(id: number) {
  await confirm('此操作将永久删除该文件, 是否继续?');
  const hideLoading = message.loading({
    content: '正在删除...',
    duration: 0,
  });
  try {
    await deletePermanentMaterial(id);
    message.success('删除成功');
    await handleRefresh();
  } finally {
    hideLoading();
  }
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="公众号素材" url="https://doc.iocoder.cn/mp/material/" />
    </template>
    <Grid class="material-grid">
      <template #form-accountId>
        <WxAccountSelect @change="handleAccountChange" />
      </template>
      <template #toolbar-actions>
        <Tabs v-model:active-key="type" class="w-full" @change="onTabChange">
          <!-- tab 1：图片  -->
          <Tabs.TabPane :key="UploadType.Image">
            <template #tab>
              <span class="flex items-center">
                <IconifyIcon icon="lucide:image" class="mr-1" />
                图片
              </span>
            </template>
          </Tabs.TabPane>

          <!-- tab 2：语音  -->
          <Tabs.TabPane :key="UploadType.Voice">
            <template #tab>
              <span class="flex items-center">
                <IconifyIcon icon="lucide:mic" class="mr-1" />
                语音
              </span>
            </template>
          </Tabs.TabPane>

          <!-- tab 3：视频 -->
          <Tabs.TabPane :key="UploadType.Video">
            <template #tab>
              <span class="flex items-center">
                <IconifyIcon icon="lucide:video" class="mr-1" />
                视频
              </span>
            </template>
          </Tabs.TabPane>
        </Tabs>
      </template>
      <template #toolbar-tools>
        <UploadFile
          v-if="
            hasAccessByCodes(['mp:material:upload-permanent']) &&
            type === UploadType.Image
          "
          :type="UploadType.Image"
          @uploaded="handleRefresh"
        />
        <UploadFile
          v-if="
            hasAccessByCodes(['mp:material:upload-permanent']) &&
            type === UploadType.Voice
          "
          :type="UploadType.Voice"
          @uploaded="handleRefresh"
        />
        <Button
          v-if="
            hasAccessByCodes(['mp:material:upload-permanent']) &&
            type === UploadType.Video
          "
          type="primary"
          @click="showCreateVideo = true"
        >
          新建视频
        </Button>
      </template>

      <!-- 图片列的 slot -->
      <template #image="{ row }">
        <div class="flex items-center justify-center" style="height: 192px">
          <img
            :src="row.url"
            class="object-contain"
            style="display: block; max-width: 100%; max-height: 192px"
          />
        </div>
      </template>

      <!-- 语音列的 slot -->
      <template #voice="{ row }">
        <audio :src="row.url" controls style="width: 160px"></audio>
      </template>

      <!-- 视频列的 slot -->
      <template #video="{ row }">
        <video
          :src="row.url"
          controls
          style="width: 200px; height: 150px"
        ></video>
      </template>

      <!-- 操作列的 slot -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mp:material:delete'],
              onClick: () => handleDelete(row.id!),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 新建视频的弹窗 -->
    <UploadVideo v-model:open="showCreateVideo" @uploaded="handleRefresh" />
  </Page>
</template>
