<script lang="ts" setup>
import type { GatewayType } from '../gateway-presets';

import type { AiModelApiKeyApi } from '#/api/ai/model/apiKey';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createApiKey, getApiKey, updateApiKey } from '#/api/ai/model/apiKey';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import {
  buildPresetPatch,
  GATEWAY_PRESETS,
  joinCapabilities,
  parseCapabilities,
} from '../gateway-presets';

const emit = defineEmits(['success']);
const formData = ref<AiModelApiKeyApi.ApiKey>();
const applyingPreset = ref(false);
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['API 密钥'])
    : $t('ui.actionTitle.create', ['API 密钥']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 130,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

function toSubmitPayload(raw: Record<string, any>): AiModelApiKeyApi.ApiKey {
  const capabilities = joinCapabilities(
    parseCapabilities(raw.capabilities as string | string[]),
  );
  let extraConfig = raw.extraConfig;
  if (typeof extraConfig === 'object' && extraConfig !== null) {
    extraConfig = JSON.stringify(extraConfig);
  }
  if (typeof extraConfig === 'string' && extraConfig.trim()) {
    try {
      JSON.parse(extraConfig);
    } catch {
      throw new Error('扩展 JSON 格式不正确');
    }
  }
  return {
    ...(raw as AiModelApiKeyApi.ApiKey),
    capabilities,
    extraConfig: extraConfig || undefined,
  };
}

async function applyGatewayPreset(type: GatewayType, forceUrl: boolean) {
  if (!type || applyingPreset.value) return;
  applyingPreset.value = true;
  try {
    const patch = buildPresetPatch(type);
    const current = (await formApi.getValues()) as Record<string, any>;
    await formApi.setValues({
      ...current,
      gatewayType: patch.gatewayType,
      capabilities: patch.capabilities,
      imageBodyStyle: patch.imageBodyStyle,
      preferResponsesApi: patch.preferResponsesApi,
      supportsAsync: patch.supportsAsync,
      visionImageDetail: patch.visionImageDetail,
      url: forceUrl || !current.url ? patch.url || current.url : current.url,
    });
  } finally {
    applyingPreset.value = false;
  }
}

function bindGatewayTypeChange() {
  formApi.updateSchema([
    {
      fieldName: 'gatewayType',
      componentProps: {
        options: GATEWAY_PRESETS.map((p) => ({
          label: p.label,
          value: p.value,
        })),
        placeholder: '先选官方或中转类型',
        onChange: (value: GatewayType) => {
          // 用户切换类型：套用该类型默认；编辑时不强制改已有 URL
          void applyGatewayPreset(value, !formData.value?.id);
        },
      },
    },
  ]);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const raw = (await formApi.getValues()) as Record<string, any>;
      const data = toSubmitPayload(raw);
      await (formData.value?.id ? updateApiKey(data) : createApiKey(data));
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } catch (error: any) {
      message.error(error?.message || '保存失败');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    await nextTick();
    bindGatewayTypeChange();
    const data = modalApi.getData() as AiModelApiKeyApi.ApiKey;
    if (!data?.id) {
      await formApi.resetForm();
      await applyGatewayPreset('openai_compatible', true);
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getApiKey(data.id);
      const row = formData.value;
      await formApi.setValues({
        ...row,
        capabilities: parseCapabilities(row.capabilities),
        gatewayType: row.gatewayType || 'openai_compatible',
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[760px]">
    <div class="mx-4 mb-2 text-xs text-gray-500">
      多中转 /
      官方请各建一条密钥。先选「接入类型」：官方只显示通用项，中转才显示生图风格、异步等专有项。
    </div>
    <Form class="mx-4" />
  </Modal>
</template>
