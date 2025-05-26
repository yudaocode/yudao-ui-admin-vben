<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Space, Tooltip } from 'ant-design-vue';
import Vue3Signature from 'vue3-signature';

import { uploadFile } from '#/api/infra/file';
import { download } from '#/utils';

defineOptions({
  name: 'BpmProcessInstanceSignature',
});

const emits = defineEmits(['success']);

const [Modal, modalApi] = useVbenModal({
  title: '流程签名',
  onOpenChange(visible) {
    if (!visible) {
      modalApi.close();
    }
  },
  onConfirm: () => {
    submit();
  },
});

const signature = ref<InstanceType<typeof Vue3Signature>>();

const open = async () => {
  modalApi.open();
};

defineExpose({ open });

const submit = async () => {
  message.success({
    content: '签名上传中请稍等。。。',
  });
  const signFileUrl = await uploadFile({
    file: download.base64ToFile(
      signature?.value?.save('image/jpeg') || '',
      '签名',
    ),
  });
  emits('success', signFileUrl);
  modalApi.close();
};
</script>

<template>
  <Modal class="h-[500px] w-[900px]">
    <div class="mb-2 flex justify-end">
      <Space>
        <Tooltip title="撤销上一步操作">
          <Button @click="signature?.undo()">
            <template #icon>
              <IconifyIcon icon="mi:undo" class="mb-[4px] size-[16px]" />
            </template>
            撤销
          </Button>
        </Tooltip>

        <Tooltip title="清空画布">
          <Button @click="signature?.clear()">
            <template #icon>
              <IconifyIcon
                icon="mdi:delete-outline"
                class="mb-[4px] size-[16px]"
              />
            </template>
            <span>清除</span>
          </Button>
        </Tooltip>
      </Space>
    </div>

    <Vue3Signature
      class="mx-auto border-[1px] border-solid border-gray-300"
      ref="signature"
      w="874px"
      h="324px"
    />
  </Modal>
</template>
