<script lang="ts" setup>
import { computed, ref, unref, watch } from 'vue'
import { Avatar, List, Tag, Typography } from 'ant-design-vue'
import type { ListItem } from './data'
import { isNumber } from '@/utils/is'

const props = defineProps({
  list: {
    type: Array as PropType<ListItem[]>,
    default: () => [],
  },
  pageSize: {
    type: [Boolean, Number] as PropType<boolean | number>,
    default: 5,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  titleRows: {
    type: Number,
    default: 1,
  },
  descRows: {
    type: Number,
    default: 2,
  },
  onTitleClick: {
    type: Function as PropType<(Recordable) => void>,
  },
})
const emit = defineEmits(['update:currentPage'])
const current = ref(props.currentPage || 1)
const getData = computed(() => {
  const { pageSize, list } = props
  if (pageSize === false)
    return []
  const size = isNumber(pageSize) ? pageSize : 5
  return list.slice(size * (unref(current) - 1), size * unref(current))
})
watch(
  () => props.currentPage,
  (v) => {
    current.value = v
  },
)
const isTitleClickable = computed(() => !!props.onTitleClick)
const getPagination = computed(() => {
  const { list, pageSize } = props
  // compatible line 104
  // if typeof pageSize is boolean, Number(true) && 5 = 5, Number(false) && 5 = 0
  const size = isNumber(pageSize) ? pageSize : Number(pageSize) && 5
  if (size > 0 && list && list.length > size) {
    return {
      total: list.length,
      pageSize: size,
      // size: 'small',
      current: unref(current),
      onChange(page) {
        current.value = page
        emit('update:currentPage', page)
      },
    }
  }
  else {
    return false
  }
})

function handleTitleClick(item: ListItem) {
  props.onTitleClick && props.onTitleClick(item)
}
</script>

<template>
  <List class="display-none" bordered :pagination="getPagination">
    <template v-for="item in getData" :key="item.id">
      <List.Item class="cursor-pointer overflow-hidden p-1.5 transition-all delay-300">
        <List.Item.Meta>
          <template #title>
            <div class="mb-2 font-normal">
              <Typography.Paragraph
                style="width: 100%; margin-bottom: 0 !important"
                :style="{ cursor: isTitleClickable ? 'pointer' : '' }"
                :delete="!!item.titleDelete"
                :ellipsis="$props.titleRows && $props.titleRows > 0 ? { rows: $props.titleRows, tooltip: !!item.title } : false"
                :content="item.title"
                @click="handleTitleClick(item)"
              />
              <div v-if="item.extra" class="float-right mr-0 font-normal -mt-0.375">
                <Tag class="mr-0" :color="item.color">
                  {{ item.extra }}
                </Tag>
              </div>
            </div>
          </template>

          <template #avatar>
            <Avatar v-if="item.avatar" class="mt-1" :src="item.avatar" />
            <span v-else> {{ item.avatar }}</span>
          </template>

          <template #description>
            <div>
              <div v-if="item.description" class="text-xs/18">
                <Typography.Paragraph
                  style="width: 100%; margin-bottom: 0 !important"
                  :ellipsis="$props.descRows && $props.descRows > 0 ? { rows: $props.descRows, tooltip: !!item.description } : false"
                  :content="item.description"
                />
              </div>
              <div class="mt-1 text-xs/18">
                {{ item.datetime }}
              </div>
            </div>
          </template>
        </List.Item.Meta>
      </List.Item>
    </template>
  </List>
</template>
