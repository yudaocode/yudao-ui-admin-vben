<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cloneDeep } from '@vben/utils';

import { Row, Space, Textarea } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import * as ChannelApi from '#/api/pay/channel';
import { FileUpload } from '#/components/upload';

import { modalWeixinSchema } from './data';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value
    ? $t('ui.actionTitle.edit', '应用')
    : $t('ui.actionTitle.create', '应用');
});

const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    // 默认占满两列
    formItemClass: 'col-span-2',
    // 默认label宽度 px
    labelWidth: 160,
    // 通用配置项 会影响到所有表单项
    componentProps: {
      class: 'w-full',
    },
  },
  schema: modalWeixinSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id, payCode } = modalApi.getData() as {
      id?: number;
      payCode?: string;
    };

    if (id && payCode) {
      const record =
        (await ChannelApi.getChannel(id, payCode)) ||
        ({} as ChannelApi.PayChannelApi.Channel);
      isUpdate.value = !!record;
      record.code = payCode;
      if (isUpdate.value) {
        record.config = JSON.parse(record.config);
      }
      await formApi.setValues(record);
    }

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // getValues获取为一个readonly的对象 需要修改必须先深拷贝一次
    const data = cloneDeep(
      await formApi.getValues(),
    ) as ChannelApi.PayChannelApi.Channel;
    data.config = JSON.stringify(data.config);
    await (isUpdate.value
      ? ChannelApi.updateChannel(data)
      : ChannelApi.createChannel(data));
    emit('reload');
    await handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

async function handleCancel() {
  modalApi.close();
  await formApi.resetForm();
}
</script>
<template>
  <BasicModal :close-on-click-modal="false" :title="title" class="w-[40%]">
    <BasicForm>
      <template #keyContent="slotProps">
        <Space style="width: 100%" direction="vertical">
          <Row>
            <Textarea
              v-bind="slotProps"
              :rows="8"
              placeholder="请上传 apiclient_cert.p12 证书"
            />
          </Row>
          <Row>
            <FileUpload
              :accept="['crt']"
              @return-text="
                (text: string) => {
                  slotProps.setValue(text);
                }
              "
            />
          </Row>
        </Space>
      </template>
      <template #privateKeyContent="slotProps">
        <Space style="width: 100%" direction="vertical">
          <Row>
            <Textarea
              v-bind="slotProps"
              :rows="8"
              placeholder="请上传 apiclient_key.pem 证书"
            />
          </Row>
          <Row>
            <FileUpload
              :accept="['.crt']"
              @return-text="
                (text: string) => {
                  slotProps.setValue(text);
                }
              "
            />
          </Row>
        </Space>
      </template>
    </BasicForm>
  </BasicModal>
</template>
