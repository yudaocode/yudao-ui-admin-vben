<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  SelectOption,
} from 'antdv-next';

import { MapDialog } from '#/components/map';
import { HRM_ATTENDANCE_POINT_RADIUS_OPTIONS } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmAttendanceGroupPointForm' });

const emit = defineEmits<{
  confirm: [point: HrmAttendanceGroupApi.Point, index?: number];
}>();

const editIndex = ref<number>();
const formRef = ref();
const mapDialogRef = ref<InstanceType<typeof MapDialog>>();
const formData = ref<HrmAttendanceGroupApi.Point>(createDefault());

const formRules = reactive<Record<string, Rule[]>>({
  name: [{ required: true, message: '地点名称不能为空', trigger: 'blur' }],
  address: [{ required: true, message: '打卡地址不能为空', trigger: 'blur' }],
  longitude: [{ required: true, message: '经度不能为空', trigger: 'change' }],
  latitude: [{ required: true, message: '纬度不能为空', trigger: 'change' }],
  radius: [{ required: true, message: '打卡范围不能为空', trigger: 'change' }],
});

function createDefault(): HrmAttendanceGroupApi.Point {
  return {
    name: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    radius: 300,
  };
}

function openMap() {
  const longitude = Number.isFinite(formData.value.longitude)
    ? formData.value.longitude
    : undefined;
  const latitude = Number.isFinite(formData.value.latitude)
    ? formData.value.latitude
    : undefined;
  mapDialogRef.value?.open(longitude, latitude);
}

function handleMapConfirm(data: {
  address: string;
  latitude: string;
  longitude: string;
}) {
  formData.value.longitude = Number(data.longitude);
  formData.value.latitude = Number(data.latitude);
  if (data.address) {
    formData.value.address = data.address;
  }
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
      point?: HrmAttendanceGroupApi.Point;
    }>();
    editIndex.value = payload?.index;
    formData.value = payload?.point ? { ...payload.point } : createDefault();
  },
});

defineExpose({
  open(point?: HrmAttendanceGroupApi.Point, index?: number) {
    modalApi.setData({ point, index }).open();
  },
});
</script>

<template>
  <Modal
    :title="editIndex === undefined ? '新增打卡地址' : '编辑打卡地址'"
    class="w-[640px]"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="100px"
    >
      <FormItem label="地点名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="50"
          placeholder="请输入地点名称"
        />
      </FormItem>
      <FormItem label="打卡地址" name="address">
        <Input
          v-model:value="formData.address"
          :maxlength="255"
          placeholder="请选择或输入地址"
        />
      </FormItem>
      <FormItem label="经纬度" required>
        <div class="flex w-full items-center gap-2">
          <FormItem class="mb-0 flex-1" name="longitude">
            <InputNumber
              v-model:value="formData.longitude"
              :controls="false"
              :max="180"
              :min="-180"
              :precision="6"
              class="w-full"
              placeholder="经度"
            />
          </FormItem>
          <FormItem class="mb-0 flex-1" name="latitude">
            <InputNumber
              v-model:value="formData.latitude"
              :controls="false"
              :max="90"
              :min="-90"
              :precision="6"
              class="w-full"
              placeholder="纬度"
            />
          </FormItem>
          <Button type="primary" @click="openMap">地图选点</Button>
        </div>
      </FormItem>
      <FormItem label="打卡范围" name="radius">
        <Select v-model:value="formData.radius" class="w-[240px]">
          <SelectOption
            v-for="radius in HRM_ATTENDANCE_POINT_RADIUS_OPTIONS"
            :key="radius"
            :value="radius"
          >
            {{ radius }} 米
          </SelectOption>
        </Select>
      </FormItem>
    </Form>
    <MapDialog ref="mapDialogRef" @confirm="handleMapConfirm" />
  </Modal>
</template>
