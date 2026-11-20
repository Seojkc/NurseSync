import React, {useMemo, useState} from 'react';
import {Alert, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CalendarHeader} from '../components/CalendarHeader';
import {MonthPager} from '../components/MonthPager';
import {TileBar} from '../components/TileBar';
import {WeekdayRow} from '../components/WeekdayRow';
import {useCalendarData} from '../hooks/useCalendarData';
import {useMonthPager} from '../hooks/useMonthPager';
import {AddShiftModal} from '../modals/AddShiftModal';
import {QuickEntryModal} from '../modals/quickEntry/QuickEntryModal';
import {DayModal} from '../modals/day/DayModal';
import {VacationModal} from '../modals/vacation/VacationModal';
import {ImportRow, Leave, Tile} from '../types';
import {confirmDeleteLeave, confirmDeleteShift} from '../utils/confirm';
import {addDays, keyToDate, toKey} from '../utils/date';
import {leaveProblem} from '../utils/leave';
import {monthSummary} from '../utils/summary';
import {styles} from './CalendarScreen.styles';

// The main screen: wires the data, the month pager and the popups together.
export default function CalendarScreen() {
  const data = useCalendarData();
  const pager = useMonthPager();

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [vacOpen, setVacOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);

  const selectedKey = toKey(pager.selected);

  const summary = useMemo(
    () =>
      monthSummary(
        pager.viewMonthKey,
        data.assignments,
        data.tileById,
        data.leaves,
      ),
    [pager.viewMonthKey, data.assignments, data.tileById, data.leaves],
  );

  // ----- tile bar -----

  const isBlocked = (tile: Tile) =>
    tile.leave
      ? leaveProblem(
          tile.leave,
          selectedKey,
          data.assignments,
          data.usedByLeave,
        ) !== null
      : false;

  // Put a tile on the selected day. Returns false (and tells the user) if a leave can't be used.
  const assignTile = (tile: Tile): boolean => {
    if (tile.leave) {
      const problem = leaveProblem(
        tile.leave,
        selectedKey,
        data.assignments,
        data.usedByLeave,
      );
      if (problem) {
        Alert.alert(`${tile.label} not available`, problem);
        return false;
      }
    }
    data.setDay(selectedKey, tile.id);
    return true;
  };

  const applyTile = (tile: Tile) => {
    if (assignTile(tile)) {
      pager.goTo(addDays(pager.selected, 1)); // auto-advance to the next day
    }
  };

  // Tapping a date selects it and opens its card
  const openDay = (d: Date) => {
    pager.goTo(d);
    setDayOpen(true);
  };

  // ----- deleting -----

  const deleteLeave = (leave: Leave, after?: () => void) =>
    confirmDeleteLeave(leave, data.usedByLeave[leave.id] || 0, () => {
      data.deleteLeave(leave.id);
      after?.();
    });

  const longPressTile = (tile: Tile) =>
    tile.leave
      ? deleteLeave(tile.leave)
      : confirmDeleteShift(tile, () => data.deleteShift(tile.id));

  // ----- popups -----

  const jumpToDate = (key: string) => {
    setVacOpen(false);
    pager.goTo(keyToDate(key));
  };

  const handleImport = (rows: ImportRow[]) => {
    const skipped = data.importRows(rows);
    if (rows.length > 0) {
      pager.goTo(keyToDate(rows[0].key));
    }
    if (skipped > 0) {
      setTimeout(
        () =>
          Alert.alert(
            'Some days were skipped',
            `${skipped} day${skipped === 1 ? '' : 's'} could not be added because a leave type was outside its period or already fully used.`,
          ),
        400,
      );
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <CalendarHeader
        viewMonth={pager.viewMonth}
        todayDate={pager.today.getDate()}
        summary={summary}
        onPrev={() => pager.changeMonth(-1)}
        onNext={() => pager.changeMonth(1)}
        onQuickEntry={() => setQuickOpen(true)}
        onVacations={() => setVacOpen(true)}
        onToday={() => pager.goTo(pager.today)}
      />

      <WeekdayRow />

      <MonthPager
        pager={pager}
        assignments={data.assignments}
        tileById={data.tileById}
        notes={data.notes}
        onOpenDay={openDay}
      />

      <TileBar
        tiles={data.tiles}
        isBlocked={isBlocked}
        onApply={applyTile}
        onLongPress={longPressTile}
        onAdd={() => setShiftModalOpen(true)}
      />

      <View>
        <Text style={styles.developedBy}>Developed By SeoNix</Text>
      </View>

      <DayModal
        visible={dayOpen}
        dateKey={selectedKey}
        tile={data.tileById[data.assignments[selectedKey]]}
        tiles={data.tiles}
        notes={data.notes[selectedKey] ?? []}
        isBlocked={isBlocked}
        onClose={() => setDayOpen(false)}
        onPickTile={assignTile}
        onRemoveTile={() => data.clearDay(selectedKey)}
        onAddNote={text => data.addNote(selectedKey, text)}
        onDeleteNote={id => data.deleteNote(selectedKey, id)}
      />

      <AddShiftModal
        visible={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        onAdd={(label, color, hours) => {
          data.addShift(label, color, hours);
          setShiftModalOpen(false);
        }}
        usedColors={data.usedColors}
      />

      <VacationModal
        visible={vacOpen}
        onClose={() => setVacOpen(false)}
        leaves={data.leaves}
        assignments={data.assignments}
        usedByLeave={data.usedByLeave}
        usedColors={data.usedColors}
        onAdd={data.addLeave}
        onDelete={deleteLeave}
        onJump={jumpToDate}
      />

      <QuickEntryModal
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
        tiles={data.tiles}
        viewMonthKey={pager.viewMonthKey}
        onImport={handleImport}
      />
    </SafeAreaView>
  );
}
