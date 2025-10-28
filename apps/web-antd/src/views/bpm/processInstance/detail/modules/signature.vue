<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { base64ToFile } from '@vben/utils';

import { Button, message, Space, Tooltip } from 'ant-design-vue';
import Vue3Signature from 'vue3-signature';

import { uploadFile } from '#/api/infra/file';

defineOptions({
  name: 'BpmProcessInstanceSignature',
});

const emits = defineEmits(['success']);

const signature = ref<InstanceType<typeof Vue3Signature>>();

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // TODO @jason：这里需要使用类似 modalApi.lock() 么？类似别的模块
    message.success({
      content: '签名上传中，请稍等...',
    });
    const signFileUrl = await uploadFile({
      file: base64ToFile(signature?.value?.save('image/jpeg') || '', '签名'),
    });
    emits('success', signFileUrl);
    // TODO @jason：是不是不用主动 close？
    await modalApi.close();
  },
  // TODO @jason：这个是不是下面方法，可以删除；
  onOpenChange(visible) {
    if (!visible) {
      modalApi.close();
    }
  },
});
</script>

<template>
  <Modal title="流程签名" class="h-2/5 w-3/5">
    <div class="mb-2 flex justify-end">
      <Space>
        <Tooltip title="撤销上一步操作">
          <Button @click="signature?.undo()">
            <template #icon>
              <IconifyIcon icon="lucide:undo" class="mb-1 size-4" />
            </template>
            撤销
          </Button>
        </Tooltip>
        <Tooltip title="清空画布">
          <Button @click="signature?.clear()">
            <template #icon>
              <IconifyIcon icon="lucide:trash" class="mb-1 size-4" />
            </template>
            <span>清除</span>
          </Button>
        </Tooltip>
      </Space>
    </div>

    <Vue3Signature
      class="mx-auto border border-solid border-gray-300"
      ref="signature"
      w="874px"
      h="324px"
    />
  </Modal>
</template>
