<script lang="ts" setup>
import type { UploadFile } from 'ant-design-vue';

import type { Reply } from './types';

import { computed, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Button, Col, message, Modal, Row, Upload } from 'ant-design-vue';

import { UploadType, useBeforeUpload } from '#/utils/useUpload';
import { WxMaterialSelect } from '#/views/mp/modules/wx-material-select';
import { WxVoicePlayer } from '#/views/mp/modules/wx-voice-play';

const props = defineProps<{
  modelValue: Reply;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();

const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/admin-api/mp/material/upload-temporary`;
const HEADERS = { Authorization: `Bearer ${useAccessStore().accessToken}` };
const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val: Reply) => emit('update:modelValue', val),
});

const showDialog = ref(false);
const fileList = ref([]);
const uploadData = reactive({
  accountId: reply.value.accountId,
  type: 'voice',
  title: '',
  introduction: '',
});

/** 语音上传前校验 */
function beforeVoiceUpload(file: UploadFile) {
  return useBeforeUpload(UploadType.Voice, 10)(file as any);
}

/** 上传成功 */
function onUploadSuccess(info: any) {
  const res = info.response || info;
  if (res.code !== 0) {
    message.error(`上传出错：${res.msg}`);
    return false;
  }

  // 清空上传时的各种数据
  fileList.value = [];
  uploadData.title = '';
  uploadData.introduction = '';

  // 上传好的文件，本质是个素材，所以可以进行选中
  selectMaterial(res.data);
}

/** 删除语音 */
function onDelete() {
  reply.value.mediaId = null;
  reply.value.url = null;
  reply.value.name = null;
}

/** 选择素材 */
function selectMaterial(item: Reply) {
  showDialog.value = false;

  // reply.value.type = ReplyType.Voice
  reply.value.mediaId = item.mediaId;
  reply.value.url = item.url;
  reply.value.name = item.name;
}
</script>
<template>
  <div>
    <div
      class="mx-auto mb-[10px] border border-[#eaeaea] p-[10px]"
      v-if="reply.url"
    >
      <p
        class="overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs"
      >
        {{ reply.name }}
      </p>
      <Row class="w-full pt-[10px] text-center" justify="center">
        <WxVoicePlayer :url="reply.url" />
      </Row>
      <Row class="w-full pt-[10px] text-center" justify="center">
        <Button type="primary" danger shape="circle" @click="onDelete">
          <IconifyIcon icon="ep:delete" />
        </Button>
      </Row>
    </div>
    <Row v-else class="text-center">
      <!-- 选择素材 -->
      <Col
        :span="12"
        class="h-[160px] w-[49.5%] border border-[rgb(234,234,234)] py-[50px]"
      >
        <Button type="primary" @click="showDialog = true">
          素材库选择<IconifyIcon icon="ep:circle-check" />
        </Button>
        <Modal
          title="选择语音"
          v-model:open="showDialog"
          width="90%"
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
      <Col
        :span="12"
        class="float-right h-[160px] w-[49.5%] border border-[rgb(234,234,234)] py-[50px]"
      >
        <Upload
          :action="UPLOAD_URL"
          :headers="HEADERS"
          :file-list="fileList"
          :data="uploadData"
          :before-upload="beforeVoiceUpload"
          @change="
            (info) => {
              if (info.file.status === 'done') {
                onUploadSuccess(info.file.response || info.file);
              }
            }
          "
        >
          <Button type="primary">点击上传</Button>
          <template #tip>
            <div class="text-center leading-[18px]">
              格式支持 mp3/wma/wav/amr，文件大小不超过 2M，播放长度不超过 60s
            </div>
          </template>
        </Upload>
      </Col>
    </Row>
  </div>
</template>
