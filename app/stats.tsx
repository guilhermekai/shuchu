/**
 * Stats: headline figures, a 7-day column chart, a 5-week calendar and the history list.
 * Charts follow the dataviz rules: one series → one hue, no legend box (the title names
 * it); columns ≤24pt with a 4pt rounded cap and a square baseline; recessive axis;
 * text in text tokens; tap a mark to read its value; the history list is the table view.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JP, Panel, PressableScale, T } from '../src/components/ui';
import { heroById } from '../src/data/characters';
import { useI18n } from '../src/i18n';
import { bestStreakOf, minutesByDay, streakOf, todaysSessions, useStore } from '../src/state/store';
import { radius, space, useTheme } from '../src/theme/tokens';

const CHART_H = 120;

export default function Stats() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const i18n = useI18n();
  const L = i18n.t.stats;
  const { sessions } = store;

  const week = useMemo(() => minutesByDay(sessions, 7), [sessions]);
  const month = useMemo(() => minutesByDay(sessions, 35), [sessions]);
  const todayMin = todaysSessions(sessions).reduce((a, x) => a + x.minutes, 0);
  const weekMin = week.reduce((a, d) => a + d.minutes, 0);
  const streak = streakOf(sessions);
  const best = bestStreakOf(sessions);

  const [picked, setPicked] = useState(week.length - 1); // today
  const max = Math.max(...week.map((d) => d.minutes), 1);
  const dayName = (ms: number, style: 'short' | 'narrow' | 'long') => new Date(ms).toLocaleDateString(i18n.locale, { weekday: style });
  const dateLabel = (ms: number) => new Date(ms).toLocaleDateString(i18n.locale, { weekday: 'short', day: 'numeric', month: 'short' });

  // Calendar: 4 sequential steps of the accent hue, plus "none".
  const level = (m: number) => (m === 0 ? 0 : m < 25 ? 1 : m < 50 ? 2 : m < 90 ? 3 : 4);
  const LEVEL_OPACITY = [0, 0.28, 0.5, 0.75, 1];
  const [pickedCell, setPickedCell] = useState<number | null>(null);
  // Cell size in points from the grid's measured width: percentage widths plus gap in a wrapping
  // row collapsed to zero on iOS, leaving the calendar blank.
  const [gridW, setGridW] = useState(0);
  const cellSize = gridW > 0 ? Math.floor((gridW - GRID_GAP * 6) / 7) : 0;

  const history = useMemo(() => [...sessions].reverse().slice(0, 30), [sessions]);

  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingHorizontal: space.md, paddingTop: space.xl, paddingBottom: insets.bottom + space.xxl }}>
      <View style={styles.titleRow}>
        <View>
          <JP size={13} color={t.accent}>記録</JP>
          <T v="title1" header>{L.title}</T>
        </View>
        <PressableScale onPress={() => router.back()} haptic="selection" accessibilityRole="button" accessibilityLabel={i18n.t.common.dismiss}>
          <T v="headline" color="accent">{i18n.t.common.ok}</T>
        </PressableScale>
      </View>

      {/* Headline figures */}
      <View style={styles.tiles}>
        <Tile label={L.today} value={L.minutes(todayMin)} />
        <Tile label={L.week} value={L.minutes(weekMin)} />
        <Tile label={L.sessions} value={String(sessions.length)} />
        <Tile label={L.streak} value={L.days(streak)} sub={`${L.best}: ${L.days(best)}`} />
      </View>
      <T v="footnote" color="tertiary" style={{ marginTop: space.xs, marginHorizontal: space.xs }}>{L.restDay}</T>

      {/* 7-day columns */}
      <Panel style={{ marginTop: space.lg }}>
        <View style={styles.card}>
          <T v="headline">{L.chartTitle}</T>
          {/* Readout for the tapped column (the "tooltip"), today by default */}
          <T v="subhead" color="secondary" style={{ marginBottom: space.sm }}>
            {dateLabel(week[picked].day)} · <T v="subhead" style={{ fontWeight: '700' }}>{L.minutes(week[picked].minutes)}</T>
          </T>
          <View style={[styles.chart, { borderBottomColor: t.border }]}>
            {week.map((d, i) => {
              const h = d.minutes === 0 ? 0 : Math.max(4, (d.minutes / max) * CHART_H);
              const sel = i === picked;
              return (
                <Pressable
                  key={d.day}
                  onPress={() => setPicked(i)}
                  style={styles.col}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={L.chartA11y(dayName(d.day, 'long'), d.minutes)}
                  hitSlop={4}
                >
                  {/* value on the cap: only the tapped column and the week's best */}
                  {(sel || (d.minutes === max && max > 1)) && d.minutes > 0 ? (
                    <T v="caption" color={sel ? 'primary' : 'secondary'} style={styles.cap}>
                      {d.minutes}
                    </T>
                  ) : null}
                  <View style={[styles.bar, { height: h, backgroundColor: t.accent, opacity: sel ? 1 : 0.55 }]} />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.axis}>
            {week.map((d, i) => (
              <T key={d.day} v="caption" color={i === picked ? 'primary' : 'tertiary'} style={styles.axisLabel}>
                {dayName(d.day, 'narrow')}
              </T>
            ))}
          </View>
        </View>
      </Panel>

      {/* 5-week calendar */}
      <Panel style={{ marginTop: space.lg }}>
        <View style={styles.card}>
          <T v="headline">{L.calendarTitle}</T>
          <T v="subhead" color="secondary" style={{ marginBottom: space.sm }}>
            {pickedCell === null ? ' ' : `${dateLabel(month[pickedCell].day)} · ${L.minutes(month[pickedCell].minutes)}`}
          </T>
          <View style={styles.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
            {month.map((d, i) => {
              const lv = level(d.minutes);
              return (
                <Pressable
                  key={d.day}
                  onPress={() => setPickedCell(i)}
                  style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: lv === 0 ? t.border : t.accent, opacity: lv === 0 ? 1 : LEVEL_OPACITY[lv] }, pickedCell === i && { borderWidth: 2, borderColor: t.text }]}
                  accessibilityRole="button"
                  accessibilityLabel={L.chartA11y(dateLabel(d.day), d.minutes)}
                />
              );
            })}
          </View>
          {/* Sequential scale key */}
          <View style={styles.key}>
            <T v="caption" color="tertiary">0</T>
            {[0, 1, 2, 3, 4].map((lv) => (
              <View key={lv} style={[styles.keyCell, { backgroundColor: lv === 0 ? t.border : t.accent, opacity: lv === 0 ? 1 : LEVEL_OPACITY[lv] }]} />
            ))}
            <T v="caption" color="tertiary">90+ min</T>
          </View>
        </View>
      </Panel>

      {/* History: the table view of the same data */}
      <T v="title3" style={{ marginTop: space.xl, marginBottom: space.sm }}>{L.history}</T>
      {history.length === 0 ? (
        <T v="subhead" color="secondary">{L.empty}</T>
      ) : (
        history.map((x) => (
          <View key={x.id} style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.avatar, { backgroundColor: t.accentSoft }]}>
              <JP size={16} color={t.accent}>{heroById(x.heroId).kanji}</JP>
            </View>
            <View style={{ flex: 1 }}>
              <T v="subhead" style={{ fontWeight: '600' }} numberOfLines={1}>{x.task}</T>
              <T v="caption" color="secondary">
                {dateLabel(x.endedAt)} · {new Date(x.endedAt).toLocaleTimeString(i18n.locale, { hour: 'numeric', minute: '2-digit' })} · {heroById(x.heroId).name}
              </T>
            </View>
            <T v="footnote" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{L.minutes(x.minutes)}</T>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]} accessible accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}>
      <T v="caption" color="secondary">{label}</T>
      <T v="title2" style={{ fontVariant: ['tabular-nums'] }}>{value}</T>
      {sub ? <T v="caption" color="tertiary">{sub}</T> : null}
    </View>
  );
}

const GRID_GAP = 4;

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.lg },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: 2 },
  card: { padding: space.md },
  chart: { height: CHART_H + 22, flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: StyleSheet.hairlineWidth },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  cap: { marginBottom: 4, fontVariant: ['tabular-nums'] },
  axis: { flexDirection: 'row', marginTop: 6 },
  axisLabel: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  cell: { borderRadius: 4 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.sm, alignSelf: 'flex-end' },
  keyCell: { width: 12, height: 12, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, borderWidth: 1, marginBottom: space.xs },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
