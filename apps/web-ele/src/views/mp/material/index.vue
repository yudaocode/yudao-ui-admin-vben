<script lang="ts" setup>
import { provide, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElLoading,
  ElMessage,
  ElPagination,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { deletePermanentMaterial, getMaterialPage } from '#/api/mp/material';
import { WxAccountSelect } from '#/views/mp/components';

import ImageTable from './modules/image-table.vue';
import { UploadType } from './modules/upload';
import UploadFile from './modules/UploadFile.vue';
import UploadVideo from './modules/UploadVideo.vue';
import VideoTable from './modules/video-table.vue';
import VoiceTable from './modules/voice-table.vue';

defineOptions({ name: 'MpMaterial' });

const { hasAccessByCodes } = useAccess();

const type = ref<UploadType>(UploadType.Image); // 素材类型
const loading = ref(false); // 遮罩层
const list = ref<any[]>([]); // 数据列表
const total = ref(0); // 总条数

const accountId = ref(-1);
provide('accountId', accountId);

const queryParams = reactive({
  accountId,
  pageNo: 1,
  pageSize: 10,
  permanent: true,
}); // 查询参数
const showCreateVideo = ref(false); // 是否新建视频的弹窗

/** 侦听公众号变化 */
function onAccountChanged(id: number) {
  accountId.value = id;
  queryParams.accountId = id;
  queryParams.pageNo = 1;
  getList();
}

/** 查询列表 */
async function getList() {
  loading.value = true;
  try {
    const data = await getMaterialPage({
      ...queryParams,
      type: type.value,
    });
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1;
  getList();
}

/** 处理 tab 切换 */
function onTabChange() {
  // 提前清空数据，避免 tab 切换后显示垃圾数据
  list.value = [];
  total.value = 0;
  // 从第一页开始查询
  handleQuery();
}

/** 处理删除操作 */
async function handleDelete(id: number) {
  await confirm('此操作将永久删除该文件, 是否继续?');
  const loadingInstance = ElLoading.service({
    text: '正在删除...',
    lock: true,
  });
  try {
    await deletePermanentMaterial(id);
    ElMessage.success('删除成功');
    await getList();
  } finally {
    loadingInstance.close();
  }
}

/** 分页改变事件 */
function handlePageChange(page: number) {
  queryParams.pageNo = page;
  getList();
}

/** 每页条数改变事件 */
function handleSizeChange(pageSize: number) {
  queryParams.pageSize = pageSize;
  queryParams.pageNo = 1;
  getList();
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="公众号素材" url="https://doc.iocoder.cn/mp/material/" />
    </template>
    <div class="h-full">
      <!-- 搜索工作栏 -->
      <ElCard class="h-[10%]" shadow="never">
        <ElForm :model="queryParams" :inline="true">
          <ElFormItem label="公众号" class="w-52">
            <WxAccountSelect @change="onAccountChanged" />
          </ElFormItem>
        </ElForm>
      </ElCard>

      <ElCard shadow="never" class="mt-4 h-auto">
        <ElTabs v-model="type" @tab-change="onTabChange">
          <!-- tab 1：图片  -->
          <ElTabPane :name="UploadType.Image">
            <template #label>
              <span class="flex items-center">
                <IconifyIcon icon="lucide:image" class="mr-1" />
                图片
              </span>
            </template>
            <!-- 列表 -->
            <ImageTable :list="list" :loading="loading" @delete="handleDelete">
              <template #toolbar-tools>
                <UploadFile
                  v-if="hasAccessByCodes(['mp:material:upload-permanent'])"
                  :type="UploadType.Image"
                  @uploaded="getList"
                />
              </template>
            </ImageTable>
            <!-- 分页组件 -->
            <div class="mt-4 flex justify-end">
              <ElPagination
                v-model:current-page="queryParams.pageNo"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="handlePageChange"
                @size-change="handleSizeChange"
              />
            </div>
          </ElTabPane>

          <!-- tab 2：语音  -->
          <ElTabPane :name="UploadType.Voice">
            <template #label>
              <span class="flex items-center">
                <IconifyIcon icon="lucide:mic" class="mr-1" />
                语音
              </span>
            </template>
            <!-- 列表 -->
            <VoiceTable :list="list" :loading="loading" @delete="handleDelete">
              <template #toolbar-tools>
                <UploadFile
                  v-if="hasAccessByCodes(['mp:material:upload-permanent'])"
                  :type="UploadType.Voice"
                  @uploaded="getList"
                />
              </template>
            </VoiceTable>
            <!-- 分页组件 -->
            <div class="mt-4 flex justify-end">
              <ElPagination
                v-model:current-page="queryParams.pageNo"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="handlePageChange"
                @size-change="handleSizeChange"
              />
            </div>
          </ElTabPane>

          <!-- tab 3：视频 -->
          <ElTabPane :name="UploadType.Video">
            <template #label>
              <span class="flex items-center">
                <IconifyIcon icon="lucide:video" class="mr-1" />
                视频
              </span>
            </template>
            <!-- 列表 -->
            <VideoTable :list="list" :loading="loading" @delete="handleDelete">
              <template #toolbar-tools>
                <ElButton
                  v-if="hasAccessByCodes(['mp:material:upload-permanent'])"
                  type="primary"
                  @click="showCreateVideo = true"
                >
                  新建视频
                </ElButton>
              </template>
            </VideoTable>
            <!-- 新建视频的弹窗 -->
            <UploadVideo v-model="showCreateVideo" @uploaded="getList" />
            <!-- 分页组件 -->
            <div class="mt-4 flex justify-end">
              <ElPagination
                v-model:current-page="queryParams.pageNo"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="handlePageChange"
                @size-change="handleSizeChange"
              />
            </div>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </Page>
</template>
