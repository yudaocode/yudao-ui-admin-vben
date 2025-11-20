<script lang="ts" setup>
import type { UploadFiles, UploadProps, UploadRawFile } from 'element-plus';

import type { NewsItem } from './types';

import { computed, inject, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { ElButton, ElDialog, ElImage, ElMessage, ElUpload } from 'element-plus';

import { UploadType, useBeforeUpload } from '#/utils/useUpload';
import MaterialSelect from '#/views/mp/components/wx-material-select/wx-material-select.vue';

// 设置上传的请求头部

const props = defineProps<{
  isFirst: boolean;
  modelValue: NewsItem;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: NewsItem): void;
}>();

const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/admin-api/mp/material/upload-permanent`; // 上传永久素材的地址
const HEADERS = { Authorization: `Bearer ${useAccessStore().accessToken}` };
const newsItem = computed<NewsItem>({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const accountId = inject<number>('accountId');
const showImageDialog = ref(false);

const fileList = ref<UploadFiles>([]);
interface UploadData {
  type: UploadType;
  accountId: number;
}
const uploadData: UploadData = reactive({
  type: UploadType.Image,
  accountId: accountId!,
});

/** 素材选择完成事件*/
function onMaterialSelected(item: any) {
  showImageDialog.value = false;
  newsItem.value.thumbMediaId = item.mediaId;
  newsItem.value.thumbUrl = item.url;
}

const onBeforeUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  useBeforeUpload(UploadType.Image, 2)(rawFile);

function onUploadSuccess(res: any) {
  if (res.code !== 0) {
    ElMessage.error(`上传出错：${res.msg}`);
    return false;
  }

  // 重置上传文件的表单
  fileList.value = [];

  // 设置草稿的封面字段
  newsItem.value.thumbMediaId = res.data.mediaId;
  newsItem.value.thumbUrl = res.data.url;
}

function onUploadError(err: Error) {
  ElMessage.error(`上传失败: ${err.message}`);
}
</script>

<template>
  <div>
    <p>封面:</p>
    <div
      class="inline-flex w-full flex-col items-center justify-center text-center"
    >
      <ElImage
        v-if="newsItem.thumbUrl"
        class="max-h-[300px] w-[300px]"
        :src="newsItem.thumbUrl"
        fit="contain"
      />
      <IconifyIcon
        v-else
        icon="ep:plus"
        class="border border-[#d9d9d9] text-center text-[28px] leading-[120px] text-[#8c939d]"
        :class="isFirst ? 'h-[120px] w-[230px]' : 'h-[120px] w-[120px]'"
      />
      <div class="m-1.5">
        <ElUpload
          :action="UPLOAD_URL"
          :headers="HEADERS"
          multiple
          :limit="1"
          :file-list="fileList"
          :data="uploadData"
          :before-upload="onBeforeUpload"
          :on-error="onUploadError"
          :on-success="onUploadSuccess"
        >
          <template #trigger>
            <ElButton size="small" type="primary">本地上传</ElButton>
          </template>
          <ElButton
            size="small"
            type="primary"
            @click="showImageDialog = true"
            class="ml-1.5"
          >
            素材库选择
          </ElButton>
          <template #tip>
            <div class="ml-1.5">
              支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M
            </div>
          </template>
        </ElUpload>
      </div>
      <ElDialog
        title="选择图片"
        v-model="showImageDialog"
        width="80%"
        append-to-body
        destroy-on-close
      >
        <MaterialSelect
          type="image"
          :account-id="accountId!"
          @select-material="onMaterialSelected"
        />
      </ElDialog>
    </div>
  </div>
</template>
