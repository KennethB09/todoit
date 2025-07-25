import { View, Text, StyleSheet, SectionList, StatusBar, Dimensions } from "react-native";
import React from "react";
import { useThemeContext } from "@/context/ThemeContext";
import { useTodoListStore } from "@/context/zustand";
import { task, Ttheme } from "@/types/dataType";
import { format } from "date-fns";
import TaskItem from "@/components/task_card/TaskItem";
import { filterTasksForToday } from "@/utils/utility-functions";
import EmptyList from "@/components/EmptyList";

const { height } = Dimensions.get("window");

export default function Task() {
  const tasks = useTodoListStore((state) => state.userData.tasks);
  const todos = useTodoListStore((state) => state.userData.todos);
  const { theme, colorScheme } = useThemeContext();
  const styles = createStyle(theme);

  const todayTasks = tasks ? filterTasksForToday(tasks) : [];

  function filterTasksForPastDays(tasks: task[], today = new Date()) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dueDateTask = tasks.filter(
      (t) =>
        t.taskType === "scheduled" &&
        t.dueDate?.enabled &&
        format(t.dueDate.date, "MM/dd/yyyy") !==
        format(today, "MM/dd/yyyy") &&
        new Date(t.dueDate.date) < new Date(today.setHours(0, 0, 0, 0)) &&
        t.isChecked === false
    );

    return dueDateTask;
  }

  const CATEGORIZE_TASKS = [
    {
      title: "ongoing",
      data: todayTasks.filter(task => task.isChecked === false),
    },
    {
      title: "finished",
      data: todayTasks.filter(task => task.isChecked === true),
    },
    {
      title: "past the due-date",
      data: filterTasksForPastDays(tasks),
    }
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <SectionList
        sections={todayTasks.length === 0 ? [] : CATEGORIZE_TASKS}
        keyExtractor={(task) => task.id}
        contentContainerStyle={styles.contentContainer}
        ListEmptyComponent={<EmptyList text="No tasks for Today" height={height - 50}/>}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TaskItem
              item={item}
              showFromTodo={true}
              parentTodo={todos.find(todo => todo.id === item.todoId)!}
            />
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
      />
    </View>
  );
}

function createStyle(theme: Ttheme) {
  return StyleSheet.create({
    mainContainer: {
      height: height,
      width: "100%",
      backgroundColor: theme.background,
    },
    sectionTitle: {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizeML,
      color: theme.fontColor.primary,
      textTransform: "capitalize",
      marginLeft: 15,
    },
    itemContainer: {
      paddingTop: 10,
      paddingHorizontal: 15,
    },
    contentContainer: {
      paddingBottom: 120,
      height: "auto"
    },
  });
}
