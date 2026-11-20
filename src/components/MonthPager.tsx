import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {MonthPager as MonthPagerState} from '../hooks/useMonthPager';
import {Assignments, Tile} from '../types';
import {toKey} from '../utils/date';
import {monthOf, PAGES} from '../utils/paging';
import {MonthGrid} from './MonthGrid';

type Props = {
  pager: MonthPagerState;
  assignments: Assignments;
  tileById: Record<string, Tile>;
};

// The horizontally swipeable list of months.
export function MonthPager({pager, assignments, tileById}: Props) {
  const {size, listRef, initialIndex, onLayout, onScrollEnd, goTo} = pager;
  const selectedKey = toKey(pager.selected);
  const todayKey = toKey(pager.today);

  return (
    <View style={styles.pager} onLayout={onLayout}>
      {size && (
        <FlatList
          key={`pager-${size.w}`}
          ref={listRef}
          data={PAGES}
          keyExtractor={i => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: size.w,
            offset: size.w * index,
            index,
          })}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          extraData={{selectedKey, assignments, tileById}}
          onMomentumScrollEnd={onScrollEnd}
          style={{height: size.h}}
          renderItem={({item}) => {
            const m = monthOf(item);
            return (
              <View style={{width: size.w, height: size.h}}>
                <MonthGrid
                  year={m.getFullYear()}
                  month={m.getMonth()}
                  selectedKey={selectedKey}
                  todayKey={todayKey}
                  assignments={assignments}
                  tileById={tileById}
                  onSelect={goTo}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pager: {flex: 1},
});
