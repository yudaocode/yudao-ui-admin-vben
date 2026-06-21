import type { InjectionKey, Ref } from 'vue';

export interface MusicSong {
  audioUrl?: string;
  date?: string;
  desc?: string;
  id?: number;
  imageUrl?: string;
  lyric?: string;
  singer?: string;
  title?: string;
  videoUrl?: string;
}

export const currentSongKey: InjectionKey<Ref<MusicSong>> =
  Symbol('currentSong');
