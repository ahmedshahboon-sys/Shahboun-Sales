import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function IconButton({ name, onPress, color, size = 22, style, accessibilityLabel }: { name: keyof typeof Ionicons.glyphMap; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle>; accessibilityLabel: string }) {
  const colors = useColors();
  return <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed]}><Ionicons name={name} size={size} color={color ?? colors.foreground} /></Pressable>;
}

export function PrimaryButton({ title, onPress, icon, variant = 'primary', disabled = false }: { title: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: 'primary' | 'success' | 'danger' | 'ghost'; disabled?: boolean }) {
  const colors = useColors();
  const background = variant === 'success' ? colors.success : variant === 'danger' ? colors.destructive : variant === 'ghost' ? colors.secondary : colors.primary;
  const foreground = variant === 'ghost' ? colors.secondaryForeground : colors.primaryForeground;
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: background, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 }, variant === 'ghost' && { borderWidth: 1, borderColor: colors.border }]}><>{icon && <Ionicons name={icon} size={18} color={foreground} />}</><Text style={[styles.buttonText, { color: foreground }]}>{title}</Text></Pressable>;
}

export function TextField({ label, ...props }: TextInputProps & { label?: string }) {
  const colors = useColors();
  return <View style={styles.fieldWrap}>{label && <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>}<TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }, props.style]} /></View>;
}

export function StatCard({ icon, label, value, accent = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; accent?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.statCard, { backgroundColor: accent ? colors.primary : colors.card, borderColor: accent ? colors.primary : colors.border, opacity: pressed ? 0.88 : 1 }]}><View style={[styles.statIcon, { backgroundColor: accent ? 'rgba(255,255,255,0.14)' : colors.secondary }]}><Ionicons name={icon} size={19} color={accent ? colors.accent : colors.secondaryForeground} /></View><Text style={[styles.statLabel, { color: accent ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>{label}</Text><Text style={[styles.statValue, { color: accent ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text>{action && <Pressable onPress={onAction}><Text style={[styles.actionText, { color: colors.accent }]}>{action}</Text></Pressable>}</View>;
}

export function EmptyState({ icon, title, detail }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={28} color={colors.secondaryForeground} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'danger' | 'warning' }) {
  const colors = useColors();
  const background = tone === 'success' ? colors.secondary : tone === 'danger' ? `${colors.destructive}18` : tone === 'warning' ? `${colors.warning}20` : colors.muted;
  const foreground = tone === 'success' ? colors.secondaryForeground : tone === 'danger' ? colors.destructive : tone === 'warning' ? colors.warning : colors.mutedForeground;
  return <View style={[styles.pill, { backgroundColor: background }]}><Text style={[styles.pillText, { color: foreground }]}>{label}</Text></View>;
}

export function Surface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return <View style={[styles.surface, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  button: { minHeight: 50, borderRadius: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  fieldWrap: { gap: 7 },
  fieldLabel: { textAlign: 'right', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontSize: 15, textAlign: 'right' },
  statCard: { flex: 1, minHeight: 124, borderRadius: 19, borderWidth: 1, padding: 14, gap: 6 },
  statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  statValue: { fontSize: 21, fontWeight: '800', textAlign: 'right' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  sectionText: { fontSize: 19, fontWeight: '800', textAlign: 'right' },
  actionText: { fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyDetail: { fontSize: 13, textAlign: 'center', lineHeight: 21, paddingHorizontal: 30 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 50, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '800' },
  surface: { borderRadius: 19, borderWidth: 1, padding: 14 },
});

export const uiStyles = styles;
