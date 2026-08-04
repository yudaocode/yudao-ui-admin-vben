<script lang="ts" setup>
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';

import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import {
  getRecruitPost,
  getRecruitPostSimpleList,
} from '#/api/hrm/recruit/post';

defineOptions({ name: 'HrmRecruitPostSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    showSearch?: boolean;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择招聘职位',
    showSearch: true,
  },
);

const emit = defineEmits<{
  change: [post: HrmRecruitPostApi.RecruitPost | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const postList = ref<HrmRecruitPostApi.RecruitPost[]>([]);
const selectedPost = ref<HrmRecruitPostApi.RecruitPost>();
const loading = ref(false);

const postOptions = computed(() => {
  const options = postList.value.filter(
    (post): post is HrmRecruitPostApi.RecruitPost & { id: number } =>
      post.id !== undefined,
  );
  const currentPost = selectedPost.value;
  if (
    currentPost?.id === undefined ||
    options.some((post) => post.id === currentPost.id)
  ) {
    return options;
  }
  return [
    currentPost as HrmRecruitPostApi.RecruitPost & { id: number },
    ...options,
  ];
});

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

/** 格式化招聘职位选项 */
function formatPostLabel(post: HrmRecruitPostApi.RecruitPost) {
  return post.deptName ? `${post.postName}（${post.deptName}）` : post.postName;
}

/** 补充当前选中的招聘职位，支持已停止招聘的职位回显 */
async function ensureSelectedPost() {
  const postId = props.modelValue;
  selectedPost.value = undefined;
  if (
    postId === undefined ||
    postList.value.some((post) => post.id === postId)
  ) {
    return;
  }
  const post = await getRecruitPost(postId);
  if (props.modelValue === postId && post?.id === postId) {
    selectedPost.value = post;
  }
}

/** 选中变化 */
function handleChange(value: number | undefined) {
  emit(
    'change',
    postOptions.value.find((post) => post.id === value),
  );
}

/** 获得招聘职位列表 */
async function getPostList() {
  loading.value = true;
  try {
    postList.value = await getRecruitPostSimpleList();
    await ensureSelectedPost();
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  () => {
    ensureSelectedPost();
  },
);

onMounted(() => {
  getPostList();
});
</script>

<template>
  <Select
    v-model:value="selectValue"
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :options="
      postOptions.map((post) => ({
        label: formatPostLabel(post),
        value: post.id,
      }))
    "
    :placeholder="placeholder"
    :show-search="showSearch"
    class="w-full"
    option-filter-prop="label"
    @change="handleChange"
  />
</template>
