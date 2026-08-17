import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Line as SvgLine } from 'react-native-svg';
import type { CanvasElement, ColorToken, ElementStyle, SceneAction, SceneState } from 'kaori-core';
import {
  DASH_STYLES,
  FONT_SIZES,
  TEXT_ALIGNS,
  dashArrayFor,
  isStrokeElement,
  layoutBoundTextFor,
  layoutText,
  selectedElements,
} from 'kaori-core';
import { useTheme } from '@/theme';
import { ThemeText } from '@/components/ui';
import { FILL_TOKENS, STROKE_TOKENS, STROKE_WIDTHS, canvasColor } from './colors';
import { measurerFor } from './measureText';
import { BringForwardIcon, BringToFrontIcon, SendBackwardIcon, SendToBackIcon } from './toolIcons';

// The style controls, whose contents change with what's selected — the same idea as desktop's
// panel, laid out for touch.
//
// A floating card over the canvas rather than a strip in the layout: a strip takes height from
// the drawing for as long as it is open, and the canvas is the point of the screen. Floating
// also means opening it shifts nothing — the shape you are about to restyle stays exactly
// where it was, which a strip that resizes the surface cannot promise.
//
// With nothing selected it edits the style *new* elements will be drawn with; with a selection
// it edits those elements and updates the default too, so the next shape matches the last one
// you adjusted.
export function StylePanel({
  state,
  dispatch,
}: {
  state: SceneState;
  dispatch: React.Dispatch<SceneAction>;
}) {
  const { colors } = useTheme();
  const selection = selectedElements(state);
  const { tool, style } = state;

  // Which groups are worth showing. A panel that offers fill for a pencil stroke, or font size
  // for a rectangle, is a panel you have to read rather than glance at.
  const shapeish = ['rect', 'ellipse', 'frame'];
  const hasShape = selection.some((el) => shapeish.includes(el.kind)) || shapeish.includes(tool);
  const hasStroke =
    selection.some((el) => isStrokeElement(el) || shapeish.includes(el.kind)) ||
    ['draw', 'line', 'arrow', ...shapeish].includes(tool);
  const hasText = selection.some((el) => el.kind === 'text') || tool === 'text';

  // Re-laying out text is what makes a font-size change legal: an element's `lines`, `w` and
  // `h` are the wrap result, and hit-testing works off those bounds. Changing fontSize without
  // re-wrapping would draw bigger glyphs inside the old box.
  function patchesFor(patch: Partial<ElementStyle>): Record<string, Partial<CanvasElement>> {
    const out: Record<string, Partial<CanvasElement>> = {};
    for (const el of selection) {
      const base: Partial<CanvasElement> = { ...patch } as Partial<CanvasElement>;
      if (el.kind === 'text' && (patch.fontSize !== undefined || patch.align !== undefined)) {
        const next = { ...el, ...patch };
        const container = el.containerId
          ? state.elements.find((c) => c.id === el.containerId)
          : undefined;
        if (container && (container.kind === 'rect' || container.kind === 'ellipse')) {
          const bound = layoutBoundTextFor(container, next, measurerFor(next));
          Object.assign(base, {
            lines: bound.lines,
            w: bound.w,
            h: bound.h,
            x: bound.x,
            y: bound.y,
          });
          // The shape may need to grow for the larger text, same as while typing.
          out[container.id] = { ...(out[container.id] ?? {}), h: bound.containerHeight };
        } else {
          const laid = layoutText(next.text, 0, next.fontSize, measurerFor(next));
          Object.assign(base, { lines: laid.lines, w: laid.w, h: laid.h });
        }
      }
      out[el.id] = { ...(out[el.id] ?? {}), ...base };
    }
    return out;
  }

  function apply(patch: Partial<ElementStyle>) {
    // Always update the default, so the next element drawn inherits what you just chose.
    dispatch({ type: 'SET_STYLE', patch });
    if (selection.length > 0) {
      dispatch({ type: 'UPDATE_ELEMENTS', patches: patchesFor(patch) });
    }
  }

  return (
    <View
      // Anchored above the button that opens it, hugging the right edge. maxHeight keeps a
      // full set of groups from running off the top of a short screen; the ScrollView inside
      // takes over if it ever does.
      className="absolute right-4 rounded-2xl border border-theme-line bg-theme-paper"
      style={{ bottom: 62, width: 268, maxHeight: 300 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
      >
        <Row label="stroke">
          {STROKE_TOKENS.map((token) => (
            <Swatch
              key={token}
              color={canvasColor(token, colors)}
              active={style.stroke === token}
              onPress={() => apply({ stroke: token })}
            />
          ))}
        </Row>

        {hasShape && (
          <Row label="fill">
            {FILL_TOKENS.map((token: ColorToken | null) => (
              <Swatch
                key={token ?? 'none'}
                color={token === null ? 'transparent' : canvasColor(token, colors)}
                active={style.fill === token}
                empty={token === null}
                onPress={() => apply({ fill: token })}
              />
            ))}
          </Row>
        )}

        {hasStroke && (
          <Row label="width">
            {STROKE_WIDTHS.map((w) => (
              <Cell
                key={w}
                active={style.strokeWidth === w}
                onPress={() => apply({ strokeWidth: w })}
              >
                <Svg width={22} height={22}>
                  <SvgLine
                    x1={3}
                    y1={11}
                    x2={19}
                    y2={11}
                    stroke={style.strokeWidth === w ? colors.amber : colors.ink3}
                    strokeWidth={w}
                    strokeLinecap="round"
                  />
                </Svg>
              </Cell>
            ))}
          </Row>
        )}

        {hasStroke && (
          <Row label="dash">
            {DASH_STYLES.map((dash) => (
              <Cell key={dash} active={style.dash === dash} onPress={() => apply({ dash })}>
                <Svg width={22} height={22}>
                  <SvgLine
                    x1={3}
                    y1={11}
                    x2={19}
                    y2={11}
                    stroke={style.dash === dash ? colors.amber : colors.ink3}
                    strokeWidth={2}
                    // Round caps are required for the dotted style — its dasharray uses
                    // zero-length segments, which paint as nothing under a butt cap.
                    strokeLinecap="round"
                    strokeDasharray={dashArrayFor(dash, 2)}
                  />
                </Svg>
              </Cell>
            ))}
          </Row>
        )}

        {hasText && (
          <>
            <Row label="size">
              {FONT_SIZES.map(({ value, label }) => (
                <Cell
                  key={value}
                  active={style.fontSize === value}
                  onPress={() => apply({ fontSize: value })}
                  label={label}
                />
              ))}
            </Row>
            <Row label="align">
              {TEXT_ALIGNS.map((align) => (
                <Cell
                  key={align}
                  active={style.align === align}
                  onPress={() => apply({ align })}
                  label={align === 'left' ? '⇤' : '⇔'}
                />
              ))}
            </Row>
          </>
        )}

        {selection.length > 0 && (
          <Row label="layer">
            {(
              [
                ['front', BringToFrontIcon],
                ['forward', BringForwardIcon],
                ['backward', SendBackwardIcon],
                ['back', SendToBackIcon],
              ] as const
            ).map(([mode, Icon]) => (
              <Cell key={mode} onPress={() => dispatch({ type: 'REORDER', mode })}>
                <Icon size={18} color={colors.ink3} />
              </Cell>
            ))}
          </Row>
        )}
      </ScrollView>
    </View>
  );
}

// A labelled row: name on the left, controls on the right. Reads top-to-bottom as a list of
// properties, which a single scrolling strip of anonymous buttons never did.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center px-3 py-1.5">
      <ThemeText variant="meta" className="w-14">
        {label}
      </ThemeText>
      <View className="flex-1 flex-row items-center justify-end gap-2">{children}</View>
    </View>
  );
}

function Swatch({
  color,
  active,
  empty,
  onPress,
}: {
  color: string;
  active: boolean;
  empty?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      className="items-center justify-center rounded-full"
      style={{
        width: 28,
        height: 28,
        borderWidth: active ? 2 : 1,
        borderColor: active ? colors.amber : colors.line2,
        backgroundColor: color,
      }}
    >
      {/* "No fill" needs to look like an absence rather than a black swatch. */}
      {empty ? <View style={{ width: 16, height: 1, backgroundColor: colors.ink4 }} /> : null}
    </Pressable>
  );
}

function Cell({
  active,
  onPress,
  children,
  label,
}: {
  active?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      className="items-center justify-center rounded-lg"
      style={{ width: 30, height: 30, backgroundColor: active ? colors.paper2 : 'transparent' }}
    >
      {label ? (
        <Text
          style={{
            color: active ? colors.amber : colors.ink3,
            fontSize: 13,
            fontFamily: 'Geist-Medium',
          }}
        >
          {label}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
