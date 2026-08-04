<script lang="ts" setup>
import type { HrmRecruitChannelApi } from '#/api/hrm/recruit/channel';

import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import {
  getRecruitChannel,
  getRecruitChannelSimpleList,
} from '#/api/hrm/recruit/channel';

defineOptions({ name: 'HrmRecruitChannelSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    excludeIds?: number[];
    modelValue?: number;
    placeholder?: string;
    showSearch?: boolean;
  }>(),
  {
    clearable: true,
    disabled: false,
    excludeIds: () => [],
    modelValue: undefined,
    placeholder: '请选择招聘渠道',
    showSearch: true,
  },
);

const emit = defineEmits<{
  change: [channel: HrmRecruitChannelApi.RecruitChannel | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const channelList = ref<HrmRecruitChannelApi.RecruitChannel[]>([]);
const selectedChannel = ref<HrmRecruitChannelApi.RecruitChannel>();
const loading = ref(false);

const channelOptions = computed(() => {
  const options = channelList.value.filter(
    (
      channel,
    ): channel is HrmRecruitChannelApi.RecruitChannel & { id: number } =>
      channel.id !== undefined && !props.excludeIds.includes(channel.id),
  );
  const currentChannel = selectedChannel.value;
  if (
    currentChannel?.id === undefined ||
    props.excludeIds.includes(currentChannel.id) ||
    options.some((channel) => channel.id === currentChannel.id)
  ) {
    return options;
  }
  return [
    currentChannel as HrmRecruitChannelApi.RecruitChannel & { id: number },
    ...options,
  ];
});

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

/** 补充当前选中的招聘渠道，支持已停用渠道回显 */
async function ensureSelectedChannel() {
  const channelId = props.modelValue;
  selectedChannel.value = undefined;
  if (
    channelId === undefined ||
    channelId === null ||
    channelList.value.some((channel) => channel.id === channelId)
  ) {
    return;
  }
  const channel = await getRecruitChannel(channelId);
  if (props.modelValue === channelId && channel?.id === channelId) {
    selectedChannel.value = channel;
  }
}

/** 选中变化 */
function handleChange(value: number | undefined) {
  emit(
    'change',
    channelOptions.value.find((channel) => channel.id === value),
  );
}

/** 获得招聘渠道列表 */
async function getChannelList() {
  loading.value = true;
  try {
    channelList.value = await getRecruitChannelSimpleList();
    await ensureSelectedChannel();
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  () => {
    ensureSelectedChannel();
  },
);

onMounted(() => {
  getChannelList();
});
</script>

<template>
  <Select
    v-model:value="selectValue"
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :options="
      channelOptions.map((channel) => ({
        label: channel.name,
        value: channel.id,
      }))
    "
    :placeholder="placeholder"
    :show-search="showSearch"
    class="w-full"
    option-filter-prop="label"
    @change="handleChange"
  />
</template>
