<script lang="ts" setup>
import type { UploadFile, UploadProps } from 'ant-design-vue';

import type { MpDraftApi } from '#/api/mp/draft';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Button, Image, message, Modal, Upload } from 'ant-design-vue';

import { UploadType, useBeforeUpload } from '#/utils/useUpload';
import { WxMaterialSelect } from '#/views/mp/components/';

import { parseCoverUploadChange } from './cover-upload';

const props = defineProps<{
  accountId: number;
  isFirst: boolean;
  modelValue: MpDraftApi.NewsItem;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: MpDraftApi.NewsItem): void;
}>();

const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/admin-api/mp/material/upload-permanent`; // 上传永久素材的地址
const HEADERS = { Authorization: `Bearer ${useAccessStore().accessToken}` };
const newsItem = computed<MpDraftApi.NewsItem>({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const dialogVisible = ref(false);

interface CoverUploadResponse {
  code?: number;
  data?: {
    mediaId?: unknown;
    url?: unknown;
  };
  msg?: string;
}

const fileList = ref<UploadFile[]>([]);
const uploadData = computed(() => ({
  accountId: props.accountId,
  type: UploadType.Image,
}));

function handleOpenDialog() {
  dialogVisible.value = true;
}

/** 素材选择完成事件 */
function onMaterialSelected(item: any) {
  dialogVisible.value = false;
  newsItem.value.thumbMediaId = item.mediaId;
  newsItem.value.thumbUrl = item.url;
}

/** 上传前校验 */
const onBeforeUpload = (file: UploadFile) =>
  useBeforeUpload(UploadType.Image, 2)(file as any);

/** 上传状态处理 */
const onUploadChange: UploadProps['onChange'] = (info) => {
  fileList.value = info.fileList;
  const result = parseCoverUploadChange<CoverUploadResponse>(info);
  if (result.error) {
    onUploadError(result.error);
  } else if (result.response) {
    onUploadSuccess(result.response);
  }
};

/** 上传成功处理 */
function onUploadSuccess(res: CoverUploadResponse) {
  const data = res.data;
  if (
    res.code !== 0 ||
    !data ||
    typeof data.mediaId !== 'string' ||
    typeof data.url !== 'string'
  ) {
    fileList.value = [];
    const errorMessage =
      res.code === 0 ? '上传响应格式错误' : res.msg || '上传失败';
    message.error(`上传出错：${errorMessage}`);
    return false;
  }

  // 重置上传文件的表单
  fileList.value = [];
  // 设置草稿的封面字段
  newsItem.value.thumbMediaId = data.mediaId;
  newsItem.value.thumbUrl = data.url;
}

/** 上传失败处理 */
function onUploadError(err: Error) {
  fileList.value = [];
  message.error(`上传失败: ${err.message}`);
}
</script>

<template>
  <div>
    <p>封面:</p>
    <div class="flex w-full flex-col items-center justify-center text-center">
      <Image
        v-if="newsItem.thumbUrl"
        class="max-h-[300px] w-[300px]"
        :src="newsItem.thumbUrl"
        :preview="false"
      />
      <IconifyIcon
        v-else
        icon="lucide:plus"
        class="border border-[#d9d9d9] text-center text-[28px] leading-[120px] text-[#8c939d]"
        :class="isFirst ? 'h-[120px] w-[230px]' : 'h-[120px] w-[120px]'"
      />
      <div class="m-[5px]">
        <div class="flex items-center justify-center">
          <Upload
            :action="UPLOAD_URL"
            :headers="HEADERS"
            :file-list="fileList"
            :data="uploadData"
            :before-upload="onBeforeUpload"
            @change="onUploadChange"
          >
            <template #default>
              <Button size="small" type="primary">本地上传</Button>
            </template>
          </Upload>
          <Button
            size="small"
            type="primary"
            class="ml-[5px]"
            @click="handleOpenDialog"
          >
            素材库选择
          </Button>
        </div>

        <div class="ml-[5px] mt-[5px] text-xs text-[#999]">
          支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M
        </div>
      </div>
      <Modal
        v-model:open="dialogVisible"
        title="图片选择"
        width="65%"
        :footer="null"
      >
        <WxMaterialSelect
          type="image"
          :account-id="props.accountId"
          @select-material="onMaterialSelected"
        />
      </Modal>
    </div>
  </div>
</template>
