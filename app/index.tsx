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

type Habit = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  completedDates: string[];
  createdAt: string;
};

const STORAGE_KEY = "@habit-tracker-basic/habits";
const COLORS = ["#6657E8", "#F39A5A", "#2FAF8F", "#E36F8B", "#4B91E2", "#B17ADB"];
const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "book-outline", "fitness-outline", "water-outline", "code-slash-outline",
  "leaf-outline", "moon-outline", "walk-outline", "heart-outline",
];

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prettyDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<(typeof ICONS)[number]>("book-outline");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const today = dateKey();

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setHabits(JSON.parse(saved));
      } catch {
        Alert.alert("Couldn't load habits", "Your saved habits could not be loaded.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits)).catch(() => {
      Alert.alert("Save failed", "Habits could not be saved on this device.");
    });
  }, [habits, loaded]);

  const completedCount = useMemo(
    () => habits.filter((habit) => habit.completedDates.includes(today)).length,
    [habits, today]
  );
  const progress = habits.length ? completedCount / habits.length : 0;

  function openAdd() {
    setEditingId(null);
    setHabitName("");
    setSelectedIcon("book-outline");
    setSelectedColor(COLORS[0]);
    setModalVisible(true);
  }

  function openEdit(habit: Habit) {
    setEditingId(habit.id);
    setHabitName(habit.name);
    setSelectedIcon(habit.icon);
    setSelectedColor(habit.color);
    setModalVisible(true);
  }

  function saveHabit() {
    const name = habitName.trim();
    if (!name) {
      Alert.alert("Habit name required", "Please enter a name for your habit.");
      return;
    }

    if (editingId) {
      setHabits((current) =>
        current.map((habit) =>
          habit.id === editingId ? { ...habit, name, icon: selectedIcon, color: selectedColor } : habit
        )
      );
    } else {
      const newHabit: Habit = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        icon: selectedIcon,
        color: selectedColor,
        completedDates: [],
        createdAt: today,
      };
      setHabits((current) => [newHabit, ...current]);
    }
    setModalVisible(false);
  }

  function toggleHabit(habit: Habit) {
    setHabits((current) =>
      current.map((item) => {
        if (item.id !== habit.id) return item;
        const wasCompleted = item.completedDates.includes(today);
        return {
          ...item,
          completedDates: wasCompleted
            ? item.completedDates.filter((date) => date !== today)
            : [...item.completedDates, today],
        };
      })
    );
  }

  function deleteHabit(habit: Habit) {
    Alert.alert("Delete habit?", `Remove "${habit.name}" from your tracker?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setHabits((current) => current.filter((item) => item.id !== habit.id)),
      },
    ]);
  }

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
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>SMALL STEPS, EVERY DAY</Text>
              <Text style={styles.title}>My Habits <Text style={styles.titleEmoji}>✦</Text></Text>
            </View>
            <View style={styles.avatar}>
              <Ionicons name="leaf" size={23} color="#6657E8" />
            </View>
          </View>

          <Text style={styles.date}>{prettyDate()}</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View style={styles.progressTextWrap}>
                <Text style={styles.progressEyebrow}>TODAY'S PROGRESS</Text>
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
                <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>Today's habits</Text>
              <Text style={styles.sectionSubtitle}>Build consistency one check at a time.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openAdd} accessibilityLabel="Add habit">
              <Ionicons name="add" size={21} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles-outline" size={28} color="#6657E8" />
              </View>
              <Text style={styles.emptyTitle}>Create your first habit</Text>
              <Text style={styles.emptyText}>
                Start small: read 10 pages, walk for 15 minutes, or practise coding.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAdd}>
                <Text style={styles.emptyButtonText}>+ Create a habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={habits}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.habitList}
              renderItem={({ item }) => {
                const done = item.completedDates.includes(today);
                return (
                  <View style={[styles.habitCard, done && styles.habitCardDone]}>
                    <View style={[styles.habitIcon, { backgroundColor: `${item.color}18` }]}>
                      <Ionicons name={item.icon} size={23} color={item.color} />
                    </View>
                    <TouchableOpacity
                      style={styles.habitMain}
                      onPress={() => toggleHabit(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.habitName, done && styles.habitNameDone]}>{item.name}</Text>
                      <Text style={styles.habitStatus}>{done ? "Completed today" : "Tap to mark complete"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.checkButton, done && styles.checkButtonDone]}
                      onPress={() => toggleHabit(item)}
                      accessibilityLabel={done ? `Mark ${item.name} incomplete` : `Complete ${item.name}`}
                    >
                      <Ionicons name={done ? "checkmark" : "checkmark-outline"} size={20} color={done ? "#FFFFFF" : "#9296AA"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.moreButton} onPress={() => {
                      Alert.alert(item.name, "Choose an action", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Edit", onPress: () => openEdit(item) },
                        { text: "Delete", style: "destructive", onPress: () => deleteHabit(item) },
                      ]);
                    }} accessibilityLabel={`Options for ${item.name}`}>
                      <Ionicons name="ellipsis-vertical" size={18} color="#858AA0" />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={20} color="#D18A28" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Tiny tip</Text>
              <Text style={styles.tipText}>Make it easy to start. Five minutes is better than waiting for the perfect moment.</Text>
            </View>
          </View>
          <Text style={styles.footer}>Your habits stay on this device.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{editingId ? "Edit habit" : "New habit"}</Text>
                  <Text style={styles.modalSubtitle}>Choose something you want to do daily.</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
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

              <Text style={styles.inputLabel}>PICK AN ICON</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconChoice, selectedIcon === icon && styles.iconChoiceSelected, selectedIcon === icon && { borderColor: selectedColor }]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons name={icon} size={22} color={selectedIcon === icon ? selectedColor : "#777D93"} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>PICK A COLOR</Text>
              <View style={styles.colorRow}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorChoice, { backgroundColor: color }, selectedColor === color && styles.colorChoiceSelected]}
                    onPress={() => setSelectedColor(color)}
                    accessibilityLabel={`Choose color ${color}`}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveHabit}>
                <Text style={styles.saveButtonText}>{editingId ? "Save changes" : "Create habit"}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  page: { paddingHorizontal: 21, paddingTop: 18, paddingBottom: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, color: "#8B8FA4", marginBottom: 6 },
  title: { fontSize: 31, fontWeight: "800", letterSpacing: -1, color: "#252840" },
  titleEmoji: { color: "#6657E8" },
  avatar: { width: 47, height: 47, borderRadius: 17, backgroundColor: "#EAE8FF", alignItems: "center", justifyContent: "center" },
  date: { color: "#858AA0", fontSize: 13, marginTop: 8, marginBottom: 19 },
  progressCard: { backgroundColor: "#6657E8", borderRadius: 23, padding: 19, marginBottom: 26, shadowColor: "#6657E8", shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  progressTextWrap: { flex: 1, paddingRight: 8 },
  progressEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: "#DAD6FF", marginBottom: 8 },
  progressTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginBottom: 5 },
  progressSubtitle: { color: "#E1DEFF", fontSize: 12 },
  progressCircle: { width: 67, height: 67, borderRadius: 34, borderWidth: 4, borderColor: "#B7AEFF", alignItems: "center", justifyContent: "center", backgroundColor: "#796BEF" },
  progressPercent: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  progressTrack: { height: 7, borderRadius: 10, backgroundColor: "#8A7EF1", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 10, backgroundColor: "#FFFFFF" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { color: "#282B43", fontSize: 19, fontWeight: "800" },
  sectionSubtitle: { color: "#9296A9", fontSize: 11, marginTop: 4 },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#6657E8", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, gap: 4 },
  addButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 23, alignItems: "center", borderWidth: 1, borderColor: "#EBECF4", marginBottom: 15 },
  emptyIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: "#F0EEFF", alignItems: "center", justifyContent: "center", marginBottom: 13 },
  emptyTitle: { fontSize: 17, color: "#2C3049", fontWeight: "800", marginBottom: 7 },
  emptyText: { color: "#858AA0", fontSize: 12, lineHeight: 19, textAlign: "center", marginBottom: 16 },
  emptyButton: { backgroundColor: "#6657E8", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  emptyButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  habitList: { gap: 10 },
  habitCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF4", borderRadius: 17, padding: 12, flexDirection: "row", alignItems: "center" },
  habitCardDone: { backgroundColor: "#FBFAFF", borderColor: "#DCD7FF" },
  habitIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  habitMain: { flex: 1 },
  habitName: { color: "#30334B", fontSize: 14, fontWeight: "800", marginBottom: 5 },
  habitNameDone: { color: "#777B90" },
  habitStatus: { color: "#969BAD", fontSize: 11 },
  checkButton: { width: 35, height: 35, borderRadius: 12, borderWidth: 1.5, borderColor: "#DADDE8", alignItems: "center", justifyContent: "center", marginRight: 3 },
  checkButtonDone: { backgroundColor: "#6657E8", borderColor: "#6657E8" },
  moreButton: { width: 27, height: 36, alignItems: "center", justifyContent: "center" },
  tipCard: { flexDirection: "row", backgroundColor: "#FFF9EC", borderRadius: 16, padding: 14, marginTop: 20, borderWidth: 1, borderColor: "#F7EBD2" },
  tipIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: "#FFEDC8", alignItems: "center", justifyContent: "center", marginRight: 11 },
  tipContent: { flex: 1 },
  tipTitle: { color: "#80571A", fontSize: 12, fontWeight: "800", marginBottom: 4 },
  tipText: { color: "#987C4C", fontSize: 11, lineHeight: 17 },
  footer: { color: "#A0A4B5", fontSize: 10, textAlign: "center", marginTop: 17 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(24, 26, 45, 0.42)", justifyContent: "flex-end" },
  modalKeyboard: { width: "100%" },
  modalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 27, borderTopRightRadius: 27, paddingHorizontal: 22, paddingTop: 23, paddingBottom: Platform.OS === "ios" ? 35 : 25 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 23 },
  modalTitle: { color: "#252840", fontSize: 23, fontWeight: "800", marginBottom: 5 },
  modalSubtitle: { color: "#8C91A5", fontSize: 12 },
  closeButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: "#F3F3F8", alignItems: "center", justifyContent: "center" },
  inputLabel: { color: "#8A8FA4", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 9, marginTop: 3 },
  nameInput: { borderWidth: 1, borderColor: "#E6E7F0", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: "#282B43", fontSize: 14, marginBottom: 20 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  iconChoice: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F6F6FA", borderWidth: 1.5, borderColor: "#F6F6FA", alignItems: "center", justifyContent: "center" },
  iconChoiceSelected: { backgroundColor: "#F4F2FF", borderWidth: 1.5 },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 25 },
  colorChoice: { width: 29, height: 29, borderRadius: 15, borderWidth: 3, borderColor: "#FFFFFF" },
  colorChoiceSelected: { borderColor: "#34364C", transform: [{ scale: 1.13 }] },
  saveButton: { backgroundColor: "#6657E8", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
