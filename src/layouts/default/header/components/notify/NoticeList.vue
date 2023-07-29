<script lang="ts" setup>
import { computed, ref, unref, watch } from 'vue'
import { Avatar, List, Tag, Typography } from 'ant-design-vue'
import type { ListItem } from './data'
import { useDesign } from '@/hooks/web/useDesign'
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
const { prefixCls } = useDesign('header-notify-list')
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
  if (isNumber(pageSize) && pageSize > 0 && list && list.length > pageSize) {
    return {
      total: list.length,
      pageSize,
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
  <List :class="prefixCls" bordered :pagination="getPagination">
    <template v-for="item in getData" :key="item.id">
      <List.Item class="list-item">
        <List.Item.Meta>
          <template #title>
            <div class="title">
              <Typography.Paragraph
                style="width: 100%; margin-bottom: 0 !important"
                :style="{ cursor: isTitleClickable ? 'pointer' : '' }"
                :delete="!!item.titleDelete"
                :ellipsis="$props.titleRows && $props.titleRows > 0 ? { rows: $props.titleRows, tooltip: !!item.title } : false"
                :content="item.title"
                @click="handleTitleClick(item)"
              />
              <div v-if="item.extra" class="extra">
                <Tag class="tag" :color="item.color">
                  {{ item.extra }}
                </Tag>
              </div>
            </div>
          </template>

          <template #avatar>
            <Avatar v-if="item.avatar" class="avatar" :src="item.avatar" />
            <span v-else> {{ item.avatar }}</span>
          </template>

          <template #description>
            <div>
              <div v-if="item.description" class="description">
                <Typography.Paragraph
                  style="width: 100%; margin-bottom: 0 !important"
                  :ellipsis="$props.descRows && $props.descRows > 0 ? { rows: $props.descRows, tooltip: !!item.description } : false"
                  :content="item.description"
                />
              </div>
              <div class="datetime">
                {{ item.datetime }}
              </div>
            </div>
          </template>
        </List.Item.Meta>
      </List.Item>
    </template>
  </List>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-header-notify-list';

.@{prefix-cls} {
  &::-webkit-scrollbar {
    display: none;
  }

  ::v-deep(.ant-pagination-disabled) {
    display: inline-block !important;
  }

  &-item {
    padding: 6px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;

    .title {
      margin-bottom: 8px;
      font-weight: normal;

      .extra {
        float: right;
        margin-top: -1.5px;
        margin-right: 0;
        font-weight: normal;

        .tag {
          margin-right: 0;
        }
      }

      .avatar {
        margin-top: 4px;
      }

      .description {
        font-size: 12px;
        line-height: 18px;
      }

      .datetime {
        margin-top: 4px;
        font-size: 12px;
        line-height: 18px;
      }
    }
  }
}
</style>
