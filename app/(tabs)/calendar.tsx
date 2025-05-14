import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { ExpandableCalendar, AgendaList, CalendarProvider, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  monthNamesShort: [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ],
  dayNames: [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

type EventItem = {
  title: string;
  data: { name: string; height?: number }[];
};

// 🧪 Ejemplo de eventos por día
const EVENTS: EventItem[] = [
  {
    title: '2025-05-14',
    data: [{ name: 'Reunión de equipo' }, { name: 'Entrega informe' }]
  },
  {
    title: '2025-05-15',
    data: [{ name: 'Llamada cliente' }]
  },
];

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const renderItem = useCallback(({ item }: { item: { name: string } }) => (
    <View style={[styles.eventItem, { backgroundColor: theme.card }]}>
      <Text style={[styles.eventText, { color: theme.text }]}>{item.name}</Text>
    </View>
  ), [theme]);

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Calendario</Text>

      <CalendarProvider
        date={EVENTS[0]?.title}
        showTodayButton
        theme={{
          todayButtonTextColor: theme.tint
        }}
      >
        <ExpandableCalendar
          firstDay={1}
          closeOnDayPress={false}
          markedDates={{
            '2025-05-14': { marked: true, dotColor: theme.primary },
            '2025-05-15': { marked: true, dotColor: theme.primary }
          }}
          theme={{
            calendarBackground: theme.background,
            textSectionTitleColor: theme.gray,
            selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: '#fff',
            todayTextColor: theme.tint,
            dayTextColor: theme.text,
            monthTextColor: theme.text,
            arrowColor: theme.tint,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
        <AgendaList
          sections={EVENTS}
          renderItem={renderItem}
          sectionStyle={{
            ...styles.sectionStyle,
            backgroundColor: theme.background,
          }}
        />
      </CalendarProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    paddingLeft: 20,
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 8,
    marginBottom: 20,
  },
  eventsContainer: {
    flex: 1,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionStyle: {
    padding: 10,
    fontWeight: 'bold',
    fontSize: 16
  },
  eventItem: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 1,
  },
  eventText: {
    fontSize: 16,
  },
});
