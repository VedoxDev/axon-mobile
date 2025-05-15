import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarList, LocaleConfig, CalendarProvider } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// 📅 Localización a español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

function generateMonthMarkedDates(selectedDate: string, theme: any): Record<string, any> {
  const date = new Date(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const marked: Record<string, any> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    marked[dateStr] = {
      disabled: false, // 👈 Forzamos que estén activos
    };
  }

  // Marcar el seleccionado
  marked[selectedDate] = {
    selected: true,
    selectedColor: theme.primary,
    selectedTextColor: '#fff',
    disabled: false,
  };

  return marked;
}


export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const [selectedDate, setSelectedDate] = useState(toDateString(today));

  const minDate = toDateString(new Date(currentYear, currentMonth - 2, 1));
  // Calculate the last day of the month, two months in the future
  const maxDate = toDateString(new Date(currentYear, currentMonth + 3, 0));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Calendario</Text>

      <CalendarProvider date={selectedDate}>
        <CalendarList
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          pastScrollRange={2}
          futureScrollRange={2}
          minDate={minDate}
          maxDate={maxDate}
          markedDates={generateMonthMarkedDates(selectedDate, theme)}
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
      </CalendarProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    paddingLeft: 20,
    paddingTop: 10,
  },
});
