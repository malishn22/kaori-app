import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

import PlusSvg from './plus.svg';
import FolderSvg from './folder.svg';
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
import GearSvg from './gear.svg';
import PenSvg from './pen.svg';
import TrashSvg from './trash.svg';
import TaskSvg from './task.svg';

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

type ChevDir = 'right' | 'left' | 'up' | 'down';

function icon(Svg: React.FC<SvgProps>, defaultSize: number) {
  return ({ size = defaultSize, color, strokeWidth }: IconProps) => (
    <Svg width={size} height={size} color={color} strokeWidth={strokeWidth} />
  );
}

export const PlusIcon = icon(PlusSvg, 22);
export const FolderIcon = icon(FolderSvg, 20);
export const CheckIcon = icon(CheckSvg, 16);
export const CircleIcon = icon(CircleSvg, 18);
export const ArrowIcon = icon(ArrowSvg, 18);
export const BackIcon = icon(BackSvg, 18);
export const MoreIcon = icon(MoreSvg, 18);
export const SparkleIcon = icon(SparkleSvg, 16);
export const CloudIcon = icon(CloudSvg, 16);
export const BellIcon = icon(BellSvg, 18);
export const MoonIcon = icon(MoonSvg, 18);
export const SettingsIcon = icon(GearSvg, 18);
export const EditIcon = icon(PenSvg, 18);
export const TrashIcon = icon(TrashSvg, 18);
export const TaskIcon = icon(TaskSvg, 20);

export function BookmarkIcon({ size = 20, color = 'currentColor', fill = 'transparent' }: { size?: number; color?: string; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 4h12v17l-6-4-6 4V4z" fill={fill} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronIcon({ size = 16, color, strokeWidth, dir = 'right' }: IconProps & { dir?: ChevDir }) {
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
