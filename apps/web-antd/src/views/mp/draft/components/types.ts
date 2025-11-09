// TODO @hw：要不把 components 里的部分，拿到 modules 里。
interface NewsItem {
  title: string;
  thumbMediaId: string;
  author: string;
  digest: string;
  showCoverPic: number;
  content: string;
  contentSourceUrl: string;
  needOpenComment: number;
  onlyFansCanComment: number;
  thumbUrl: string;
  picUrl?: string; // 用于预览封面
}

interface NewsItemList {
  newsItem: NewsItem[];
}

interface Article {
  mediaId: string;
  content: NewsItemList;
  updateTime: number;
}

const createEmptyNewsItem = (): NewsItem => {
  return {
    title: '',
    thumbMediaId: '',
    author: '',
    digest: '',
    showCoverPic: 0,
    content: '',
    contentSourceUrl: '',
    needOpenComment: 0,
    onlyFansCanComment: 0,
    thumbUrl: '',
  };
};

export type { Article, NewsItem, NewsItemList };
export { createEmptyNewsItem };
