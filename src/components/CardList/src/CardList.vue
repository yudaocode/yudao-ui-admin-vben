<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { EditOutlined, EllipsisOutlined, RedoOutlined, TableOutlined } from '@ant-design/icons-vue'
import { Avatar, Card, Image, List, Slider, Tooltip, Typography } from 'ant-design-vue'
import { grid, useSlider } from './data'
import { Dropdown } from '@/components/Dropdown'
import type { FormSchema } from '@/components/Form'
import { BasicForm, useForm } from '@/components/Form'
import { propTypes } from '@/utils/propTypes'
import { Button } from '@/components/Button'
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
})
// 暴露内部方法
const emit = defineEmits(['getMethod', 'delete'])
// 获取slider属性
const sliderProp = computed(() => useSlider(4))
// 数据
const data = ref([])
// 切换每行个数
// cover图片自适应高度
// 修改pageSize并重新请求数据

const height = computed(() => {
  return `h-${120 - grid.value * 6}`
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

// 自动请求并暴露内部方法
onMounted(() => {
  fetch()
  emit('getMethod', fetch)
})

// 分页相关
const page = ref(1)
const pageSize = ref(36)
const total = ref(0)
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

async function fetch(p = {}) {
  const { api, params } = props
  if (api && isFunction(api)) {
    const res = await api({ ...params, page: page.value, pageSize: pageSize.value, ...p })
    data.value = res.list
    total.value = res.total
  }
}

function pageChange(p: number, pz: number) {
  page.value = p
  pageSize.value = pz
  fetch()
}
function pageSizeChange(_current, size: number) {
  pageSize.value = size
  fetch()
}

// 表单提交
async function handleSubmit() {
  const data = await validate()
  await fetch(data)
}
function sliderChange(n: number) {
  pageSize.value = n * 4
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
                <Slider id="slider" v-bind="sliderProp" v-model:value="grid" @change="sliderChange" />
              </template>
              <Button><TableOutlined /></Button>
            </Tooltip>
            <Tooltip @click="fetch">
              <template #title>
                刷新
              </template>
              <Button><RedoOutlined /></Button>
            </Tooltip>
          </div>
        </template>
        <template #renderItem="{ item }">
          <List.Item>
            <Card>
              <template #title />
              <template #cover>
                <div :class="height">
                  <Image :src="item.imgs[0]" />
                </div>
              </template>
              <template #actions>
                <!--              <SettingOutlined key="setting" /> -->
                <EditOutlined />
                <Dropdown
                  :trigger="['hover']"
                  :drop-menu-list="[
                    {
                      text: '删除',
                      event: '1',
                      popConfirm: {
                        title: '是否确认删除',
                        confirm: handleDelete.bind(null, item.id),
                      },
                    },
                  ]"
                  popconfirm
                >
                  <EllipsisOutlined />
                </Dropdown>
              </template>

              <Card.Meta>
                <template #title>
                  <Typography.Paragraph :content="item.name" :ellipsis="{ tooltip: item.address }" />
                </template>
                <template #avatar>
                  <Avatar :src="item.avatar" />
                </template>
                <template #description>
                  {{ item.time }}
                </template>
              </Card.Meta>
            </Card>
          </List.Item>
        </template>
      </List>
    </div>
  </div>
</template>
