<script lang="ts" setup>
import type { Reply } from './types';

import type { UploadRawFile } from '#/views/mp/hooks/useUpload';

import { computed, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Button, Col, message, Modal, Row, Upload } from 'ant-design-vue';

import WxMaterialSelect from '#/views/mp/components/wx-material-select';
import WxVoicePlayer from '#/views/mp/components/wx-voice-play';
import { UploadType, useBeforeUpload } from '#/views/mp/hooks/useUpload';

defineOptions({ name: 'TabVoice' });

const props = defineProps<{
  modelValue: Reply;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();

const accessStore = useAccessStore();
const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/admin-api/mp/material/upload-temporary`;
const HEADERS = { Authorization: `Bearer ${accessStore.accessToken}` };

const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const showDialog = ref(false);
const fileList = ref([]);
const uploadData = reactive({
  accountId: reply.value.accountId,
  introduction: '',
  title: '',
  type: 'voice',
});

const beforeVoiceUpload = (rawFile: UploadRawFile) =>
  useBeforeUpload(UploadType.Voice, 10)(rawFile);

// 自定义上传请求
const customRequest = async (options: any) => {
  const { file, onSuccess, onError } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', String(uploadData.accountId));
  formData.append('type', uploadData.type);
  formData.append('title', uploadData.title);
  formData.append('introduction', uploadData.introduction);

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: HEADERS,
      body: formData,
    });

    const result = await response.json();

    if (result.code === 0) {
      // 清空上传时的各种数据
      fileList.value = [];
      uploadData.title = '';
      uploadData.introduction = '';

      // 上传好的文件，本质是个素材，所以可以进行选中
      selectMaterial(result.data);
      message.success('上传成功');
      onSuccess(result, file);
    } else {
      message.error(result.msg || '上传出错');
      onError(new Error(result.msg || '上传失败'));
    }
  } catch (error) {
    message.error('上传失败，请重试');
    onError(error);
  }
};

const onDelete = () => {
  reply.value.mediaId = null;
  reply.value.url = null;
  reply.value.name = null;
};

const selectMaterial = (item: Reply) => {
  showDialog.value = false;
  reply.value.mediaId = item.mediaId;
  reply.value.url = item.url;
  reply.value.name = item.name;
};
</script>

<template>
  <div>
    <div v-if="reply.url" class="select-item">
      <p class="item-name">{{ reply.name }}</p>
      <Row class="ope-row" justify="center">
        <WxVoicePlayer :url="reply.url" />
      </Row>
      <Row class="ope-row" justify="center">
        <Button danger shape="circle" @click="onDelete">
          <template #icon>
            <IconifyIcon icon="mdi:delete" />
          </template>
        </Button>
      </Row>
    </div>

    <Row v-else class="text-center">
      <!-- 选择素材 -->
      <Col :span="12" class="col-select">
        <Button type="primary" @click="showDialog = true">
          素材库选择
          <template #icon>
            <IconifyIcon icon="mdi:check-circle" />
          </template>
        </Button>
        <Modal
          v-model:open="showDialog"
          title="选择语音"
          :width="1200"
          :footer="null"
          destroy-on-close
        >
          <WxMaterialSelect
            type="voice"
            :account-id="reply.accountId"
            @select-material="selectMaterial"
          />
        </Modal>
      </Col>

      <!-- 文件上传 -->
      <Col :span="12" class="col-add">
        <Upload
          :custom-request="customRequest"
          :multiple="true"
          :max-count="1"
          :file-list="fileList"
          :before-upload="beforeVoiceUpload"
          :show-upload-list="false"
        >
          <Button type="primary">
            点击上传
            <template #icon>
              <IconifyIcon icon="mdi:upload" />
            </template>
          </Button>
        </Upload>
        <div class="upload-tip">
          格式支持 mp3/wma/wav/amr，文件大小不超过 2M，播放长度不超过 60s
        </div>
      </Col>
    </Row>
  </div>
</template>

<style lang="scss" scoped>
.select-item {
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
}

.ope-row {
  width: 100%;
  padding-top: 10px;
  text-align: center;
}

.col-select,
.col-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  padding: 50px 0;
  border: 1px solid rgb(234 234 234);
}

.col-select {
  width: 49.5%;
}

.col-add {
  float: right;
  width: 49.5%;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 18px;
  color: #666;
  text-align: center;
}
</style>
