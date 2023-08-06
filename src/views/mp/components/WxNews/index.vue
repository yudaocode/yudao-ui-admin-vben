<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { RedoOutlined, TableOutlined } from '@ant-design/icons-vue'
import { Avatar, Card, Image, List, Slider, Tooltip, Typography } from 'ant-design-vue'
import { Icon } from '@/components/Icon'
import type { FormSchema } from '@/components/Form'
import { BasicForm, useForm } from '@/components/Form'
import { propTypes } from '@/utils/propTypes'
import { isFunction } from '@/utils/is'

// 组件接收参数
const props = defineProps({
  // 请求API的参数
  params: propTypes.object.def({}),
  // api
  api: propTypes.func,
  searchSchema: {
    type: Array,
  },
  grid: propTypes.number.def(12),
  minSlider: propTypes.number.def(6),
  maxSlider: propTypes.number.def(12),
})
// 暴露内部方法
const emit = defineEmits(['getMethod', 'delete'])
const ListItem = List.Item
const CardMeta = Card.Meta
const TypographyText = Typography.Text

// 分页相关
const page = ref(1)
const pageSize = ref(36)
const total = ref(0)

// 获取slider属性
const sliderProp = computed(() => useSlider())

function useSlider() {
  const min = props.minSlider
  const max = props.maxSlider
  // 每行显示个数滑动条
  const getMarks = () => {
    const l = {}
    for (let i = min; i < max + 1; i++) {
      l[i] = {
        style: {
          color: '#fff',
        },
        label: i,
      }
    }
    return l
  }
  return {
    min,
    max,
    marks: getMarks(),
    step: 1,
  }
}

// 数据
const data = ref([])
// 切换每行个数
// cover图片自适应高度
// 修改pageSize并重新请求数据

const height = computed(() => {
  return `h-${120 - props.grid * 6}`
})
// 表单
const [registerForm, { validate }] = useForm({
  schemas: props.searchSchema as FormSchema[],
  labelWidth: 80,
  baseColProps: { span: 6 },
  actionColOptions: { span: 24 },
  autoSubmitOnEnter: true,
  submitFunc: handleSubmit,
})
// 表单提交
async function handleSubmit() {
  const data = await validate()
  await fetch(data)
}
function sliderChange(n: number) {
  pageSize.value = n * 4
  fetch()
}

// 自动请求并暴露内部方法
onMounted(() => {
  fetch()
  emit('getMethod', fetch)
})

async function fetch(p = {}) {
  const { api, params } = props
  if (api && isFunction(api)) {
    const res = await api({ ...params, page: page.value, pageSize: pageSize.value, ...p })
    data.value = res.list
    total.value = res.total
  }
}
// 分页相关
const paginationProp = ref({
  showSizeChanger: false,
  showQuickJumper: true,
  pageSize,
  current: page,
  total,
  showTotal: (total: number) => `总 ${total} 条`,
  onChange: pageChange,
  onShowSizeChange: pageSizeChange,
})

function pageChange(p: number, pz: number) {
  page.value = p
  pageSize.value = pz
  fetch()
}
function pageSizeChange(_current, size: number) {
  pageSize.value = size
  fetch()
}

async function handleDelete(id) {
  emit('delete', id)
}
</script>

<template>
  <div class="p-2">
    <div class="p-4 mb-2">
      <BasicForm @register="registerForm" />
    </div>
    <div class="p-2">
      <List :grid="{ gutter: 5, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: grid }" :data-source="data" :pagination="paginationProp">
        <template #header>
          <div class="flex justify-end space-x-2">
            <slot name="header" />
            <Tooltip>
              <template #title>
                <div class="w-50">
                  每行显示数量
                </div>
                <Slider id="slider" v-bind="sliderProp" :value="grid" @change="sliderChange" />
              </template>
              <a-button><TableOutlined /></a-button>
            </Tooltip>
            <Tooltip @click="fetch">
              <template #title>
                刷新
              </template>
              <a-button><RedoOutlined /></a-button>
            </Tooltip>
          </div>
        </template>
        <template #renderItem="{ item }">
          <ListItem>
            <Card>
              <template #title>
                {{ item.content.newsItem[0].title }}
              </template>
              <template #cover>
                <div :class="height">
                  <Image :src="item.content.newsItem[0].thumbUrl" />
                </div>
              </template>
              <template #actions>
                <Icon icon="ant-design:delete-outlined" @click="handleDelete.bind(null, item.id)" />
              </template>

              <CardMeta>
                <template #title>
                  <TypographyText :content="item.name" :ellipsis="{ tooltip: item.address }" />
                </template>
                <template #avatar>
                  <Avatar :src="item.avatar" />
                </template>
                <template #description>
                  {{ item.time }}
                </template>
              </CardMeta>
            </Card>
          </ListItem>
        </template>
      </List>
    </div>
  </div>
</template>
