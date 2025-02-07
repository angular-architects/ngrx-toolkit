import { isDevMode as ngIsInDevMode } from '@angular/core';

// necessary wrapper function to test prod mode
export function isDevMode() {
  return ngIsInDevMode();
}
