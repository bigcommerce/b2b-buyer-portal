import b2bLogger from './utils/b3Logger';
import { initHeadlessScripts } from './utils/headlessInitializer';

initHeadlessScripts().catch((error: TypeError) => {
  b2bLogger.error(`unexpected error during headless buyer portal initialization`, error);
});
