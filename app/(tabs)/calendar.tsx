import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { Calendar, CalendarListRef, toDateId, CalendarTheme } from '@marceloterreiro/flash-calendar';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Colors } from '@/constants/Colors';
import 'moment/locale/es';
moment.locale('es');

// 💡 Eventos aleatorios simulados
const generatedEvents = [
  '2025-04-13',
  '2025-06-10',
  '2025-04-10',
  '2025-07-01',
  '2025-06-02',
  '2025-06-13',
  '2025-03-27',
  '2025-04-08',
  '2025-07-08',
  '2025-07-18',
].map((date, i) => ({ date, title: `Evento para ${date}`, id: `${date}-${i}` }));

export default function CalendarWithEventList() {
  const colorScheme = useColorScheme();
  const colorSet = Colors[colorScheme ?? 'light'];

  const [selectedDate, setSelectedDate] = useState(toDateId(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(moment().format('MMMM YYYY'));
  
  // Use refs instead of state for flags that need immediate updates
  const listSyncEnabledRef = useRef(false);
  const isProgrammaticScrollRef = useRef(true);
  const isScrollingRef = useRef(false);
  const initialRenderRef = useRef(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calendarRef = useRef<CalendarListRef>(null);
  const eventListRef = useRef<FlashList<any>>(null);

  const screenHeight = Dimensions.get('window').height;
  const calendarContainerHeight = screenHeight * 0.4;

  const visibleDays = useMemo(() => {
    const today = moment().startOf('month');
    const start = today.clone().subtract(2, 'months').startOf('month');
    const end = today.clone().add(2, 'months').endOf('month');

    const days: { date: string; hasEvent: boolean; eventTitle?: string }[] = [];
    const current = start.clone();

    while (current.isSameOrBefore(end)) {
      const date = current.format('YYYY-MM-DD');
      const found = generatedEvents.find(e => e.date === date);
      days.push({
        date,
        hasEvent: !!found,
        eventTitle: found?.title,
      });
      current.add(1, 'day');
    }

    return days;
  }, []);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      const index = visibleDays.findIndex(day => day.date === selectedDate);
      if (index !== -1 && eventListRef.current) {
        console.log('Initial scroll to index:', index);
        eventListRef.current.scrollToIndex({ 
          index, 
          animated: false,
          viewPosition: 0.5
        });
      }
    }
  }, [selectedDate, visibleDays]);

  // Cleanup function to reset scroll state
  const resetScrollState = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = null;
    }
    isScrollingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetScrollState();
    };
  }, [resetScrollState]);

  const handleScrollEnd = useCallback(() => {
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }
    scrollEndTimeoutRef.current = setTimeout(() => {
      console.log('Scroll state reset after timeout');
      isScrollingRef.current = false;
      listSyncEnabledRef.current = true;
    }, 50);
  }, []);

  const handleScrollBegin = useCallback(() => {
    console.log('List scroll began - enabling sync');
    resetScrollState(); // Reset any existing scroll state
    isScrollingRef.current = true;
    isProgrammaticScrollRef.current = false;
    listSyncEnabledRef.current = true;
  }, [resetScrollState]);

  const handleEventListViewableItemsChanged = useCallback(({
    viewableItems,
  }: { viewableItems: Array<{ item: { date: string }; isViewable: boolean; percentVisible?: number }> }) => {
    console.log('ViewableItemsChanged called', {
      listSyncEnabled: listSyncEnabledRef.current,
      isProgrammaticScroll: isProgrammaticScrollRef.current,
      isScrolling: isScrollingRef.current,
      viewableItemsCount: viewableItems.length,
      firstVisibleDate: viewableItems[0]?.item?.date,
      lastVisibleDate: viewableItems[viewableItems.length - 1]?.item?.date
    });

    if (!listSyncEnabledRef.current || isProgrammaticScrollRef.current || isScrollingRef.current) {
      console.log('Ignoring viewable items change - sync disabled, programmatic scroll, or currently scrolling');
      return;
    }

    let mostVisibleItem: { item: { date: string }; isViewable: boolean; percentVisible?: number } | null = null;
    let maxVisiblePercent = 0;

    viewableItems.forEach(item => {
      if (item.isViewable && item.percentVisible !== undefined && item.percentVisible > maxVisiblePercent) {
        maxVisiblePercent = item.percentVisible;
        mostVisibleItem = item;
      }
    });

    if (!mostVisibleItem) {
      mostVisibleItem = viewableItems.find(item => item.isViewable && item.item?.date) || null;
    }

    if (mostVisibleItem && mostVisibleItem.item?.date) {
      console.log('Updating selected date to:', mostVisibleItem.item.date);
      setSelectedDate(mostVisibleItem.item.date);
      if (calendarRef.current) {
        calendarRef.current.scrollToDate(moment(mostVisibleItem.item.date).toDate(), true, { additionalOffset: -50 });
      }
    }
  }, []);

  const linearTheme: CalendarTheme = useMemo(() => ({
    rowMonth: {
      content: {
        textAlign: 'left',
        color: colorSet.text,
        fontWeight: '700' as '700',
        display: 'none',
      },
    },
    rowWeek: {
      container: {
        borderBottomWidth: 1,
        borderBottomColor: colorSet.gray,
      },
    },
    itemWeekName: {
      content: { color: colorSet.gray },
    },
    itemDayContainer: {
      activeDayFiller: {
        backgroundColor: colorSet.tint,
      },
    },
    itemDay: {
      idle: ({ isPressed, isWeekend, id }) => ({
        container: {
          backgroundColor: isPressed ? colorSet.tint : 'transparent',
          borderRadius: 6,
          ...(generatedEvents.some(event => event.date === id) && {
            borderBottomWidth: 3,
            borderBottomColor: colorSet.orange,
            paddingBottom: 2,
          }),
        },
        content: {
          color: isWeekend ? colorSet.gray : colorSet.text,
        },
      }),
      today: ({ isPressed, id }) => ({
        container: {
          borderColor: colorSet.tint,
          borderWidth: 1,
          borderRadius: isPressed ? 4 : 30,
          backgroundColor: isPressed ? colorSet.tint : 'transparent',
          ...(generatedEvents.some(event => event.date === id) && {
            borderBottomWidth: 3,
            borderBottomColor: colorSet.orange,
            paddingBottom: 2,
          }),
        },
        content: {
          color: isPressed ? '#fff' : colorSet.tint,
        },
      }),
      active: () => ({
        container: {
          backgroundColor: colorSet.primary,
          borderRadius: 6,
        },
        content: {
          color: '#fff',
        },
      }),
    },
  }), [colorSet]);

  const months = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) =>
      moment().startOf('month').subtract(2, 'months').add(i, 'months')
    );
  }, []);

  const minDateId = months[0].format('YYYY-MM-DD');
  const maxDateId = months[4].endOf('month').format('YYYY-MM-DD');

  const onDayPress = useCallback((dateId: string) => {
    console.log('Calendar day pressed:', dateId);
    resetScrollState(); // Reset any existing scroll state
    // When selecting from calendar, disable all sync and updates
    listSyncEnabledRef.current = false;
    isProgrammaticScrollRef.current = true;
    isScrollingRef.current = true;
    setSelectedDate(dateId);
    
    // Scroll list to the selected date
    const index = visibleDays.findIndex(day => day.date === dateId);
    if (index !== -1 && eventListRef.current) {
      console.log('Scrolling list to index:', index);
      eventListRef.current.scrollToIndex({ 
        index, 
        animated: true, 
        viewPosition: 0.5
      });
    }
  }, [visibleDays, resetScrollState]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
    const totalScrollableHeight = contentSize.height - layoutMeasurement.height;
    const scrollY = contentOffset.y;

    const scrollPercent = Math.min(1, scrollY / totalScrollableHeight);
    const estimatedIndex = Math.floor(scrollPercent * months.length);

    const estimatedMonth = months[estimatedIndex] ?? months[0];
    setVisibleMonth(estimatedMonth.format('MMMM YYYY'));
  }, [months]);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    eventListItem: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderColor: colorSet.gray,
    },
    selectedEventListItem: {
      backgroundColor: colorSet.card,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    noEventsBox: {
      paddingVertical: 15,
      paddingHorizontal: 10,
      marginVertical: 5,
      borderWidth: 1,
      borderColor: colorSet.gray,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colorSet.inputBackground,
    },
    noEventsText: {
      fontSize: 18,
      fontStyle: 'italic',
    },
    monthOverlay: {
      position: 'absolute',
      top: 10,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 1,
    },
    monthOverlayText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
      color: colorSet.text,
      backgroundColor: colorScheme === 'dark' ? 'rgba(21, 23, 24, 0.7)' : 'rgba(255,255,255,0.7)',
    },
    eventDateHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 5,
      marginLeft: 8,
      color: '#555',
    },
  }), [colorSet, colorScheme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorSet.background }]}>
      <Text style={[styles.title, { color: colorSet.text }]}>📅 Calendario + Lista</Text>

      <View style={{ height: calendarContainerHeight }}>
        <Calendar.List
          ref={calendarRef}
          calendarMinDateId={minDateId}
          calendarMaxDateId={maxDateId}
          calendarInitialMonthId={selectedDate}
          calendarActiveDateRanges={[{ startId: selectedDate, endId: selectedDate }]}
          calendarDayHeight={38}
          calendarFirstDayOfWeek="monday"
          onCalendarDayPress={onDayPress}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          calendarSpacing={4}
          getCalendarMonthFormat={(date) => moment(date).locale('es').format('MMMM YYYY')}
          getCalendarWeekDayFormat={(date) => moment(date).locale('es').format('dd')}
          theme={linearTheme}
        />
        <View style={dynamicStyles.monthOverlay}>
          <Text style={dynamicStyles.monthOverlayText}>
            {visibleMonth}
          </Text>
        </View>
      </View>

      <FlashList
        data={visibleDays}
        ref={eventListRef}
        keyExtractor={(item) => item.date}
        estimatedItemSize={40}
        contentContainerStyle={{ paddingBottom: 20 }}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onViewableItemsChanged={handleEventListViewableItemsChanged}
        viewabilityConfig={{
          minimumViewTime: 10,
          itemVisiblePercentThreshold: 10
        }}
        renderItem={({ item }) => {
          const isSelected = item.date === selectedDate;
          return (
            <View>
              <Text style={dynamicStyles.eventDateHeader}>
                {moment(item.date).locale('es').format('DD MMMM - dddd')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('List item pressed:', item.date);
                  resetScrollState(); // Reset any existing scroll state
                  setSelectedDate(item.date);
                  listSyncEnabledRef.current = false;
                  isProgrammaticScrollRef.current = true;
                  isScrollingRef.current = true;
                }}
                style={[
                  dynamicStyles.eventListItem,
                  isSelected && dynamicStyles.selectedEventListItem,
                  !item.hasEvent && dynamicStyles.noEventsBox,
                ]}
              >
                {item.hasEvent ? (
                  <Text style={[dynamicStyles.eventTitle, { color: colorSet.text }]}>
                    {item.eventTitle}
                  </Text>
                ) : (
                  <Text style={[dynamicStyles.noEventsText, { color: colorSet.gray }]}>
                    Sin eventos
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
});
