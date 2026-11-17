// account-delete: the signed-in person deletes their own account (Settings).
// Refused while money is involved (see account_deletion_blockers()): open
// escrow, an unwithdrawn balance, or a refund/withdrawal in progress.
// Their uploads (avatar, portfolio) are removed; finished projects stay on
// record without them, so the other side keeps its history.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { handlePost, HttpError, json } from '../_shared/http.ts';
import { adminClient, requireUser, userClient } from '../_shared/supabase.ts';

async function removeFolder(bucket: string, folder: string) {
  const storage = adminClient().storage.from(bucket);
  // 100 files per round; 50 rounds is far more than one person uploads.
  for (let round = 0; round < 50; round++) {
    const { data, error } = await storage.list(folder, { limit: 100 });
    if (error) throw error;
    if (!data?.length) return;
    const { error: removeError } = await storage.remove(data.map((f) => `${folder}/${f.name}`));
    if (removeError) throw removeError;
  }
}

Deno.serve(handlePost(async (req) => {
  const user = await requireUser(req);

  // Asked as the person themself, so it checks their own projects and money.
  const { data: blockers, error } = await userClient(req).rpc('account_deletion_blockers');
  if (error) throw error;
  if (Array.isArray(blockers) && blockers.length > 0) {
    throw new HttpError(409, blockers.join(' '));
  }

  await removeFolder('avatars', user.id);
  await removeFolder('portfolio', user.id);

  const { error: deleteError } = await adminClient().auth.admin.deleteUser(user.id);
  if (deleteError) throw deleteError;
  return json({ deleted: true });
}));
