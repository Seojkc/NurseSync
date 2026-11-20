import {useMemo, useRef, useState} from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {Size} from '../types';
import {monthKeyOf, startOfDay} from '../utils/date';
import {clamp} from '../utils/math';
import {BASE_INDEX, indexOf, monthOf, PAGE_COUNT} from '../utils/paging';

// Month paging + the selected day. Swipe / arrow / "jump to date" all go through here.
export function useMonthPager() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(today);
  const [pageIndex, setPageIndex] = useState(BASE_INDEX);
  const pageRef = useRef(BASE_INDEX); // always-current page, safe in callbacks
  const listRef = useRef<FlatList<number>>(null);
  const [size, setSize] = useState<Size | null>(null);

  const viewMonth = useMemo(() => monthOf(pageIndex), [pageIndex]);
  const viewMonthKey = monthKeyOf(viewMonth);

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    setSize(prev =>
      prev && prev.w === width && prev.h === height
        ? prev
        : {w: width, h: height},
    );
  };

  const scrollToPage = (idx: number, animated: boolean) => {
    listRef.current?.scrollToIndex({index: idx, animated});
  };

  // Called when the visible month changes by swipe / arrows
  const applyPage = (idx: number) => {
    if (idx === pageRef.current) {
      return;
    }
    pageRef.current = idx;
    setPageIndex(idx);
    const m = monthOf(idx);
    const isThisMonth =
      m.getFullYear() === today.getFullYear() &&
      m.getMonth() === today.getMonth();
    setSelected(isThisMonth ? today : m); // today, else the 1st
  };

  // Select a date and make sure its month is showing
  const goTo = (d: Date) => {
    setSelected(d);
    const idx = indexOf(d);
    if (idx !== pageRef.current) {
      const animated = Math.abs(idx - pageRef.current) <= 1;
      pageRef.current = idx;
      setPageIndex(idx);
      scrollToPage(idx, animated);
    }
  };

  const changeMonth = (delta: number) => {
    const idx = clamp(pageRef.current + delta, 0, PAGE_COUNT - 1);
    if (idx === pageRef.current) {
      return;
    }
    scrollToPage(idx, true);
    applyPage(idx);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size) {
      return;
    }
    const idx = Math.round(e.nativeEvent.contentOffset.x / size.w);
    applyPage(clamp(idx, 0, PAGE_COUNT - 1));
  };

  return {
    today,
    selected,
    viewMonth,
    viewMonthKey,
    listRef,
    size,
    initialIndex: pageRef.current,
    onLayout,
    onScrollEnd,
    goTo,
    changeMonth,
  };
}

export type MonthPager = ReturnType<typeof useMonthPager>;
