<script lang="ts" setup>
import type { PriceReferenceApi } from '#/api/mpr/priceReference';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { PlusOutlined } from '@ant-design/icons-vue';
import { message, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createPriceReference,
  getPriceReference,
  updatePriceReference,
} from '#/api/mpr/priceReference';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<PriceReferenceApi.PriceReference>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['参考价格'])
    : $t('ui.actionTitle.create', ['参考价格']);
});

// 通过选择事件，实现select 在mode=tags模式下 能够单选
const handleChange = (newValue, _record) => {
  // 限制只能选择一个
  if (newValue.length > 1) {
    // 保留最后一个选择的项
    formApi.setFieldValue('source', [newValue[newValue.length - 1]]);
  }
};

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(handleChange),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as PriceReferenceApi.PriceReference;
    try {
      await (formData.value?.id
        ? updatePriceReference(data)
        : createPriceReference(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    let data = modalApi.getData<PriceReferenceApi.PriceReference>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getPriceReference(data.id);
      } finally {
        modalApi.unlock();
      }
    }
    // 设置到 values
    formData.value = data;
    await formApi.setValues(formData.value);
  },
});
</script>

<template>
  <Modal draggable :title="getTitle">
    <Form class="mx-4">
      <template #fieldSource="{ model, field }">
        <a-select
          v-model:value="model[field]"
          mode="tags"
          placeholder="Tags Mode"
          :options="[]"
          @change="handleChange(newValue, record)"
          :max-tag-count="1"
        />
      </template>
      <template #field-priceReference="{ value }">
        <div class="text-base">
          <span class="font-bold text-red-500">
            {{ value }}
          </span>
          <Tag
            v-for="item in priceReferences"
            :key="item.id"
            closable
            @click="handleEdit(item)"
            @close.prevent="
              () => {
                console.log('close.prevent??');
              }
            "
          >
            {{ item.formattedAmount }}
          </Tag>
          <Tag
            style="background: #fff; border-style: dashed"
            @click="newPriceReference"
          >
            <PlusOutlined />
            新建
          </Tag>
        </div>
      </template>
    </Form>
  </Modal>
</template>
