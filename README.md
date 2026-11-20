<div align="center">

# 🌸 Shift Calendar

**A cute, fast shift-work calendar for Android — with a home-screen widget, day notes, vacation tracking, and AI-powered roster import.**

![Platform](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-TypeScript-61DAFB?logo=react&logoColor=white)
![Storage](https://img.shields.io/badge/storage-offline%20%7C%20on--device-FF6FA5)
![Status](https://img.shields.io/badge/status-active-D93F7F)

*Developed by SeoNix*

<div style="display:flex">
  <img width="200" alt="Screenshot_20261120_124816_NurseSync" src="https://github.com/user-attachments/assets/df0148ee-7bd7-4f4d-b4ae-bfaedb07533f" />
<img width="200" alt="Screenshot_20261120_124835_NurseSync" src="https://github.com/user-attachments/assets/5958340d-3063-405c-bb3b-3bdb311e782d" />
<img width="200"  alt="Screenshot_20261120_124826_NurseSync" src="https://github.com/user-attachments/assets/3e7da454-5f4b-4a97-bcf2-a317bba73496" />
<img width="200"  alt="Screenshot_20261120_124848_NurseSync" src="https://github.com/user-attachments/assets/09842f24-64cc-4312-b3cb-cdaf88e4ec03" />

  <img width="200" alt="Screenshot_20261120_124915_NurseSync" src="https://github.com/user-attachments/assets/c3fa0c5d-3257-4f87-91b0-1fa446520fc0" />
<img width="200"  alt="Screenshot_20261120_124912_NurseSync" src="https://github.com/user-attachments/assets/f86302ea-3f3b-44cb-9576-a95b0428bc83" />
<img width="200"  alt="Screenshot_20261120_124801_One UI Home" src="https://github.com/user-attachments/assets/b1c16e4a-f175-49c3-b967-c0958a4d1ad4" />

</div>

</div>

---
Current Version

https://github.com/Seojkc/NurseSync/releases/download/release/NurseSync.apk 

---

## 📖 About

Shift Calendar is built for people who work rotating shifts — nurses, factory staff, hospitality, security, retail and more. Instead of squinting at a paper roster, you get a clean pastel calendar where every day shows a **big, colour-coded shift tile** (AM, PM, Night, Off, leave…), the **hours you'll work this month**, and a **home-screen widget** so your schedule is always one glance away.

Everything is stored **on your device**. No account, no sign-up, no internet required.

---

## ✨ Features

### 📅 Calendar
- Month view with **6-week grid** (Sunday-first), swipe left/right or use the ‹ › arrows to change month
- **Today** button shows the current date and jumps straight back to it
- Today's date and the selected date are highlighted
- Days from neighbouring months are dimmed so the current month stays clear
- **Monthly summary** under the title, e.g. `166 hours, 2 CL` — total working hours plus the number of each leave type taken

### 🎨 Shift tiles
- Four ready-made presets: **AM**, **PM**, **Night**, **Off**
- Create **unlimited custom shifts** with the **+** button: name (up to 8 characters), **hours (0–24)** and one of **16 candy colours**
- The bottom bar is a scrollable row of chunky 3D tiles — tap one to stamp it on the selected day; the calendar then **auto-advances to the next day** for fast entry
- **Long-press** a tile to delete it (days using it are cleared, with a confirmation)
- **Smart text contrast** — white labels on strong colours, dark labels on light pastels (peach, mint, butter…) so the shift is always readable

### 🗓️ Day card
Tap any date to open a card for that day:
- **See** the shift on that day as a large tile (with its hours)
- **Remove** it with one tap (**✕ Remove**)
- **Add or change** the shift from a row of all your shifts and leave types (the current one is marked ✓)
- **Notes** (see below)

### 📃 Notes
- Add as many **notes per date** as you like (up to 300 characters each)
- **View, add and delete** notes straight from the day card
- Deleting asks for confirmation so nothing is lost by accident
- Days that have notes show a small **📃** in the corner of the date — in both the app and the widget — without covering the shift tile

### 🌴 Vacations & leave
- Create leave types such as **Casual Leave → CL**, with a short code, colour, **allowed number of days** and a **validity period** (start → end date)
- Leave tiles appear in the bottom bar next to your shifts
- **Built-in guard rails** — a leave can't be used outside its period, and can't be used once all its days are taken
- Track how many days of each leave have been used
- Jump to any leave day from the vacation list

### ⚡ Quick entry (AI roster import)
Skip typing out a whole month:
1. Enter your name as it appears on the roster
2. **Copy the prompt** and give it, with a photo of your roster, to **ChatGPT, Gemini or Claude**
3. **Paste the JSON reply** into the app
4. Map each roster code to one of your tiles (**choices are remembered** for next time)
5. **Preview and fix** any day, then import the whole month in one go

The parser is forgiving — it accepts replies wrapped in code fences or with extra words around the JSON, and unclear days can be set manually.

### 📱 Home-screen widget
A full month calendar on your Android home screen:
- Same pastel look and **colour-coded shift tiles** as the app
- **‹ ›** arrows to browse months — each widget remembers its own month
- Tap the **month name** to jump back to today
- Tap anywhere else to **open the app**
- Shows the **monthly summary** (hours + leave counts) and the **📃 note marker**
- Semi-transparent pink background (adjustable) that blends with your wallpaper
- Resizes to fit; text and tiles scale with the widget size
- Updates **instantly** whenever you change anything in the app

### 🔒 Privacy
- 100 % **offline and on-device** (AsyncStorage)
- No accounts, analytics or ads

---

## 🧭 How to use

| I want to…                      | Do this                                                   |
| ------------------------------- | --------------------------------------------------------- |
| Mark a shift quickly            | Select a day → tap a tile in the bottom bar               |
| Edit or remove one day          | Tap the date → use the day card                           |
| Add a note to a date            | Tap the date → type in **Notes** → **Add**                |
| Create a new shift              | Tap **+** in the bottom bar                               |
| Delete a shift type             | Long-press its tile                                       |
| Track vacation days             | Tap **🌴** → add a leave type                             |
| Import a whole roster           | Tap **⚡** → follow the 5 steps                           |
| Get back to today               | Tap the date button in the top-right                      |
| Put the calendar on my home screen | Long-press home screen → Widgets → **Shift Calendar**  |

---

## 🛠️ Tech stack

| Area           | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Framework      | [React Native](https://reactnative.dev/) + TypeScript                      |
| Storage        | [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage) |
| Widget         | [`react-native-android-widget`](https://github.com/sAleksovski/react-native-android-widget) |
| Layout         | [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context) |
| Clipboard      | `@react-native-clipboard/clipboard` (optional — used by Quick entry)       |

---

## 📁 Project structure

```
.
├── App.tsx                          # App entry
├── widget/
│   ├── ShiftCalendarWidget.tsx      # Widget UI + data loading + refresh
│   └── widget-task-handler.tsx      # Widget events (month arrows, today, resize…)
└── src/
    ├── screens/
    │   └── CalendarScreen.tsx       # Wires data, pager and popups together
    ├── components/                  # CalendarHeader, MonthGrid, MonthPager, TileBar, Tile3D, …
    ├── modals/
    │   ├── day/                     # Day card (shift + notes)
    │   ├── vacation/                # Leave types
    │   ├── quickEntry/              # AI roster import
    │   └── AddShiftModal.tsx
    ├── hooks/
    │   ├── useCalendarData.ts       # Shifts, leaves, assignments, notes + persistence
    │   ├── useMonthPager.ts         # Month paging + selected day
    │   └── useQuickEntry.ts         # Import flow state
    ├── utils/                       # date, color, leave rules, summary, import parser…
    ├── constants.ts                 # Colours, presets, storage keys
    ├── theme.ts                     # Palette & fonts
    └── types.ts
```

---

## 💾 Data model

Everything lives in one JSON blob under the key `@shift_calendar_v1`:

```jsonc
{
  "shifts":      [{ "id": "…", "label": "AM", "color": "#FFACAE", "hours": 8 }],
  "leaves":      [{ "id": "…", "title": "Casual Leave", "code": "CL", "color": "#4FD1A5",
                    "start": "2026-01-01", "end": "2026-12-31", "total": 12 }],
  "assignments": { "2026-11-20": "<tile id>" },       // one shift or leave per day
  "notes":       { "2026-11-20": [{ "id": "…", "text": "Swap with Sam" }] }
}
```

Older saves without `notes` load normally. The widget reads the same key, so the app and widget are always in sync.

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- Android Studio + a device or emulator (see the [React Native environment setup](https://reactnative.dev/docs/environment-setup))

### Install & run

```bash
# 1. Install dependencies
npm install
npm i @react-native-clipboard/clipboard   # optional, enables copy/paste in Quick entry

# 2. Start Metro
npm start

# 3. Build & launch on Android
npm run android
```

### Widget setup

Register the widget and its task handler as described in the [`react-native-android-widget` docs](https://saleksovski.github.io/react-native-android-widget/):

1. Add the widget provider (`ShiftCalendarProvider`) to the Android manifest / `app.json` plugin config
2. Register the task handler in `index.js`:

```js
import {registerWidgetTaskHandler} from 'react-native-android-widget';
import {widgetTaskHandler} from './widget/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
```

3. Rebuild the app, then long-press your home screen → **Widgets** → **Shift Calendar**

> **Tip:** the widget background opacity is the last two hex digits of `C.bg` in `widget/ShiftCalendarWidget.tsx` (`BF` = 75 %, `80` = 50 %, `E6` = 90 %).

---

## 🎨 Customising

- **Colours / presets** — `src/constants.ts` (`COLORS`, `PRESETS`)
- **Theme** — `src/theme.ts`
- **Widget look** — the `C` palette at the top of `widget/ShiftCalendarWidget.tsx`

---

## 🗺️ Roadmap ideas

- [ ] Multiple shifts per day
- [ ] Shift reminders / notifications
- [ ] Backup & restore, export to CSV / calendar
- [ ] Yearly overview and overtime stats
- [ ] Dark mode

---

## 🤝 Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

<div align="center">

Made with 💗 · **Developed by SeoNix**

</div>
