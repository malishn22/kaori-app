import React from 'react';
import type { SvgProps } from 'react-native-svg';

import PlusSvg from './plus.svg';
import SearchSvg from './search.svg';
import FolderSvg from './folder.svg';
import BookmarkSvg from './bookmark.svg';
import BookmarkFilledSvg from './bookmark-filled.svg';
import CheckSvg from './check.svg';
import CircleSvg from './circle.svg';
import ChevSvg from './chev.svg';
import ArrowSvg from './arrow.svg';
import BackSvg from './back.svg';
import MoreSvg from './more.svg';
import SparkleSvg from './sparkle.svg';
import CloudSvg from './cloud.svg';
import BellSvg from './bell.svg';
import MoonSvg from './moon.svg';
import UserSvg from './user.svg';
import PenSvg from './pen.svg';
import CoffeeSvg from './coffee.svg';
import TrashSvg from './trash.svg';
import TagSvg from './tag.svg';
import RainSvg from './rain.svg';

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

type ChevDir = 'right' | 'left' | 'up' | 'down';

function icon(Svg: React.FC<SvgProps>, defaultSize: number) {
  return ({ size = defaultSize, color, strokeWidth }: IconProps) => (
    <Svg width={size} height={size} color={color} strokeWidth={strokeWidth} />
  );
}

export const IconPlus = icon(PlusSvg, 22);
export const IconSearch = icon(SearchSvg, 20);
export const IconFolder = icon(FolderSvg, 20);
export const IconBookmark = icon(BookmarkSvg, 20);
export const IconBookmarkFilled = icon(BookmarkFilledSvg, 20);
export const IconCheck = icon(CheckSvg, 16);
export const IconCircle = icon(CircleSvg, 18);
export const IconArrow = icon(ArrowSvg, 18);
export const IconBack = icon(BackSvg, 18);
export const IconMore = icon(MoreSvg, 18);
export const IconSparkle = icon(SparkleSvg, 16);
export const IconCloud = icon(CloudSvg, 16);
export const IconBell = icon(BellSvg, 18);
export const IconMoon = icon(MoonSvg, 18);
export const IconUser = icon(UserSvg, 18);
export const IconPen = icon(PenSvg, 18);
export const IconCoffee = icon(CoffeeSvg, 18);
export const IconTrash = icon(TrashSvg, 18);
export const IconTag = icon(TagSvg, 16);
export const IconRain = icon(RainSvg, 24);

export function IconChev({ size = 16, color, strokeWidth, dir = 'right' }: IconProps & { dir?: ChevDir }) {
  const rotation = { right: '0deg', left: '180deg', up: '-90deg', down: '90deg' }[dir];
  return (
    <ChevSvg
      width={size}
      height={size}
      color={color}
      strokeWidth={strokeWidth}
      style={{ transform: [{ rotate: rotation }] }}
    />
  );
}
