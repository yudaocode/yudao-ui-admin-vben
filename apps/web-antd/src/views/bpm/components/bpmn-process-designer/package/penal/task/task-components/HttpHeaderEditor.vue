<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input } from 'ant-design-vue';

defineOptions({ name: 'HttpHeaderEditor' });

const emit = defineEmits(['save']);

interface HeaderItem {
  key: string;
  value: string;
}

const headerList = ref<HeaderItem[]>([]);

// 解析请求头字符串为列表
const parseHeaders = (headersStr: string): HeaderItem[] => {
  if (!headersStr || !headersStr.trim()) {
    return [{ key: '', value: '' }];
  }

  const lines = headersStr.split('\n').filter((line) => line.trim());
  const parsed = lines.map((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      return {
        key: line.slice(0, Math.max(0, colonIndex)).trim(),
        value: line.slice(Math.max(0, colonIndex + 1)).trim(),
      };
    }
    return { key: line.trim(), value: '' };
  });

  return parsed.length > 0 ? parsed : [{ key: '', value: '' }];
};

// 将列表转换为请求头字符串
const stringifyHeaders = (headers: HeaderItem[]): string => {
  return headers
    .filter((item) => item.key.trim())
    .map((item) => `${item.key}: ${item.value}`)
    .join('\n');
};

// 添加请求头
const addHeader = () => {
  headerList.value.push({ key: '', value: '' });
};

// 移除请求头
const removeHeader = (index: number) => {
  if (headerList.value.length === 1) {
    // 至少保留一行
    headerList.value = [{ key: '', value: '' }];
  } else {
    headerList.value.splice(index, 1);
  }
};

// 保存
const handleSave = () => {
  const headersStr = stringifyHeaders(headerList.value);
  emit('save', headersStr);
  modalApi.close();
};

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const { headers } = modalApi.getData();
    headerList.value = parseHeaders(headers);
  },
  onConfirm: handleSave,
});
</script>

<template>
  <Modal title="编辑请求头" class="w-3/5">
    <div class="space-y-4">
      <div class="mb-2 space-y-3 overflow-y-auto">
        <div
          v-for="(item, index) in headerList"
          :key="index"
          class="flex items-center gap-2"
        >
          <Input
            v-model:value="item.key"
            placeholder="请输入参数名"
            class="w-48"
            allow-clear
          />
          <span class="font-medium text-gray-600">:</span>
          <Input
            v-model:value="item.value"
            placeholder="请输入参数值 (支持表达式 ${变量名})"
            class="flex-1"
            allow-clear
          />
          <Button type="text" danger size="small" @click="removeHeader(index)">
            <template #icon>
              <IconifyIcon icon="ep:delete" />
            </template>
          </Button>
        </div>
      </div>
      <Button type="primary" class="w-full" @click="addHeader">
        <template #icon>
          <IconifyIcon icon="ep:plus" />
        </template>
        添加请求头
      </Button>
    </div>
  </Modal>
</template>
