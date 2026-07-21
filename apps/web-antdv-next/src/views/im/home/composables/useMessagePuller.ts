import type { Message } from '../types'

import type { ImChannelMessageApi } from '#/api/im/message/channel'
import type { ImGroupMessageApi } from '#/api/im/message/group'
import type { ImPrivateMessageApi } from '#/api/im/message/private'

import { watch } from 'vue'

import { pullChannelMessageList as apiPullChannelMessageList } from '#/api/im/message/channel'
import {
  getGroupMessageList as apiGetGroupMessageList,
  pullGroupMessageList as apiPullGroupMessageList
} from '#/api/im/message/group'
import {
  getPrivateMaxReadMessageId as apiGetPrivateMaxReadMessageId,
  getPrivateMessageList as apiGetPrivateMessageList,
  pullPrivateMessageList as apiPullPrivateMessageList
} from '#/api/im/message/private'

import { buildChannelConversationStub } from '../../utils/channel'
import {
  MESSAGE_GROUP_PULL_SIZE,
  MESSAGE_PRIVATE_PULL_SIZE,
  MESSAGE_PRIVATE_READ_ENABLED
} from '../../utils/config'
import {
  ImContentType,
  ImConversationType,
  ImMessageStatus,
  isFriendChatTip,
  isFriendNotification
} from '../../utils/constants'
import { type DbClient, initDb } from '../../utils/db'
import { generateClientMessageId, getPrivateMessagePeerId } from '../../utils/message'
import { runMinIdPull } from '../../utils/pull'
import { getFriendDisplayName, getGroupDisplayName } from '../../utils/user'
import { useConversationStore } from '../store/conversationStore'
import { useFriendStore } from '../store/friendStore'
import { useGroupRequestStore } from '../store/groupRequestStore'
import { useGroupStore } from '../store/groupStore'
import { type PulledMessage, useMessageStore } from '../store/messageStore'
import { useRtcStore } from '../store/rtcStore'
import { useImWebSocketStore } from '../store/websocketStore'

type ImPrivateMessageRespVO = ImPrivateMessageApi.PrivateMessageRespVO
type ImGroupMessageRespVO = ImGroupMessageApi.GroupMessageRespVO
type ImChannelMessageRespVO = ImChannelMessageApi.ChannelMessageRespVO

/** 三类消息 pull 接口返回的原始 VO 联合类型；runMinIdPull 只需 id 推进游标，具体分发在 applyPage 内按类型 cast */
type PulledRawMessage = ImChannelMessageRespVO | ImGroupMessageRespVO | ImPrivateMessageRespVO

/**
 * 消息增量拉取：登录后分页拉取离线期间的新消息
 *
 * 设计要点：
 * 1. 同时拉取私聊 + 群聊，使用各自的 `minId` 游标（privateMessageMaxId / groupMessageMaxId）
 * 2. 后端一次最多返回 size 条；前端按 minId 持续翻页，直到接口返回空列表为止
 * 3. 拉取期间 conversationStore.loading=true：
 *    - conversationStore 跳过批量持久化，避免频繁写入卡顿
 *    - websocketStore 把新来的 WS 普通消息丢进缓冲区，等循环结束后统一回放
 * 4. WebSocket 重连后会再触发一次拉取，补齐断网期间错过的消息
 */
