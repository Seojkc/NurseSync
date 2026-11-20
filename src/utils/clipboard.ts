// Clipboard (install: npm i @react-native-clipboard/clipboard, then rebuild).
// Guarded so the app still runs if the package isn't installed yet.
let Clipboard: {
  getString: () => Promise<string>;
  setString: (s: string) => void;
} | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (e) {
  Clipboard = null;
}

export const clipboardAvailable = () => Clipboard !== null;

export const readClipboard = async (): Promise<string> =>
  Clipboard ? Clipboard.getString() : '';

export const writeClipboard = (text: string): boolean => {
  if (!Clipboard) {
    return false;
  }
  Clipboard.setString(text);
  return true;
};
