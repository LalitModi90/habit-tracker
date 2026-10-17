import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type Habit = {
  id: string;
  name: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  completedDates: string[];
  createdAt: string;
};

const STORAGE_KEY = "@habit-tracker-basic/habits";
const COLORS = ["#6657E8", "#F39A5A", "#2FAF8F", "#E36F8B", "#4B91E2", "#B17ADB"];
const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "book-outline",
  "fitness-outline",
  "water-outline",
  "code-slash-outline",
  "leaf-outline",
  "moon-outline",
  "walk-outline",
  "heart-outline",
];

function dateToKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPrettyDate(dateKeyString: string): string {
  const [y, m, d] = dateKeyString.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Generate the 7 days strip centered around reference date
function getWeekStrip(centerDate: Date) {
  const list = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + offset);
    list.push({
      key: dateToKey(d),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      dayNum: d.getDate(),
      dateObj: d,
    });
  }
  return list;
}

export default function HomeScreen() {
  const todayKey = useMemo(() => dateToKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Form Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitSubtitle, setHabitSubtitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<(typeof ICONS)[number]>("book-outline");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Action Menu State (Edit / Delete)
  const [actionMenuHabit, setActionMenuHabit] = useState<Habit | null>(null);

  // Full Month Calendar Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarViewingDate, setCalendarViewingDate] = useState(new Date());

  // Week strip centered around selected date
  const weekStrip = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return getWeekStrip(new Date(y, m - 1, d));
  }, [selectedDate]);

  // Load Saved Habits
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setHabits(parsed);
          } else {
            seedSampleHabits();
          }
        } else {
          seedSampleHabits();
        }
      } catch {
        seedSampleHabits();
      } finally {
        setLoaded(true);
      }
    })();
  }, [todayKey]);

  function seedSampleHabits() {
    const samples: Habit[] = [
      {
        id: "sample-1",
        name: "Morning Exercise",
        subtitle: "Everyday at 8:30 am",
        icon: "fitness-outline",
        color: "#6657E8",
        completedDates: [todayKey],
        createdAt: todayKey,
      },
      {
        id: "sample-2",
        name: "Read 10 Pages",
        subtitle: "Book reading",
        icon: "book-outline",
        color: "#F39A5A",
        completedDates: [todayKey],
        createdAt: todayKey,
      },
      {
        id: "sample-3",
        name: "Daily Meditation",
        subtitle: "Keep calm...",
        icon: "leaf-outline",
        color: "#2FAF8F",
        completedDates: [],
        createdAt: todayKey,
      },
      {
        id: "sample-4",
        name: "Drink 2L Water",
        subtitle: "Stay hydrated",
        icon: "water-outline",
        color: "#4B91E2",
        completedDates: [],
        createdAt: todayKey,
      },
    ];
    setHabits(samples);
  }

  // Save on Change
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits)).catch(() => {});
  }, [habits, loaded]);

  // Progress for the currently selected date
  const completedCount = useMemo(
    () => habits.filter((h) => h.completedDates.includes(selectedDate)).length,
    [habits, selectedDate]
  );
  const progressRatio = habits.length ? completedCount / habits.length : 0;

  // Toggle habit completion for selected date
  function toggleHabit(habit: Habit) {
    setHabits((current) =>
      current.map((item) => {
        if (item.id !== habit.id) return item;
        const isDone = item.completedDates.includes(selectedDate);
        return {
          ...item,
          completedDates: isDone
            ? item.completedDates.filter((d) => d !== selectedDate)
            : [...item.completedDates, selectedDate],
        };
      })
    );
  }

  // Open Add modal
  function openAdd() {
    setEditingId(null);
    setHabitName("");
    setHabitSubtitle("");
    setSelectedIcon("book-outline");
    setSelectedColor(COLORS[habits.length % COLORS.length]);
    setModalVisible(true);
  }

  // Open Edit modal
  function openEdit(habit: Habit) {
    setEditingId(habit.id);
    setHabitName(habit.name);
    setHabitSubtitle(habit.subtitle || "");
    setSelectedIcon(habit.icon);
    setSelectedColor(habit.color);
    setModalVisible(true);
  }

  // Save Habit
  function saveHabit() {
    const name = habitName.trim();
    if (!name) {
      if (Platform.OS === "web") {
        window.alert("Please enter a habit name.");
      } else {
        Alert.alert("Name Required", "Please enter a habit name.");
      }
      return;
    }

    if (editingId) {
      setHabits((current) =>
        current.map((h) =>
          h.id === editingId
            ? {
                ...h,
                name,
                subtitle: habitSubtitle.trim() || undefined,
                icon: selectedIcon,
                color: selectedColor,
              }
            : h
        )
      );
    } else {
      const newHabit: Habit = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        subtitle: habitSubtitle.trim() || "Daily habit",
        icon: selectedIcon,
        color: selectedColor,
        completedDates: [],
        createdAt: selectedDate,
      };
      setHabits((current) => [newHabit, ...current]);
    }
    setModalVisible(false);
  }

  // Delete Habit
  function deleteHabit(habit: Habit) {
    if (Platform.OS === "web") {
      const ok = window.confirm(`Remove "${habit.name}" from your tracker?`);
      if (ok) {
        setHabits((current) => current.filter((h) => h.id !== habit.id));
      }
    } else {
      Alert.alert("Delete habit?", `Remove "${habit.name}" from your tracker?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setHabits((current) => current.filter((h) => h.id !== habit.id)),
        },
      ]);
    }
  }

  // Calendar Modal Grid Builder
  const calendarDays = useMemo(() => {
    const year = calendarViewingDate.getFullYear();
    const month = calendarViewingDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before 1st day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dt = new Date(year, month, dayNum);
      const key = dateToKey(dt);
      const hasCompleted = habits.some((h) => h.completedDates.includes(key));
      days.push({ dayNum, key, hasCompleted, isToday: key === todayKey });
    }
    return days;
  }, [calendarViewingDate, habits, todayKey]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FB" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TOP HEADER */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>SMALL STEPS, EVERY DAY</Text>
              <Text style={styles.title}>
                My Habits <Text style={styles.titleEmoji}>✦</Text>
              </Text>
            </View>

            {/* Calendar Icon Button */}
            <TouchableOpacity
              style={styles.calendarHeaderButton}
              activeOpacity={0.8}
              onPress={() => {
                const [y, m, d] = selectedDate.split("-").map(Number);
                setCalendarViewingDate(new Date(y, m - 1, d));
                setCalendarModalVisible(true);
              }}
              accessibilityLabel="Open Calendar"
            >
              <Ionicons name="calendar-outline" size={22} color="#6657E8" />
            </TouchableOpacity>
          </View>

          {/* ACTIVE DATE TITLE & JUMP TO TODAY */}
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{formatPrettyDate(selectedDate)}</Text>
            {selectedDate !== todayKey && (
              <TouchableOpacity
                style={styles.todayPill}
                onPress={() => setSelectedDate(todayKey)}
              >
                <Text style={styles.todayPillText}>Jump to Today</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* WEEKLY DATE STRIP (7-DAY CALENDAR SELECTOR) */}
          <View style={styles.weekStripContainer}>
            {weekStrip.map((item) => {
              const isSelected = item.key === selectedDate;
              const isToday = item.key === todayKey;

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.8}
                  style={[
                    styles.weekDayCard,
                    isSelected && styles.weekDayCardSelected,
                    !isSelected && isToday && styles.weekDayCardToday,
                  ]}
                  onPress={() => setSelectedDate(item.key)}
                >
                  <Text
                    style={[
                      styles.weekDayName,
                      isSelected && styles.weekDayNameSelected,
                    ]}
                  >
                    {item.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayNumber,
                      isSelected && styles.weekDayNumberSelected,
                    ]}
                  >
                    {item.dayNum}
                  </Text>
                  {isSelected && <View style={styles.weekDayIndicatorDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RICH PURPLE PROGRESS CARD */}
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View style={styles.progressTextWrap}>
                <Text style={styles.progressEyebrow}>DAILY PROGRESS</Text>
                <Text style={styles.progressTitle}>
                  {habits.length === 0
                    ? "Start with one habit"
                    : completedCount === habits.length
                    ? "All done. Well done!"
                    : "Keep your momentum"}
                </Text>
                <Text style={styles.progressSubtitle}>
                  {completedCount} of {habits.length} habits completed
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercent}>
                  {Math.round(progressRatio * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progressRatio * 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* SECTION HEADER */}
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {selectedDate === todayKey ? "Today's habits" : "Habits on this day"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Build consistency one check at a time.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAdd}
              accessibilityLabel="Add habit"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* HABITS LIST */}
          {habits.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles-outline" size={28} color="#6657E8" />
              </View>
              <Text style={styles.emptyTitle}>Create your first habit</Text>
              <Text style={styles.emptyText}>
                Start small: read 10 pages, walk for 15 minutes, or drink water.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAdd}>
                <Text style={styles.emptyButtonText}>+ Create a habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.habitList}>
              {habits.map((item) => {
                const isDone = item.completedDates.includes(selectedDate);
                return (
                  <View
                    key={item.id}
                    style={[styles.habitCard, isDone && styles.habitCardDone]}
                  >
                    {/* Icon Box */}
                    <View
                      style={[
                        styles.habitIcon,
                        { backgroundColor: `${item.color}18` },
                      ]}
                    >
                      <Ionicons name={item.icon} size={23} color={item.color} />
                    </View>

                    {/* Title & Status */}
                    <TouchableOpacity
                      style={styles.habitMain}
                      onPress={() => toggleHabit(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.habitName, isDone && styles.habitNameDone]}>
                        {item.name}
                      </Text>
                      <Text style={styles.habitStatus}>
                        {isDone
                          ? "Completed"
                          : item.subtitle
                          ? item.subtitle
                          : "Tap to mark complete"}
                      </Text>
                    </TouchableOpacity>

                    {/* Circular Checkbox */}
                    <TouchableOpacity
                      style={[
                        styles.checkButton,
                        isDone && {
                          backgroundColor: item.color,
                          borderColor: item.color,
                        },
                      ]}
                      onPress={() => toggleHabit(item)}
                      accessibilityLabel={
                        isDone ? `Mark ${item.name} incomplete` : `Complete ${item.name}`
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={isDone ? "checkmark" : "checkmark-outline"}
                        size={20}
                        color={isDone ? "#FFFFFF" : "#9296AA"}
                      />
                    </TouchableOpacity>

                    {/* Three Dots Button for Edit / Delete */}
                    <TouchableOpacity
                      style={styles.moreButton}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      onPress={() => setActionMenuHabit(item)}
                      accessibilityLabel={`Options for ${item.name}`}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={19}
                        color="#858AA0"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* MOTIVATIONAL TINY TIP */}
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={20} color="#D18A28" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Tiny tip</Text>
              <Text style={styles.tipText}>
                Make it easy to start. Five minutes is better than waiting for the perfect moment.
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>Your habits stay on this device.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CREATE / EDIT HABIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingId ? "Edit habit" : "New habit"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Choose something you want to do daily.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={22} color="#4C5066" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>HABIT NAME</Text>
              <TextInput
                style={styles.nameInput}
                value={habitName}
                onChangeText={setHabitName}
                placeholder="e.g. Read for 10 minutes"
                placeholderTextColor="#9A9FB1"
                maxLength={50}
                autoFocus
                returnKeyType="done"
              />

              <Text style={styles.inputLabel}>FREQUENCY / SUBTITLE</Text>
              <TextInput
                style={styles.nameInput}
                value={habitSubtitle}
                onChangeText={setHabitSubtitle}
                placeholder="e.g. Everyday at 8:30 am, 10 times"
                placeholderTextColor="#9A9FB1"
                maxLength={50}
              />

              <Text style={styles.inputLabel}>PICK AN ICON</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconChoice,
                      selectedIcon === icon && styles.iconChoiceSelected,
                      selectedIcon === icon && { borderColor: selectedColor },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={selectedIcon === icon ? selectedColor : "#777D93"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>PICK A COLOR</Text>
              <View style={styles.colorRow}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorChoice,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorChoiceSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    accessibilityLabel={`Choose color ${color}`}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: selectedColor }]}
                onPress={saveHabit}
              >
                <Text style={styles.saveButtonText}>
                  {editingId ? "Save changes" : "Create habit"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ACTION MENU MODAL (EDIT / DELETE) */}
      <Modal
        visible={actionMenuHabit !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuHabit(null)}
      >
        <TouchableOpacity
          style={styles.actionModalBackdrop}
          activeOpacity={1}
          onPress={() => setActionMenuHabit(null)}
        >
          <View style={styles.actionModalCard}>
            <View style={styles.actionModalHandle} />
            <Text style={styles.actionModalTitle} numberOfLines={1}>
              {actionMenuHabit?.name}
            </Text>
            <Text style={styles.actionModalSubtitle}>Choose an action</Text>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                if (actionMenuHabit) {
                  const target = actionMenuHabit;
                  setActionMenuHabit(null);
                  openEdit(target);
                }
              }}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: "#EAE8FF" }]}>
                <Ionicons name="pencil" size={18} color="#6657E8" />
              </View>
              <Text style={styles.actionMenuText}>Edit habit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                if (actionMenuHabit) {
                  const target = actionMenuHabit;
                  setActionMenuHabit(null);
                  deleteHabit(target);
                }
              }}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: "#FFEAEF" }]}>
                <Ionicons name="trash-outline" size={18} color="#E34D67" />
              </View>
              <Text style={[styles.actionMenuText, { color: "#E34D67" }]}>Delete habit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuCancelButton}
              onPress={() => setActionMenuHabit(null)}
            >
              <Text style={styles.actionMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FULL MONTH CALENDAR MODAL */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionModalBackdrop}
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}
        >
          <View style={styles.calendarModalCard}>
            <View style={styles.actionModalHandle} />

            {/* Month & Year Navigation */}
            <View style={styles.calendarNavRow}>
              <TouchableOpacity
                onPress={() => {
                  const prev = new Date(calendarViewingDate);
                  prev.setMonth(prev.getMonth() - 1);
                  setCalendarViewingDate(prev);
                }}
                style={styles.calendarNavBtn}
              >
                <Ionicons name="chevron-back" size={20} color="#252840" />
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>
                {calendarViewingDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  const next = new Date(calendarViewingDate);
                  next.setMonth(next.getMonth() + 1);
                  setCalendarViewingDate(next);
                }}
                style={styles.calendarNavBtn}
              >
                <Ionicons name="chevron-forward" size={20} color="#252840" />
              </TouchableOpacity>
            </View>

            {/* Days of week header */}
            <View style={styles.calendarWeekHeader}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                <Text key={dayName} style={styles.calendarWeekHeaderText}>
                  {dayName}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => {
                if (!item) {
                  return <View key={`empty-${index}`} style={styles.calendarCell} />;
                }

                const isSelected = item.key === selectedDate;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.calendarCell,
                      isSelected && styles.calendarCellSelected,
                      !isSelected && item.isToday && styles.calendarCellToday,
                    ]}
                    onPress={() => {
                      setSelectedDate(item.key);
                      setCalendarModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        isSelected && styles.calendarCellTextSelected,
                        !isSelected && item.isToday && styles.calendarCellTextToday,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                    {item.hasCompleted && (
                      <View
                        style={[
                          styles.calendarCompletedDot,
                          isSelected && { backgroundColor: "#FFFFFF" },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Action Button */}
            <TouchableOpacity
              style={styles.calendarTodayButton}
              onPress={() => {
                setSelectedDate(todayKey);
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.calendarTodayButtonText}>Select Today</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  page: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  /* TOP ROW */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "#8B8FA4",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: "#252840",
  },
  titleEmoji: { color: "#6657E8" },
  calendarHeaderButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#EAE8FF",
    alignItems: "center",
    justifyContent: "center",
  },

  /* DATE ROW */
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  dateText: {
    color: "#858AA0",
    fontSize: 13,
    fontWeight: "600",
  },
  todayPill: {
    backgroundColor: "#EAE8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayPillText: {
    color: "#6657E8",
    fontSize: 11,
    fontWeight: "700",
  },

  /* WEEKLY DATE STRIP */
  weekStripContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 6,
  },
  weekDayCard: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EAEBF4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  weekDayCardToday: {
    borderColor: "#B7AEFF",
  },
  weekDayCardSelected: {
    backgroundColor: "#6657E8",
    borderColor: "#6657E8",
    shadowColor: "#6657E8",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  weekDayName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8B90A5",
    marginBottom: 3,
  },
  weekDayNameSelected: {
    color: "#E2DEFF",
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#252840",
  },
  weekDayNumberSelected: {
    color: "#FFFFFF",
  },
  weekDayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginTop: 3,
  },

  /* PROGRESS CARD */
  progressCard: {
    backgroundColor: "#6657E8",
    borderRadius: 23,
    padding: 19,
    marginBottom: 26,
    shadowColor: "#6657E8",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  progressTextWrap: { flex: 1, paddingRight: 8 },
  progressEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#DAD6FF",
    marginBottom: 8,
  },
  progressTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 5,
  },
  progressSubtitle: { color: "#E1DEFF", fontSize: 12 },
  progressCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    borderColor: "#B7AEFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#796BEF",
  },
  progressPercent: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: "#8A7EF1",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  /* SECTION HEADER */
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { color: "#282B43", fontSize: 19, fontWeight: "800" },
  sectionSubtitle: { color: "#9296A9", fontSize: 11, marginTop: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6657E8",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  /* HABIT CARDS */
  habitList: { gap: 11 },
  habitCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECF4",
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  habitCardDone: { backgroundColor: "#FBFAFF", borderColor: "#DCD7FF" },
  habitIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  habitMain: { flex: 1, paddingRight: 6 },
  habitName: { color: "#30334B", fontSize: 15, fontWeight: "800", marginBottom: 3 },
  habitNameDone: { color: "#777B90" },
  habitStatus: { color: "#969BAD", fontSize: 11 },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DADDE8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  moreButton: {
    width: 30,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  /* EMPTY CARD */
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 23,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBECF4",
    marginBottom: 15,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#F0EEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  emptyTitle: {
    fontSize: 17,
    color: "#2C3049",
    fontWeight: "800",
    marginBottom: 7,
  },
  emptyText: {
    color: "#858AA0",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#6657E8",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  /* TINY TIP */
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#FFF9EC",
    borderRadius: 16,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#F7EBD2",
  },
  tipIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#FFEDC8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  tipContent: { flex: 1 },
  tipTitle: { color: "#80571A", fontSize: 12, fontWeight: "800", marginBottom: 4 },
  tipText: { color: "#987C4C", fontSize: 11, lineHeight: 17 },
  footer: {
    color: "#A0A4B5",
    fontSize: 10,
    textAlign: "center",
    marginTop: 18,
  },

  /* MODALS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(24, 26, 45, 0.42)",
    justifyContent: "flex-end",
  },
  modalKeyboard: { width: "100%" },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: Platform.OS === "ios" ? 38 : 26,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { color: "#252840", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  modalSubtitle: { color: "#8C91A5", fontSize: 12 },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#F3F3F8",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#8A8FA4",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#E6E7F0",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#282B43",
    fontSize: 14,
    marginBottom: 16,
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  iconChoice: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F6F6FA",
    borderWidth: 1.5,
    borderColor: "#F6F6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  iconChoiceSelected: { backgroundColor: "#F4F2FF", borderWidth: 1.5 },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 24,
  },
  colorChoice: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  colorChoiceSelected: { borderColor: "#34364C", transform: [{ scale: 1.13 }] },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  /* ACTION SHEET (EDIT / DELETE) */
  actionModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(24, 26, 45, 0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionModalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 38 : 26,
    alignItems: "stretch",
  },
  actionModalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E4ED",
    alignSelf: "center",
    marginBottom: 16,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#252840",
    textAlign: "center",
  },
  actionModalSubtitle: {
    fontSize: 12,
    color: "#8C91A5",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 3,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7FB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  actionMenuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionMenuText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E324A",
  },
  actionMenuCancelButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  actionMenuCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8B90A2",
  },

  /* FULL MONTH CALENDAR MODAL */
  calendarModalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
  },
  calendarNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 4,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F4F4F9",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#22253A",
  },
  calendarWeekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarWeekHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#8C91A5",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  calendarCell: {
    width: "14.28%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  calendarCellSelected: {
    backgroundColor: "#6657E8",
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: "#B7AEFF",
  },
  calendarCellText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222538",
  },
  calendarCellTextSelected: {
    color: "#FFFFFF",
  },
  calendarCellTextToday: {
    color: "#6657E8",
    fontWeight: "800",
  },
  calendarCompletedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2FAF8F",
    marginTop: 2,
  },
  calendarTodayButton: {
    backgroundColor: "#F4F4FA",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  calendarTodayButtonText: {
    color: "#6657E8",
    fontSize: 14,
    fontWeight: "800",
  },
});
