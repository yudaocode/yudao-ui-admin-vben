<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input } from 'antdv-next';

defineOptions({ name: 'HrmAttendanceGroupWifiForm' });

const emit = defineEmits<{
  confirm: [wifi: HrmAttendanceGroupApi.Wifi, index?: number];
}>();

const macPattern = /^((([0-9a-f]{2}:){5})|(([0-9a-f]{2}-){5}))[0-9a-f]{2}$/i;

const editIndex = ref<number>();
const formRef = ref();
const formData = ref<HrmAttendanceGroupApi.Wifi>(createDefault());

const formRules = reactive<Record<string, Rule[]>>({
  ssid: [{ required: true, message: 'WiFi 名称不能为空', trigger: 'blur' }],
  mac: [
    { required: true, message: 'MAC 地址不能为空', trigger: 'blur' },
    { pattern: macPattern, message: 'MAC 地址格式不正确', trigger: 'blur' },
  ],
});

function createDefault(): HrmAttendanceGroupApi.Wifi {
  return {
    ssid: '',
    mac: '',
  };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    emit('confirm', { ...formData.value }, editIndex.value);
    await modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<{
      index?: number;
      wifi?: HrmAttendanceGroupApi.Wifi;
    }>();
    editIndex.value = payload?.index;
    formData.value = payload?.wifi ? { ...payload.wifi } : createDefault();
  },
});

defineExpose({
  open(wifi?: HrmAttendanceGroupApi.Wifi, index?: number) {
    modalApi.setData({ wifi, index }).open();
  },
});
</script>

<template>
  <Modal
    :title="editIndex === undefined ? '新增打卡 WiFi' : '编辑打卡 WiFi'"
    class="w-[560px]"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="100px"
    >
      <FormItem label="WiFi 名称" name="ssid">
        <Input
          v-model:value="formData.ssid"
          :maxlength="50"
          placeholder="请输入 WiFi 名称"
        />
      </FormItem>
      <FormItem label="MAC 地址" name="mac">
        <Input
          v-model:value="formData.mac"
          :maxlength="17"
          placeholder="例如 00:11:22:33:44:55"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
