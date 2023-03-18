<template>
  <PageWrapper :class="prefixCls" title="标准列表">
    <div :class="`${prefixCls}__top`">
      <Row :gutter="12">
        <Col :span="8" :class="`${prefixCls}__top-col`">
          <div>我的待办</div>
          <p>8个任务</p>
        </Col>
        <Col :span="8" :class="`${prefixCls}__top-col`">
          <div>本周任务平均处理时间</div>
          <p>32分钟</p>
        </Col>
        <Col :span="8" :class="`${prefixCls}__top-col`">
          <div>本周完成任务数</div>
          <p>24个任务</p>
        </Col>
      </Row>
    </div>

    <div :class="`${prefixCls}__content`">
      <List :pagination="pagination">
        <template v-for="item in cardList" :key="item.id">
          <ListItem class="list">
            <ListItemMeta>
              <template #avatar>
                <Icon class="icon" v-if="item.icon" :icon="item.icon" :color="item.color" />
              </template>
              <template #title>
                <span>{{ item.title }}</span>
                <div class="extra" v-if="item.extra">
                  {{ item.extra }}
                </div>
              </template>
              <template #description>
                <div class="description">
                  {{ item.description }}
                </div>
                <div class="info">
                  <div><span>Owner</span>{{ item.author }}</div>
                  <div><span>开始时间</span>{{ item.datetime }}</div>
                </div>
                <div class="progress">
                  <Progress :percent="item.percent" status="active" />
                </div>
              </template>
            </ListItemMeta>
          </ListItem>
        </template>
      </List>
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
import { Progress, Row, Col } from 'ant-design-vue'
import Icon from '@/components/Icon'
import { cardList } from './data'
import { PageWrapper } from '@/components/Page'
import { List } from 'ant-design-vue'
import { useDesign } from '@/hooks/web/useDesign'

const ListItem = List.Item
const ListItemMeta = List.Item.Meta
const { prefixCls } = useDesign('list-basic')
const pagination = {
  show: true,
  pageSize: 3
}
</script>
<style lang="less" scoped>
.list-basic {
  &__top {
    padding: 24px;
    text-align: center;
    background-color: @component-background;

    &-col {
      &:not(:last-child) {
        border-right: 1px dashed @border-color-base;
      }

      div {
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 22px;
        color: @text-color;
      }

      p {
        margin: 0;
        font-size: 24px;
        line-height: 32px;
        color: @text-color;
      }
    }
  }

  &__content {
    padding: 24px;
    margin-top: 12px;
    background-color: @component-background;

    .list {
      position: relative;
    }

    .icon {
      font-size: 40px !important;
    }

    .extra {
      position: absolute;
      top: 20px;
      right: 15px;
      font-weight: normal;
      color: @primary-color;
      cursor: pointer;
    }

    .description {
      display: inline-block;
      width: 40%;
    }

    .info {
      display: inline-block;
      width: 30%;
      text-align: center;

      div {
        display: inline-block;
        padding: 0 20px;

        span {
          display: block;
        }
      }
    }

    .progress {
      display: inline-block;
      width: 15%;
      vertical-align: top;
    }
  }
}
</style>
