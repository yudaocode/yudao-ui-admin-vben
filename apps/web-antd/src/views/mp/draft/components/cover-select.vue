<script lang="ts" setup>
import type { UploadFile } from 'ant-design-vue';

import type { NewsItem } from './types';

import { computed, inject, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Button, Image, message, Modal, Upload } from 'ant-design-vue';

import { UploadType, useBeforeUpload } from '#/utils/useUpload';
import { WxMaterialSelect } from '#/views/mp/components';

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

const fileList = ref<UploadFile[]>([]);
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
// TODO @hw：注释都补充下哈；
function onBeforeUpload(file: UploadFile) {
  return useBeforeUpload(UploadType.Image, 2)(file as any);
}

// TODO @hw：注释都补充下哈；
function onUploadChange(info: any) {
  if (info.file.status === 'done') {
    onUploadSuccess(info.file.response || info.file);
  } else if (info.file.status === 'error') {
    onUploadError(info.file.error || new Error('上传失败'));
  }
}

// TODO @hw：注释都补充下哈；
function onUploadSuccess(res: any) {
  if (res.code !== 0) {
    message.error(`上传出错：${res.msg}`);
    return false;
  }

  // 重置上传文件的表单
  fileList.value = [];
  // 设置草稿的封面字段
  newsItem.value.thumbMediaId = res.data.mediaId;
  newsItem.value.thumbUrl = res.data.url;
}

// TODO @hw：注释都补充下哈；
function onUploadError(err: Error) {
  message.error(`上传失败: ${err.message}`);
}
</script>

<template>
  <div>
    <p>封面:</p>
    <!-- TODO @hw：我貌似上传不成功。不确定是不是我这边的问题；；；可以微信沟通下哈。 -->
    <div class="thumb-div">
      <Image
        v-if="newsItem.thumbUrl"
        style="width: 300px; max-height: 300px"
        :src="newsItem.thumbUrl"
        :preview="false"
      />
      <IconifyIcon
        v-else
        icon="lucide:plus"
        class="avatar-uploader-icon"
        :class="isFirst ? 'avatar' : 'avatar1'"
      />
      <div class="thumb-but">
        <div class="flex items-center justify-center">
          <Upload
            :action="UPLOAD_URL"
            :headers="HEADERS"
            :file-list="fileList"
            :data="{ ...uploadData }"
            :before-upload="onBeforeUpload"
            @change="onUploadChange"
          >
            <template #default>
              <Button size="small" type="primary">本地上传</Button>
            </template>
          </Upload>
          <!-- TODO @hw：tindwind -->
          <Button
            size="small"
            type="primary"
            @click="showImageDialog = true"
            style="margin-left: 5px"
          >
            素材库选择
          </Button>
        </div>

        <div class="upload-tip">
          支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M
        </div>
      </div>
      <!-- TODO @hw：是不是使用 vben 自带的 Modal 哈；这样 ele 通用性更好点。其它模块，涉及到 Modal 也按照这个调整噢 -->
      <Modal
        title="选择图片"
        v-model:open="showImageDialog"
        width="80%"
        destroy-on-close
      >
        <WxMaterialSelect
          type="image"
          :account-id="accountId!"
          @select-material="onMaterialSelected"
        />
      </Modal>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/** TODO @hw：尽量使用 tindwind 替代。ps：如果多个组件复用，那就不用调整 */
.upload-tip {
  margin-top: 5px;
  margin-left: 5px;
  font-size: 12px;
  color: #999;
}

.thumb-div {
  display: inline-block;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;

  .avatar-uploader-icon {
    width: 120px;
    height: 120px;
    font-size: 28px;
    line-height: 120px;
    color: #8c939d;
    text-align: center;
    border: 1px solid #d9d9d9;
  }

  .avatar {
    width: 230px;
    height: 120px;
  }

  .avatar1 {
    width: 120px;
    height: 120px;
  }

  .thumb-but {
    margin: 5px;
  }
}
</style>
