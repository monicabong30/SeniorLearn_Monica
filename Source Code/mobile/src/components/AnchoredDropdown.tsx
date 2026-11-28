import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, iconSize, space } from '../theme/tokens';

type Option<T extends string> = { value: T; label: string };

export function AnchoredDropdown<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly Option<T>[]; onChange: (value: T) => void }) {
  const anchor = useRef<any>(null), [open, setOpen] = useState(false), [position, setPosition] = useState({ left: 12, top: 80 });
  const show = () => anchor.current?.measureInWindow((left: number, top: number, _width: number, height: number) => { setPosition({ left: Math.max(12, left), top: top + height + 4 }); setOpen(true); });
  const selected = options.find(option => option.value === value)?.label ?? label;
  return <View ref={anchor} collapsable={false}><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selected}`} accessibilityState={{ expanded: open }} onPress={show} style={s.trigger}><Text numberOfLines={1} style={s.triggerText}>{selected}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={iconSize.standard} color={colors.primary} /></Pressable>{open && <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(false)}><View style={s.portal}><Pressable accessibilityLabel={`Close ${label} options`} onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} /><View style={[s.menu, position]}>{options.map(option => <Pressable key={option.value} accessibilityRole="menuitem" accessibilityState={{ selected: option.value === value }} onPress={() => { onChange(option.value); setOpen(false); }} style={[s.option, option.value === value && s.selected]}><Text style={[s.optionText, option.value === value && s.selectedText]}>{option.label}</Text>{option.value === value && <Ionicons name="checkmark" size={iconSize.standard} color={colors.primary} />}</Pressable>)}</View></View></Modal>}</View>;
}

const s = StyleSheet.create({
  trigger: { minHeight: 44, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  triggerText: { color: colors.primary, fontWeight: '700', flexShrink: 1 },
  portal: { flex: 1 }, menu: { position: 'absolute', minWidth: 244, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 4, shadowColor: '#001b35', shadowOpacity: .18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  option: { minHeight: 48, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, gap: space.lg }, selected: { backgroundColor: '#edf5ff' }, optionText: { color: colors.text, fontSize: 16 }, selectedText: { color: colors.primary, fontWeight: '700' }, check: { color: colors.primary, fontWeight: '800', fontSize: 20 },
});
