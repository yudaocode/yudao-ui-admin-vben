<template>
  <PageWrapper :class="prefixCls" title="公众号图文">
    <template #headerContent>
      请选择公众号
      <div :class="`${prefixCls}__link`">
        <Select :value="queryParams.accountId" style="width: 200px" @change="getList">
          <SelectOption v-for="item in accounts" :label="item.name" :value="parseInt(item.id)" :key="parseInt(item.id)" />
        </Select>
        <!-- <a><Icon icon="bx:bx-paper-plane" color="#1890ff" /><span>开始</span></a>
        <a><Icon icon="carbon:warning" color="#1890ff" /><span>简介</span></a>
        <a><Icon icon="ion:document-text-outline" color="#1890ff" /><span>文档</span></a> -->
      </div>
    </template>

    <div :class="`${prefixCls}__content`">
      <List :grid="{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 3, xxxl: 2 }" :data-source="cardList">
        <template v-for="item in cardList" :key="item.title">
          <ListItem>
            <Card :hoverable="true" :class="`${prefixCls}__card`">
              <List>
                <template v-for="(article, index) in item.content.newsItem" :key="index">
                  <ListItem>
                    <Image :src="article.picUrl" :key="index" />
                    <div :class="`${prefixCls}__card-title`">
                      {{ article.title }}
                    </div>
                    <div :class="`${prefixCls}__card-detail`"></div>
                  </ListItem>
                </template>
              </List>
              <!-- <div :class="`${prefixCls}__card-title`">
                <Icon class="icon" v-if="item.icon" :icon="item.icon" :color="item.color" />
                {{ item.title }}
              </div>
              <div :class="`${prefixCls}__card-detail`"> 基于Vue Next, TypeScript, Ant Design Vue实现的一套完整的企业级后台管理系统 </div> -->
            </Card>
          </ListItem>
        </template>
      </List>
      <Pagination showLessItems size="small" :pageSize="queryParams.queryParamsSize" :total="queryParams.total" @change="getList" />
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
// import Icon from '@/components/Icon'
import { PageWrapper } from '@/components/Page'
import { Card, List, Image, Select, Pagination } from 'ant-design-vue'
import { useDesign } from '@/hooks/web/useDesign'
import { ref, reactive, onMounted } from 'vue'
import { getSimpleAccounts } from '@/api/mp/account'
import { useMessage } from '@/hooks/web/useMessage'
import { getFreePublishPage } from '@/api/mp/freePublish'

const ListItem = List.Item
const SelectOption = Select.Option

const { prefixCls } = useDesign('list-card')
const { createMessage } = useMessage()

const cardList = ref<any[]>([])

const accounts = ref()

const queryParams = reactive({
  accountId: null,
  total: 0,
  currentPage: 1,
  queryParamsSize: 20
})

async function init() {
  const res = await getSimpleAccounts()
  accounts.value = res
  if (accounts.value.length > 0) {
    queryParams.accountId = accounts.value[0].id
  }
  await getList()
}

async function getList() {
  if (!queryParams.accountId) {
    createMessage.error('未选中公众号，无法查询已发表图文!')
    return false
  }
  const res = await getFreePublishPage(queryParams)
  cardList.value = res.list
  queryParams.total = res.total
}

onMounted(async () => {
  await init()
})
</script>
<style lang="less" scoped>
.list-card {
  &__link {
    margin-top: 10px;
    font-size: 14px;

    a {
      margin-right: 30px;
    }

    span {
      margin-left: 5px;
    }
  }

  &__card {
    width: 100%;
    margin-bottom: -8px;

    .ant-card-body {
      padding: 16px;
    }

    &-title {
      margin-bottom: 5px;
      font-size: 16px;
      font-weight: 500;
      color: @text-color;

      .icon {
        margin-top: -5px;
        margin-right: 10px;
        font-size: 38px !important;
      }
    }

    &-detail {
      padding-top: 10px;
      padding-left: 30px;
      font-size: 14px;
      color: @text-color-secondary;
    }
  }
}
</style>