export const useMessagePuller = () => {
  const conversationStore = useConversationStore()
  const messageStore = useMessageStore()
  const wsStore = useImWebSocketStore()
  const friendStore = useFriendStore()
  const groupStore = useGroupStore()
  const groupRequestStore = useGroupRequestStore()
  const rtcStore = useRtcStore()

  /** 判断请求是否被主动取消 */
  const isAbortError = (e: unknown): boolean => {
    const error = e as { code?: string; message?: string; name?: string; }
    return (
      error?.name === 'CanceledError' ||
      error?.code === 'ERR_CANCELED' ||
      error?.message === 'canceled'
    )
  }

  /** 服务端私聊消息 -> 本地 Message：targetId 是会话主键（对端 userId） */
  const convertPrivateMessage = (
    message: ImPrivateMessageRespVO,
    currentUserId: number
  ): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || generateClientMessageId(),
      type: message.type,
      content: message.content,
      status: message.status,
      receiptStatus: message.receiptStatus,
      sendTime: new Date(message.sendTime).getTime(),
      senderId: message.senderId,
      targetId: getPrivateMessagePeerId(message, currentUserId),
      selfSend: message.senderId === currentUserId
    }
  }

  /** 服务端群聊消息 -> 本地 Message */
  const convertGroupMessage = (message: ImGroupMessageRespVO, currentUserId: number): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || generateClientMessageId(),
      type: message.type,
      content: message.content,
      status: message.status,
      sendTime: new Date(message.sendTime).getTime(),
      senderId: message.senderId,
      targetId: message.groupId,
      selfSend: message.senderId === currentUserId,
      atUserIds: message.atUserIds || [],
      receiverUserIds: message.receiverUserIds || [],
      receiptStatus: message.receiptStatus,
      readCount: message.readCount
    }
  }

  /** 服务端频道消息 -> 本地 Message */
  const convertChannelMessage = (message: ImChannelMessageRespVO): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || generateClientMessageId(),
      type: message.type,
      content: message.content,
      status: ImMessageStatus.NORMAL, // 频道无撤回，恒为正常
      receiptStatus: message.receiptStatus, // 频道已读态：DONE 已读 / PENDING 未读
      sendTime: new Date(message.sendTime).getTime(),
      senderId: 0, // 系统下发，无发送人
      targetId: message.channelId, // 会话归属到频道编号
      selfSend: false,
      materialId: message.materialId // 详情页拉富文本用
    }
  }

  /** 频道：会话归属到 channelId；name / avatar 暂用占位，将来接入 channelStore 后再填真值 */
  const convertChannelConversation = (message: ImChannelMessageRespVO) =>
    buildChannelConversationStub(message.channelId)

  /** 私聊：会话归属到对端 userId */
  const convertPrivateConversation = (message: ImPrivateMessageRespVO, currentUserId: number) => {
    const targetId = getPrivateMessagePeerId(message, currentUserId)
    const friend = friendStore.getFriend(targetId)
    return {
      type: ImConversationType.PRIVATE,
      targetId,
      name: friend ? getFriendDisplayName(friend) : String(targetId), // 会话列表 / 顶部标题展示：好友备注 > 真实昵称
      avatar: friend?.avatar || '',
      silent: friend?.silent
    }
  }

  /** 群聊：会话归属到 groupId */
  const convertGroupConversation = (message: ImGroupMessageRespVO) => {
    const group = groupStore.getGroup(message.groupId)
    return {
      type: ImConversationType.GROUP,
      targetId: message.groupId,
      name: group ? getGroupDisplayName(group) : String(message.groupId),
      avatar: group?.avatar || '',
      silent: group?.silent
    }
  }

  /**
   * 分类型拉取离线消息：翻页 / minId 游标推进 / 空页停由 runMinIdPull 负责，这里只做接口分支 + 逐条业务分发
   * （撤回 / 好友通知 / 普通消息）+ 入库。
   *
   * 取消语义由 AbortController 对象身份守卫，失效后停止翻页与落库。
   */
  const pullByType = async (
    conversationType: number,
    startMinId: number,
    abortController: AbortController,
    db: DbClient
  ) => {
    // 私聊 / 群聊 / 频道各自一套接口；按 conversationType 分支调度。翻页机制（minId 游标 / 空页判断 / 防死翻）交给 runMinIdPull
    const isPrivate = conversationType === ImConversationType.PRIVATE
    const isChannel = conversationType === ImConversationType.CHANNEL
    const size = isPrivate ? MESSAGE_PRIVATE_PULL_SIZE : MESSAGE_GROUP_PULL_SIZE
    const { signal } = abortController
    const isStillValid = () => pullAbortController === abortController && !signal.aborted
    await runMinIdPull<PulledRawMessage>({
      initialMinId: startMinId,
      pageSize: size,
      isActive: isStillValid,
      fetchPage: ({ minId, size }) => {
        if (isPrivate) {
          return apiPullPrivateMessageList({ minId, size }, signal)
        }
        if (isChannel) {
          return apiPullChannelMessageList({ minId, size }, signal)
        }
        return apiPullGroupMessageList({ minId, size }, signal)
      },
      applyPage: async (list, nextMinId) => {
        const pulledMessages: PulledMessage[] = []
        // 逐条 dispatch：原消息走批量 insert；RECALL 信号走批量 recall 把同批内已 insert 的原消息更新为撤回提示。
        // 后端按 id 升序返回，且信号 id 一定 > 原消息 id（先更新 status 再插信号），所以原消息一定先到、recallMessage 找得到
        for (const raw of list) {
          if (isChannel) {
            const message = raw as ImChannelMessageRespVO
            pulledMessages.push({
              kind: 'insert',
              conversationInfo: convertChannelConversation(message),
              message: convertChannelMessage(message)
            })
            continue
          }
          if (isPrivate) {
            const message = raw as ImPrivateMessageRespVO
            // 特殊：撤回消息的处理
            if (message.type === ImContentType.RECALL) {
              pulledMessages.push({
                kind: 'recall',
                conversationType: ImConversationType.PRIVATE,
                targetId: getPrivateMessagePeerId(message, db.userId),
                recallSignalContent: message.content
              })
              continue
            }
            // 特殊：历史好友事件只还原聊天气泡；好友主数据由好友增量补偿同步
            if (isFriendNotification(message.type)) {
              // 仅 FRIEND_ADD / FRIEND_DELETE 才作为会话气泡入消息列表
              if (!isFriendChatTip(message.type)) {
                continue
              }
            }
            // 其它消息正常入会话消息列表
            pulledMessages.push({
              kind: 'insert',
              conversationInfo: convertPrivateConversation(message, db.userId),
              message: convertPrivateMessage(message, db.userId)
            })
          } else {
            const message = raw as ImGroupMessageRespVO
            // 特殊：撤回消息的处理
            if (message.type === ImContentType.RECALL) {
              pulledMessages.push({
                kind: 'recall',
                conversationType: ImConversationType.GROUP,
                targetId: message.groupId,
                recallSignalContent: message.content
              })
              continue
            }
            pulledMessages.push({
              kind: 'insert',
              conversationInfo: convertGroupConversation(message),
              message: convertGroupMessage(message, db.userId)
            })
          }
        }
        // 入库 + 推进 messageMaxId；nextMinId 为空（本批无有效 id）时不推进游标，与旧逻辑一致
        await messageStore.applyPulledMessageList(pulledMessages, conversationType, nextMinId, db)
      }
    })
  }

  /** 同一时刻只允许一次 pull：Index.vue 的手动调用与重连 watch 触发可能并发，共用同一个 promise 即可去重 */
  let pullPromise: null | Promise<void> = null
  let pullAbortController: AbortController | null = null

  /**
   * 首次 pull 是否已完成。仅在置 true 后，isConnected watch 才会触发 pull。
   * 防止 socket onopen 比 friendStore/groupStore 预拉先到达时，watcher 抢跑造成消息插入早于会话元数据可见
   */
  let initialPulled = false

  /** 显式取消：仅由 Index.vue onUnmounted（离开 IM / 切账号 / 路由跳出）调用 */
  const cancelPull = () => {
    pullAbortController?.abort()
    pullAbortController = null
    // 旧 promise 仍在 finally 阶段跑，但 controller 身份已阻断后续副作用；这里立刻允许新一轮重入
    pullPromise = null
    // 同步丢弃 WS 缓冲帧，避免下次进入 IM 时回放旧缓冲
    wsStore.discardBuffer()
  }

  /**
   * 状态事件补偿：好友 / 好友申请走增量；群列表和群申请红点走快照刷新
   *
   * 首登主数据由 index.vue 驱动，重连时各 store 已就位，多路 allSettled 并发互不影响，单路失败仅记日志。
   * 群成员不做全局增量同步，重连只标记本地群成员 cache 过期，进入群会话或成员列表时再按 groupId 刷新。
   */
  const pullStateEvents = async (): Promise<void> => {
    // 1. 清理连接级缓存
    messageStore.clearPrivateReadMaxIdCache()
    rtcStore.clearGroupCallCache()
    groupStore.markAllGroupActiveCallsExpired()
    groupStore.markAllGroupInfoExpired()
    groupStore.markAllGroupMembersExpired()
    // 2. 并发补偿远端状态
    const results = await Promise.allSettled([
      friendStore.pullFriends(),
      friendStore.pullFriendRequests(),
      conversationStore.pullConversationReads(),
      groupStore.fetchGroupList(true),
      groupRequestStore.pullGroupRequests(),
      groupRequestStore.fetchUnhandledGroupRequestList()
    ])
    for (const result of results) {
      if (result.status === 'rejected') {
        console.warn('[IM] 状态事件增量补偿失败', result.reason)
      }
    }
  }

  /** 执行一次全量增量拉取（重入安全：进行中再次调用复用同一个 promise） */
  const pullOnce = (): Promise<void> => {
    if (pullPromise) {
      return pullPromise
    }
    const abortController = new AbortController()
    pullAbortController = abortController
    // 本轮 pull 仍持有当前 AbortController，且未被显式取消
    const isCurrentPull = () =>
      pullAbortController === abortController && !abortController.signal.aborted
    pullPromise = (async () => {
      try {
        // 旧 puller 在 cancelPull 未触发的异常路径上再进来时，先于任何副作用退出
        if (!isCurrentPull()) {
          return
        }
        const db = await initDb()
        conversationStore.loading = true
        let messagePullSucceeded = false
        try {
          // 并发拉取私聊 + 群聊 + 频道消息，降低初始加载耗时
          await Promise.all([
            pullByType(
              ImConversationType.PRIVATE,
              messageStore.privateMessageMaxId,
              abortController,
              db
            ),
            pullByType(
              ImConversationType.GROUP,
              messageStore.groupMessageMaxId,
              abortController,
              db
            ),
            pullByType(
              ImConversationType.CHANNEL,
              messageStore.channelMessageMaxId,
              abortController,
              db
            )
          ])
          messagePullSucceeded = true
        } catch (e) {
          if (isAbortError(e)) {
            return
          }
          console.error('[IM] 拉取离线消息失败:', e)
        } finally {
          // 仍属本轮才复位 loading，避免旧轮覆盖新一轮状态
          if (isCurrentPull()) {
            conversationStore.loading = false
          }
        }

        // 主动取消后跳过 flushBuffer / 排序 / 已读位置补齐
        if (!isCurrentPull()) {
          return
        }
        if (!messagePullSucceeded) {
          return
        }

        // 回放 WebSocket 在 loading 期间收到的缓冲消息
        const buffered = wsStore.flushBuffer()
        const replayPersistPromises: Promise<void>[] = []
        for (const item of buffered) {
          if (item.conversationType === ImConversationType.PRIVATE) {
            replayPersistPromises.push(wsStore.handlePrivateMessage(item.payload))
          } else if (item.conversationType === ImConversationType.CHANNEL) {
            replayPersistPromises.push(wsStore.handleChannelMessage(item.payload))
          } else {
            replayPersistPromises.push(wsStore.handleGroupMessage(item.payload))
          }
        }
        const replayResults = await Promise.allSettled(replayPersistPromises)
        for (const result of replayResults) {
          if (result.status === 'rejected') {
            console.warn('[IM] 缓冲消息回放持久化失败', result.reason)
          }
        }
        if (!isCurrentPull()) {
          return
        }

        // pull + replay 都完成后再排序，避免回放消息打乱顺序
        conversationStore.sortConversationList()

        // 重连 / 冷启动后补齐当前激活私聊会话的「对方已读位置」
        // 离线期间错过的 RECEIPT 推送会被这里补回；其他私聊会话等用户点开时由 Index.vue 的 watch 触发
        // 私聊已读关闭时跳过，避免打到已禁用接口触发错误日志
        const active = conversationStore.activeConversation
        if (MESSAGE_PRIVATE_READ_ENABLED && active && active.type === ImConversationType.PRIVATE) {
          try {
            const maxReadId = await apiGetPrivateMaxReadMessageId(
              active.targetId,
              abortController.signal
            )
            if (!isCurrentPull()) {
              return
            }
            messageStore.updatePrivateReadMaxId(active.targetId, maxReadId)
            if (maxReadId) {
              await messageStore.applyMessageReadReceipt(
                {
                  conversationType: ImConversationType.PRIVATE,
                  targetId: active.targetId,
                  privateReadMaxId: maxReadId
                },
                db
              )
            }
          } catch (e) {
            if (isAbortError(e)) {
              return
            }
            console.warn('[IM] 拉取对方已读位置失败', e)
          }
        }
      } finally {
        // 只有仍持有当前 controller 的任务才能清理槽位；旧任务不得覆盖新一轮
        if (pullAbortController === abortController) {
          if (isCurrentPull()) {
            initialPulled = true
          }
          pullPromise = null
          pullAbortController = null
        }
      }
    })()
    return pullPromise
  }

  /** 拉取并持久化一页更早的会话消息 */
  const loadEarlierMessages = async (
    conversationType: number,
    targetId: number,
    maxId: number | undefined,
    limit: number
  ): Promise<number> => {
    const db = await initDb()
    // 私聊和群聊接口参数不同，但统一复用当前 puller 的字段转换规则
    const messages =
      (conversationType === ImConversationType.GROUP
        ? await apiGetGroupMessageList({ groupId: targetId, maxId, limit })
        : await apiGetPrivateMessageList({ receiverId: targetId, maxId, limit })) || []
    const converted =
      conversationType === ImConversationType.GROUP
        ? (messages as ImGroupMessageRespVO[]).map((message) =>
            convertGroupMessage(message, db.userId)
          )
        : (messages as ImPrivateMessageRespVO[]).map((message) =>
            convertPrivateMessage(message, db.userId)
          )
    // Store 负责去重、升序合并与落库，主聊天面板会同步看到新增的历史消息
    await messageStore.prependMessageList(conversationType, targetId, converted, db)
    return messages.length
  }

  /**
   * 断网期间 WS 收不到推送：重连后既要按 minId 补齐消息，也要按 update_time + id 补齐好友 / 群 / 群申请状态。
   * 首次连接由 Index.vue 显式驱动（pullOnce 拉消息 + 各 store 首拉），这里仅覆盖之后的重连。
   * 重连时 store 已就位，pullStateEvents 与 pullOnce 并发即可，无需「先就位再拉消息」的首登顺序约束。
   */
  watch(
    () => wsStore.isConnected,
    (isConnected) => {
      if (isConnected && initialPulled) {
        void pullOnce().catch((error) => {
          console.warn('[IM] 重连消息补拉失败', error)
        })
        void pullStateEvents()
      }
    }
  )

  return { pullOnce, cancelPull, loadEarlierMessages }
}
