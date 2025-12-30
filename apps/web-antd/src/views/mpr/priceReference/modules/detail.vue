<script lang="ts" setup>
import type { PriceReferenceApi } from '#/api/mpr/priceReference';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useDescription } from '#/components/description';
import Form from '#/views/mpr/priceReference/modules/form.vue';

import { useDetailSchema } from '../data';

const emit = defineEmits(['refresh']);

const priceReference = ref<PriceReferenceApi.PriceReference>();

const [BaseDescription] = useDescription({
  componentProps: {
    // title: '基本信息',
    bordered: false,
    column: 2,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Modal, modalApi] = useVbenModal({
  onConfirm: async () => {
    // await modalApi.close();
    formModalApi.setData(priceReference.value).open();
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      // detailData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<PriceReferenceApi.PriceReference>();
    if (!data || !data.id) {
      return;
    }
    priceReference.value = data;
  },
});

function onSuccess() {
  emit('refresh');
  modalApi.close();
}
</script>

<template>
  <Modal
    draggable
    title="参考价格详情"
    confirm-text="修改"
    :show-cancel-button="false"
  >
    <FormModal @success="onSuccess" />
    <div class="p-4">
      <BaseDescription :data="priceReference" />
    </div>
  </Modal>
</template>
