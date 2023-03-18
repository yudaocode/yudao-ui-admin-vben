<template>
  <PageWrapper title="单号：234231029431" contentBackground>
    <template #extra>
      <a-button> 操作一 </a-button>
      <a-button> 操作二 </a-button>
      <a-button type="primary"> 主操作 </a-button>
    </template>

    <template #footer>
      <Tabs default-active-key="1">
        <TabPane key="1" tab="详情" />
        <TabPane key="2" tab="规则" />
      </Tabs>
    </template>

    <div class="pt-4 m-4 desc-wrap">
      <Descriptions size="small" :column="2">
        <DescriptionItem label="创建人"> 曲丽丽 </DescriptionItem>
        <DescriptionItem label="订购产品"> XX 服务 </DescriptionItem>
        <DescriptionItem label="创建时间"> 2017-01-10 </DescriptionItem>
        <DescriptionItem label="关联单据">
          <a>12421</a>
        </DescriptionItem>
        <DescriptionItem label="生效日期"> 2017-07-07 ~ 2017-08-08 </DescriptionItem>
        <DescriptionItem label="备注"> 请于两个工作日内确认 </DescriptionItem>
      </Descriptions>
      <Card title="流程进度" :bordered="false">
        <Steps :current="1" progress-dot size="small">
          <Step title="创建项目">
            <template #description>
              <div>Vben</div>
              <p>2016-12-12 12:32</p>
            </template>
          </Step>
          <Step title="部门初审">
            <template #description>
              <p>Chad</p>
            </template>
          </Step>
          <Step title="财务复核" />
          <Step title="完成" />
        </Steps>
      </Card>

      <Card title="用户信息" :bordered="false" class="mt-5">
        <Descriptions :column="3">
          <DescriptionItem label="用户姓名"> 付小小 </DescriptionItem>
          <DescriptionItem label="会员卡号"> XX 32943898021309809423 </DescriptionItem>
          <DescriptionItem label="身份证"> 3321944288191034921 </DescriptionItem>
          <DescriptionItem label="联系方式"> 18112345678 </DescriptionItem>
          <DescriptionItem label="联系地址" :span="2"> 曲丽丽 18100000000 浙江省杭州市西湖区黄姑山路工专路交叉路口 </DescriptionItem>
        </Descriptions>

        <Descriptions title="信息组" :column="3">
          <DescriptionItem label="某某数据"> 111 </DescriptionItem>
          <DescriptionItem label="该数据更新时间"> 2017-08-08 </DescriptionItem>
          <DescriptionItem label="某某数据"> 725 </DescriptionItem>
          <DescriptionItem label="该数据更新时间"> 2017-08-08 </DescriptionItem>
        </Descriptions>

        <h4>信息组</h4>
        <Card title="多层级信息组">
          <Descriptions title="组名称" :column="3">
            <DescriptionItem label="负责人"> 林东东 </DescriptionItem>
            <DescriptionItem label="角色码"> 1234567 </DescriptionItem>
            <DescriptionItem label="所属部门"> XX公司 - YY部 </DescriptionItem>
            <DescriptionItem label="过期时间"> 2017-08-08 </DescriptionItem>
            <DescriptionItem label="描述" :span="2"> 这段描述很长很长很长很长很长很长很长很长很长很长很长很长很长很长... </DescriptionItem>
          </Descriptions>
          <Divider />
          <Descriptions title="组名称" :column="1">
            <DescriptionItem label="学名">
              Citrullus lanatus (Thunb.) Matsum. et Nakai一年生蔓生藤本；茎、枝粗壮，具明显的棱。卷须较粗..
            </DescriptionItem>
          </Descriptions>
          <Divider />
          <Descriptions title="组名称" :column="1">
            <DescriptionItem label="负责人"> 付小小 </DescriptionItem>
            <DescriptionItem label="角色码"> 1234568 </DescriptionItem>
          </Descriptions>
        </Card>
      </Card>
      <Card title="用户近半年来电记录" class="my-5">
        <Empty />
      </Card>
      <BasicTable @register="registerTimeTable" />
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
import { BasicTable, useTable } from '@/components/Table'
import { PageWrapper } from '@/components/Page'
import { Divider, Card, Empty, Descriptions, Steps, Tabs } from 'ant-design-vue'

import { refundTimeTableSchema, refundTimeTableData } from './data'

const Step = Steps.Step
const TabPane = Tabs.TabPane
const DescriptionItem = Descriptions.Item

const [registerTimeTable] = useTable({
  title: '退货进度',
  columns: refundTimeTableSchema,
  pagination: false,
  dataSource: refundTimeTableData,
  showIndexColumn: false,
  scroll: { y: 300 }
})
</script>
