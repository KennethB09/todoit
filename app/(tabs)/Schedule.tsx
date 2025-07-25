import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar
} from "react-native";
import { format, eachDayOfInterval, addDays } from "date-fns";
import { filterTasksForToday } from "@/utils/utility-functions";
import { useTodoListStore } from "@/context/zustand";
import { useThemeContext } from "@/context/ThemeContext";
import { Ttheme } from "@/types/dataType";
import AgendaItem from "@/components/AgendaItem";
import { CONVERT_DAYS } from "@/utils/utility-functions";
import EmptyList from "@/components/EmptyList";
import { Link } from "expo-router";

// Generate a date range (e.g., ±7 days from today)
const today = new Date();
const days = eachDayOfInterval({
  start: addDays(today, -30),
  end: addDays(today, 30),
});

const ITEM_WIDTH = 50;
const DAYS_PER_SNAP = 7;

export default function CustomAgenda() {
  const tasks = useTodoListStore((state) => state.userData.tasks);
  const todos = useTodoListStore((state) => state.userData.todos);
  const [selected, setSelected] = useState(format(today, "yyyy-MM-dd"));
  const { theme, colorTheme, colorScheme } = useThemeContext();
  const thisMonth = format(today, "LLLL d");
  const todayTask = filterTasksForToday(tasks).filter(
    (t) => t.isChecked === false
  ).length;

  const styles = createStyles(theme);

  let selectedDayTasks = tasks.filter(
    (task) =>
      task.dueDate?.enabled &&
      format(task.dueDate.date, "yyyy-MM-dd") === selected &&
      !task.isChecked
  );

  const repeatingTasks = tasks.filter(
    (task) =>
      task.taskType === "scheduled" &&
      !task.dueDate?.enabled &&
      task.repeat?.includes(
        CONVERT_DAYS[format(selected, "EEEE").toLowerCase()]
      ) &&
      !task.isChecked
  );

  const simpleTasks = tasks.filter(
    (task) => task.taskType === "simple" && !task.isChecked
  );

  selectedDayTasks = [...selectedDayTasks, ...repeatingTasks, ...simpleTasks];

  const selectedIndex = days.findIndex(
    (date) => format(date, "yyyy-MM-dd") === selected
  );

  const flatListRef = useRef<FlatList>(null);

  // Snap to selected date in the middle of the 7-day group
  useEffect(() => {
    if (selectedIndex >= 0 && flatListRef.current) {
      // Calculate the first index of the 7-day group so selected is in the middle
      let firstIndex = selectedIndex - Math.floor(DAYS_PER_SNAP / 2);
      if (firstIndex < 0) firstIndex = 0;
      if (firstIndex > days.length - DAYS_PER_SNAP)
        firstIndex = days.length - DAYS_PER_SNAP;
      flatListRef.current.scrollToIndex({
        index: firstIndex,
        animated: true,
        viewPosition: 0, // left edge of snap group
      });
    }
  }, [selectedIndex, days.length]);

  function onSelectDate(date: string) {
    setSelected(date);
    selectedDayTasks = tasks.filter(
      (task) =>
        task.dueDate?.enabled &&
        format(task.dueDate.date, "yyyy-MM-dd") === date
    );
    selectedDayTasks = [...selectedDayTasks, ...repeatingTasks, ...simpleTasks];
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{thisMonth}</Text>
        <Text style={styles.headerLabel}>{todayTask} Tasks</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={days}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => format(item, "yyyy-MM-dd")}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH * DAYS_PER_SNAP}
        initialScrollIndex={Math.max(
          selectedIndex - Math.floor(DAYS_PER_SNAP / 2),
          0
        )}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        contentContainerStyle={{
          ...styles.horizontalCalendar,
          paddingHorizontal:
            (Dimensions.get("window").width - ITEM_WIDTH * DAYS_PER_SNAP) / 2,
        }}
        renderItem={({ item }) => {
          const dateStr = format(item, "yyyy-MM-dd");
          const isActive = dateStr === selected;
          return (
            <TouchableOpacity
              onPress={() => onSelectDate(dateStr)}
              style={[
                styles.horizontalCalendarBtn,
                { width: ITEM_WIDTH },
                isActive && {
                  backgroundColor: colorTheme,
                  borderRadius: 50,
                  paddingHorizontal: 5,
                },
              ]}
            >
              <Text
                style={[
                  styles.horizontalCalendarDates,
                  isActive && {
                    color: theme.fontColor.white,
                    fontSize: theme.fontSizeML,
                  },
                ]}
              >
                {format(item, "dd")}
              </Text>
              <Text
                style={[
                  styles.horizontalCalendarLabel,
                  isActive && {
                    color: theme.fontColor.white,
                    fontSize: theme.fontSizeML,
                  },
                ]}
              >
                {format(item, "EEE")}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      {/* Agenda list */}
      <View style={{ height: "75%" }}>
        <Text style={styles.agendaTitle}>Today's Tasks</Text>
        <FlatList
          data={selectedDayTasks}
          ListEmptyComponent={<EmptyList text="No Tasks for this day" height={400}/>}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Link href={{
            pathname: "/[id]",
            params: { id: item.todoId, bg: todos.find(t => t.id === item.todoId)?.bg },
          }}><AgendaItem item={item} /></Link>}
          contentContainerStyle={{ paddingBottom: 100, height: "auto" }}
        />
      </View>
    </View>
  );
}

function createStyles(theme: Ttheme) {
  return StyleSheet.create({
    mainContainer: {
      height: "100%"
    },
    header: {
      alignItems: "center",
      marginBottom: 10,
    },
    headerTitle: {
      color: theme.fontColor.primary,
      fontSize: theme.fontSizeL,
      fontWeight: "bold",
      fontFamily: theme.fontFamily,
    },
    headerLabel: {
      color: theme.fontColor.secondary,
      fontSize: theme.fontSizeML,
      fontWeight: "regular",
      fontFamily: theme.fontFamily,
    },
    horizontalCalendar: {
      height: 90,
    },
    horizontalCalendarBtn: {
      width: 35,
      alignItems: "center",
      justifyContent: "center",
    },
    horizontalCalendarDates: {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizeML,
      color: theme.fontColor.secondary,
      fontWeight: "bold",
    },
    horizontalCalendarLabel: {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizeM,
      color: theme.fontColor.tertiary,
      fontWeight: "regular",
    },
    agendaTitle: {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizeML,
      color: theme.fontColor.primary,
      fontWeight: "bold",
      margin: 10,
    },
  });
}
