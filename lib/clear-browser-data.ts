import { clearFavoriteIds } from "./favorites";
import { clearSubmissionIds } from "./submissions";

export function clearBrowserDataAfterSync(): void {
  clearSubmissionIds();
  clearFavoriteIds();
}
