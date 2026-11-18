import * as Updates from 'expo-updates';
import { useEffect } from 'react';

// Over-the-air updates: when the app opens, fetch any newer version of the
// app's code that was published with `eas update` and restart into it, so
// testers get fixes without a new TestFlight build. Does nothing in
// development or on the web.
export function useOtaUpdate() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // No connection or no update server: carry on with the current version.
      }
    })();
  }, []);
}
