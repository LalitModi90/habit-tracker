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
  emoji?: string;
  color: string;
  completedDates: string[];
  createdAt: string;
};

const STORAGE_KEY = "@habit-tracker-basic/habits";

// Palette matching the user's screenshot
const CARD_COLORS = [
  "#5B3EE8", // Purple
  "#FF0FB5", // Vibrant Pink / Magenta
  "#20BF6B", // Fresh Green
  "#45AAF2", // Sky Blue
  "#FC5C65", // Coral Red
  "#FA8231", // Orange
  "#8854D0", // Violet
];

const PRESET_EMOJIS = ["🏃", "🤸", "🧘", "🚶", "💧", "📚", "💪", "🍎", "⚡", "😴", "💻", "✨"];

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "fitness-outline",
  "walk-outline",
  "water-outline",
  "book-outline",
  "leaf-outline",
  "heart-outline",
  "moon-outline",
  "code-slash-outline",
];

function dateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Generate the 7 days around today (or current week)
function getWeekDays(referenceDate = new Date()) {
  const days = [];
  const current = new Date(referenceDate);
  // Start from 2 days before today up to 4 days after
  const start = new Date(current);
  start.setDate(current.getDate() - 2);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      key: dateToKey(d),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      dayNum: d.getDate(),
      colorIndex: i % CARD_COLORS.length,
    });
  }
  return days;
}

export default function HomeScreen() {
  const todayKey = useMemo(() => dateToKey(new Date()), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentTab, setCurrentTab] = useState<"habits" | "statistic">("habits");

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState("");
  const [habitSubtitle, setHabitSubtitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🏃");
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<(typeof ICONS)[number]>("fitness-outline");

  // Action Menu State
  const [actionMenuHabit, setActionMenuHabit] = useState<Habit | null>(null);

  // Settings Modal
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Week days strip
  const weekDays = useMemo(() => getWeekDays(new Date()), []);

  // Load Initial Habits
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: Habit[] = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setHabits(parsed);
          } else {
            // Seed with starter habits matching the screenshot
            const sampleHabits: Habit[] = [
              {
                id: "sample-1",
                name: "Morning Exercise",
                subtitle: "Everyday at 8:30 am",
                emoji: "🏃",
                icon: "fitness-outline",
                color: "#5B3EE8",
                completedDates: [todayKey],
                createdAt: todayKey,
              },
              {
                id: "sample-2",
                name: "Stretch",
                subtitle: "10 times",
                emoji: "🤸",
                icon: "fitness-outline",
                color: "#FF0FB5",
                completedDates: [todayKey],
                createdAt: todayKey,
              },
              {
                id: "sample-3",
                name: "Daily Meditation",
                subtitle: "Keep calm...",
                emoji: "🧘",
                icon: "leaf-outline",
                color: "#20BF6B",
                completedDates: [todayKey],
                createdAt: todayKey,
              },
              {
                id: "sample-4",
                name: "Walk",
                subtitle: "30 minutes outside",
                emoji: "🚶",
                icon: "walk-outline",
                color: "#45AAF2",
                completedDates: [],
                createdAt: todayKey,
              },
              {
                id: "sample-5",
                name: "Push-Up",
                subtitle: "20 times",
                emoji: "💪",
                icon: "fitness-outline",
                color: "#FC5C65",
                completedDates: [],
                createdAt: todayKey,
              },
            ];
            setHabits(sampleHabits);
          }
        } else {
          // Initial starter data
          const sampleHabits: Habit[] = [
            {
              id: "sample-1",
              name: "Morning Exercise",
              subtitle: "Everyday at 8:30 am",
              emoji: "🏃",
              icon: "fitness-outline",
              color: "#5B3EE8",
              completedDates: [todayKey],
              createdAt: todayKey,
            },
            {
              id: "sample-2",
              name: "Stretch",
              subtitle: "10 times",
              emoji: "🤸",
              icon: "fitness-outline",
              color: "#FF0FB5",
              completedDates: [todayKey],
              createdAt: todayKey,
            },
            {
              id: "sample-3",
              name: "Daily Meditation",
              subtitle: "Keep calm...",
              emoji: "🧘",
              icon: "leaf-outline",
              color: "#20BF6B",
              completedDates: [todayKey],
              createdAt: todayKey,
            },
            {
              id: "sample-4",
              name: "Walk",
              subtitle: "30 minutes outside",
              emoji: "🚶",
              icon: "walk-outline",
              color: "#45AAF2",
              completedDates: [],
              createdAt: todayKey,
            },
            {
              id: "sample-5",
              name: "Push-Up",
              subtitle: "20 times",
              emoji: "💪",
              icon: "fitness-outline",
              color: "#FC5C65",
              completedDates: [],
              createdAt: todayKey,
            },
          ];
          setHabits(sampleHabits);
        }
      } catch {
        // Fallback
      } finally {
        setLoaded(true);
      }
    })();
  }, [todayKey]);

  // Save on update
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits)).catch(() => {});
  }, [habits, loaded]);

  // Current day statistics
  const completedCount = useMemo(
    () => habits.filter((h) => h.completedDates.includes(selectedDateKey)).length,
    [habits, selectedDateKey]
  );
  const progressRatio = habits.length ? completedCount / habits.length : 0;

  // Toggle habit for selected date
  function toggleHabit(habit: Habit) {
    setHabits((current) =>
      current.map((item) => {
        if (item.id !== habit.id) return item;
        const done = item.completedDates.includes(selectedDateKey);
        return {
          ...item,
          completedDates: done
            ? item.completedDates.filter((d) => d !== selectedDateKey)
            : [...item.completedDates, selectedDateKey],
        };
      })
    );
  }

  // Open Add modal
  function openAdd() {
    setEditingId(null);
    setHabitName("");
    setHabitSubtitle("");
    setSelectedEmoji("🏃");
    setSelectedColor(CARD_COLORS[habits.length % CARD_COLORS.length]);
    setSelectedIcon("fitness-outline");
    setModalVisible(true);
  }

  // Open Edit modal
  function openEdit(habit: Habit) {
    setEditingId(habit.id);
    setHabitName(habit.name);
    setHabitSubtitle(habit.subtitle || "");
    setSelectedEmoji(habit.emoji || "✨");
    setSelectedColor(habit.color || CARD_COLORS[0]);
    setSelectedIcon(habit.icon || "fitness-outline");
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
                emoji: selectedEmoji,
                color: selectedColor,
                icon: selectedIcon,
              }
            : h
        )
      );
    } else {
      const newHabit: Habit = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        subtitle: habitSubtitle.trim() || "Daily habit",
        emoji: selectedEmoji,
        color: selectedColor,
        icon: selectedIcon,
        completedDates: [],
        createdAt: selectedDateKey,
      };
      setHabits((current) => [...current, newHabit]);
    }
    setModalVisible(false);
  }

  // Delete Habit
  function deleteHabit(habit: Habit) {
    if (Platform.OS === "web") {
      const ok = window.confirm(`Remove "${habit.name}" from your habits?`);
      if (ok) {
        setHabits((current) => current.filter((h) => h.id !== habit.id));
      }
    } else {
      Alert.alert("Delete Habit", `Remove "${habit.name}" from your habits?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setHabits((current) => current.filter((h) => h.id !== habit.id)),
        },
      ]);
    }
  }

  // Statistics Computations
  const totalCompletedAllTime = useMemo(() => {
    return habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  }, [habits]);

  const bestStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => h.completedDates.length), 0);
  }, [habits]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setSettingsVisible(true)}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings" size={24} color="#1E202A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedDateKey === todayKey ? "Today" : selectedDateKey}
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setSelectedDateKey(todayKey)}
          accessibilityLabel="Go to Today"
        >
          <Ionicons name="calendar" size={24} color="#1E202A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentTab === "habits" ? (
          <>
            {/* WEEKLY DATE STRIP */}
            <View style={styles.dateStrip}>
              {weekDays.map((item) => {
                const isSelected = item.key === selectedDateKey;
                const isToday = item.key === todayKey;
                const cardAccentColor = CARD_COLORS[item.colorIndex];

                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    style={[
                      styles.dateCard,
                      isSelected && styles.dateCardSelected,
                      !isSelected && { borderColor: cardAccentColor },
                    ]}
                    onPress={() => setSelectedDateKey(item.key)}
                  >
                    <Text style={[styles.dateDayName, isSelected && styles.dateDayNameSelected]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.dateDayNum, isSelected && styles.dateDayNumSelected]}>
                      {item.dayNum}
                    </Text>
                    {isSelected && <View style={styles.dateDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PROGRESS SECTION */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValueText}>
                  {Math.round(progressRatio * 100)}% ({completedCount}/{habits.length})
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(Math.max(progressRatio * 100, 0), 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* HABITS LIST */}
            <View style={styles.habitsContainer}>
              {habits.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>✨</Text>
                  <Text style={styles.emptyTitle}>No habits yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the purple + button below to create your first habit!
                  </Text>
                </View>
              ) : (
                habits.map((habit) => {
                  const isDone = habit.completedDates.includes(selectedDateKey);
                  const habitColor = habit.color || CARD_COLORS[0];

                  return (
                    <TouchableOpacity
                      key={habit.id}
                      activeOpacity={0.85}
                      style={[
                        styles.habitCard,
                        { borderColor: habitColor },
                      ]}
                      onPress={() => setActionMenuHabit(habit)}
                    >
                      {/* Left Circular Checkbox */}
                      <TouchableOpacity
                        style={[
                          styles.checkCircle,
                          isDone
                            ? { backgroundColor: habitColor, borderColor: habitColor }
                            : { borderColor: "#A5A8B8" },
                        ]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={() => toggleHabit(habit)}
                        accessibilityLabel={isDone ? "Mark incomplete" : "Mark complete"}
                      >
                        {isDone && <Ionicons name="checkmark" size={17} color="#FFFFFF" />}
                      </TouchableOpacity>

                      {/* Content Area */}
                      <View style={styles.habitContentWrap}>
                        <View style={styles.habitTitleRow}>
                          {habit.emoji ? (
                            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                          ) : null}
                          <Text
                            style={[
                              styles.habitTitle,
                              isDone && styles.habitTitleDone,
                            ]}
                            numberOfLines={1}
                          >
                            {habit.name}
                          </Text>
                        </View>
                        {habit.subtitle ? (
                          <Text style={styles.habitSubtitle} numberOfLines={1}>
                            {habit.subtitle}
                          </Text>
                        ) : null}
                      </View>

                      {/* Right Chevron */}
                      <TouchableOpacity
                        style={styles.chevronButton}
                        onPress={() => setActionMenuHabit(habit)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Ionicons name="chevron-forward" size={19} color="#7D8297" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        ) : (
          /* STATISTIC VIEW */
          <View style={styles.statsContainer}>
            <Text style={styles.statsHeaderTitle}>Your Consistency 📊</Text>

            <View style={styles.statCardsGrid}>
              <View style={[styles.statBox, { borderColor: "#5B3EE8" }]}>
                <Text style={styles.statBoxEmoji}>🔥</Text>
                <Text style={styles.statBoxNumber}>{bestStreak} Days</Text>
                <Text style={styles.statBoxLabel}>Best Streak</Text>
              </View>

              <View style={[styles.statBox, { borderColor: "#20BF6B" }]}>
                <Text style={styles.statBoxEmoji}>🎯</Text>
                <Text style={styles.statBoxNumber}>{totalCompletedAllTime}</Text>
                <Text style={styles.statBoxLabel}>Total Check-ins</Text>
              </View>
            </View>

            <View style={styles.weeklySummaryCard}>
              <Text style={styles.summaryCardTitle}>Weekly Overview</Text>
              <Text style={styles.summaryCardSub}>
                Habits completed per day in the current week:
              </Text>

              <View style={styles.barGraphRow}>
                {weekDays.map((wd) => {
                  const dayCompleted = habits.filter((h) =>
                    h.completedDates.includes(wd.key)
                  ).length;
                  const ratio = habits.length ? dayCompleted / habits.length : 0;
                  const heightPercent = Math.max(ratio * 100, 10);

                  return (
                    <View key={wd.key} style={styles.graphColumn}>
                      <View style={styles.graphBarTrack}>
                        <View
                          style={[
                            styles.graphBarFill,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor:
                                wd.key === todayKey ? "#5B3EE8" : "#9B8DF2",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.graphDayText}>{wd.dayName.slice(0, 3)}</Text>
                      <Text style={styles.graphCountText}>{dayCompleted}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>
                "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time."
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR WITH FLOATING PLUS BUTTON */}
      <View style={styles.bottomNav}>
        {/* Habits Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("habits")}
        >
          <Ionicons
            name="list"
            size={24}
            color={currentTab === "habits" ? "#5B3EE8" : "#8A8F9F"}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === "habits" && styles.navLabelActive,
            ]}
          >
            Habits
          </Text>
        </TouchableOpacity>

        {/* Floating Add Plus Button */}
        <TouchableOpacity
          style={styles.floatingAddButton}
          activeOpacity={0.85}
          onPress={openAdd}
          accessibilityLabel="Add New Habit"
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Statistic Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab("statistic")}
        >
          <Ionicons
            name="bar-chart"
            size={24}
            color={currentTab === "statistic" ? "#5B3EE8" : "#8A8F9F"}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === "statistic" && styles.navLabelActive,
            ]}
          >
            Statistic
          </Text>
        </TouchableOpacity>
      </View>

      {/* CREATE / EDIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalKeyboardWrap}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalSheetTitle}>
                  {editingId ? "Edit Habit" : "New Habit"}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseCircle}
                >
                  <Ionicons name="close" size={20} color="#606478" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* HABIT NAME */}
                <Text style={styles.inputHeading}>HABIT NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Morning Exercise, Push-Up"
                  placeholderTextColor="#A0A5B9"
                  value={habitName}
                  onChangeText={setHabitName}
                  maxLength={40}
                  autoFocus
                />

                {/* SCHEDULE / FREQUENCY */}
                <Text style={styles.inputHeading}>FREQUENCY / SUBTITLE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Everyday at 8:30 am, 20 times"
                  placeholderTextColor="#A0A5B9"
                  value={habitSubtitle}
                  onChangeText={setHabitSubtitle}
                  maxLength={50}
                />

                {/* PICK EMOJI */}
                <Text style={styles.inputHeading}>CHOOSE AN EMOJI</Text>
                <View style={styles.emojiRow}>
                  {PRESET_EMOJIS.map((em) => (
                    <TouchableOpacity
                      key={em}
                      style={[
                        styles.emojiCircle,
                        selectedEmoji === em && styles.emojiCircleSelected,
                      ]}
                      onPress={() => setSelectedEmoji(em)}
                    >
                      <Text style={styles.emojiText}>{em}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* PICK BORDER COLOR */}
                <Text style={styles.inputHeading}>CHOOSE CARD COLOR</Text>
                <View style={styles.colorPaletteRow}>
                  {CARD_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorSwatchActive,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>

                {/* SAVE BUTTON */}
                <TouchableOpacity
                  style={[styles.primarySaveButton, { backgroundColor: selectedColor }]}
                  onPress={saveHabit}
                >
                  <Text style={styles.primarySaveButtonText}>
                    {editingId ? "Save Changes" : "Create Habit"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ACTION SHEET (EDIT / DELETE) */}
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
              {actionMenuHabit?.emoji} {actionMenuHabit?.name}
            </Text>
            <Text style={styles.actionModalSubtitle}>
              {actionMenuHabit?.subtitle || "Daily habit"}
            </Text>

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
                <Ionicons name="pencil" size={18} color="#5B3EE8" />
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

      {/* SETTINGS MODAL */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionModalBackdrop}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <View style={styles.actionModalCard}>
            <View style={styles.actionModalHandle} />
            <Text style={styles.actionModalTitle}>Habit Tracker Settings</Text>
            <Text style={styles.actionModalSubtitle}>App Version 1.0.0 • Offline Ready</Text>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setSettingsVisible(false);
                if (Platform.OS === "web") {
                  const ok = window.confirm("Reset habits to default template?");
                  if (ok) {
                    AsyncStorage.removeItem(STORAGE_KEY).then(() => {
                      window.location.reload();
                    });
                  }
                } else {
                  Alert.alert("Reset Habits", "Reset habits to defaults?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Reset",
                      style: "destructive",
                      onPress: async () => {
                        await AsyncStorage.removeItem(STORAGE_KEY);
                        setHabits([]);
                      },
                    },
                  ]);
                }
              }}
            >
              <View style={[styles.actionMenuIconWrap, { backgroundColor: "#FFF2E2" }]}>
                <Ionicons name="refresh" size={18} color="#FA8231" />
              </View>
              <Text style={styles.actionMenuText}>Reset to default habits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuCancelButton}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.actionMenuCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#181A22",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 95,
  },

  /* WEEKLY DATE STRIP */
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  dateCard: {
    width: 45,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E6E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  dateCardSelected: {
    backgroundColor: "#5B3EE8",
    borderColor: "#5B3EE8",
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8B90A5",
    marginBottom: 2,
  },
  dateDayNameSelected: {
    color: "#FFFFFF",
    opacity: 0.9,
  },
  dateDayNum: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222533",
  },
  dateDayNumSelected: {
    color: "#FFFFFF",
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#5B3EE8",
    position: "absolute",
    bottom: -9,
  },

  /* PROGRESS */
  progressSection: {
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#181A24",
  },
  progressValueText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7D8297",
  },
  progressTrack: {
    height: 7,
    borderRadius: 8,
    backgroundColor: "#EFEFF5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#5B3EE8",
  },

  /* HABIT CARDS */
  habitsContainer: {
    gap: 14,
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  habitContentWrap: {
    flex: 1,
    paddingRight: 6,
  },
  habitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  habitEmoji: {
    fontSize: 16,
    marginRight: 7,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E202B",
  },
  habitTitleDone: {
    color: "#8B90A2",
    textDecorationLine: "none",
  },
  habitSubtitle: {
    fontSize: 12,
    color: "#868B9E",
    marginTop: 3,
  },
  chevronButton: {
    padding: 4,
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222533",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8C91A5",
    textAlign: "center",
    maxWidth: 240,
  },

  /* STATISTIC TAB */
  statsContainer: {
    paddingTop: 8,
  },
  statsHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#181A22",
    marginBottom: 16,
  },
  statCardsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
  },
  statBoxEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  statBoxNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#202332",
    marginBottom: 3,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#858A9F",
  },
  weeklySummaryCard: {
    backgroundColor: "#F8F8FC",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#202332",
    marginBottom: 4,
  },
  summaryCardSub: {
    fontSize: 12,
    color: "#858A9F",
    marginBottom: 18,
  },
  barGraphRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  graphColumn: {
    alignItems: "center",
    flex: 1,
  },
  graphBarTrack: {
    width: 14,
    height: 75,
    backgroundColor: "#E7E8F2",
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 6,
  },
  graphBarFill: {
    width: "100%",
    borderRadius: 8,
  },
  graphDayText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#858A9F",
  },
  graphCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#202332",
    marginTop: 2,
  },
  quoteCard: {
    backgroundColor: "#FFF9F1",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F7E6CE",
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8B6528",
    fontStyle: "italic",
    textAlign: "center",
  },

  /* BOTTOM NAVIGATION BAR */
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F5",
    paddingBottom: Platform.OS === "ios" ? 16 : 6,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8F9F",
    marginTop: 3,
  },
  navLabelActive: {
    color: "#5B3EE8",
  },
  floatingAddButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#5B3EE8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    shadowColor: "#5B3EE8",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 22, 36, 0.45)",
    justifyContent: "flex-end",
  },
  modalKeyboardWrap: {
    width: "100%",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 26,
    maxHeight: "88%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalSheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#202332",
  },
  modalCloseCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2F3F8",
    alignItems: "center",
    justifyContent: "center",
  },
  inputHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#8C91A5",
    marginBottom: 7,
    marginTop: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#E6E8F2",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222533",
    marginBottom: 16,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 18,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#F5F6FA",
  },
  emojiCircleSelected: {
    backgroundColor: "#EEEBFF",
    borderColor: "#5B3EE8",
  },
  emojiText: {
    fontSize: 20,
  },
  colorPaletteRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  colorSwatchActive: {
    borderColor: "#202332",
    transform: [{ scale: 1.15 }],
  },
  primarySaveButton: {
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  primarySaveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  /* ACTION SHEET STYLES */
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
});
