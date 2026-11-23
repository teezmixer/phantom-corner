import { useState, type FormEvent } from "react";
import { settings } from "@/content/copy";
import { buttonClass } from "@/screens/Overlay";
import { useAccount } from "./AccountProvider";

const field = "min-w-0 flex-1 border border-white bg-black px-2 py-1 focus-visible:outline-2 focus-visible:outline-accentteal";

/** Sign in with an emailed code, sync, sign out, export and delete (spec §4.9). Shown in Settings only when accounts are on. */
export function AccountPanel() {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [armed, setArmed] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const t = settings.accountPanel;
  if (!account) return null;

  const send = (e: FormEvent) => { e.preventDefault(); void account.requestCode(email); };
  const verify = (e: FormEvent) => { e.preventDefault(); void account.verify(email, code).then(() => setCode("")); };
  const download = async () => {
    const url = URL.createObjectURL(new Blob([await account.exportAccount()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "phantom-corner-account.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const remove = () => {
    if (!armed) { setArmed(true); return; }
    setArmed(false);
    void account.deleteAccount().then(() => setDeleted(true));
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      {account.fake && <p className="text-xs text-greylight">{t.fakeNote}</p>}
      {!account.who && !account.codeSent && (
        <form onSubmit={send} noValidate className="flex gap-1">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label={t.email} placeholder={t.email} autoComplete="email" className={field} />
          <button type="submit" disabled={account.busy} className={buttonClass}>{t.sendCode}</button>
        </form>
      )}
      {!account.who && account.codeSent && (
        <form onSubmit={verify} className="flex gap-1">
          <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} aria-label={t.code} placeholder={t.code} autoComplete="one-time-code" maxLength={6} className={field} />
          <button type="submit" disabled={account.busy} className={buttonClass}>{t.signIn}</button>
        </form>
      )}
      {account.who && (
        <>
          <p>{t.signedInAs} {account.who.email}</p>
          <p role="status" className="text-xs text-greylight">{account.sync === "down" ? t.syncDown : account.sync === "syncing" ? "…" : t.synced}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void account.syncNow()} disabled={account.busy} className={buttonClass}>{t.syncNow}</button>
            <button type="button" onClick={() => void account.signOut()} disabled={account.busy} className={buttonClass}>{t.signOut}</button>
            <button type="button" onClick={() => void download()} className={buttonClass}>{t.export}</button>
            <button type="button" onClick={remove} onBlur={() => setArmed(false)} className={`${buttonClass} ${armed ? "bg-redbright" : ""}`}>{armed ? t.deleteConfirm : t.delete}</button>
          </div>
          <p className="text-xs text-greylight">{t.signOutNote} {t.deleteNote}</p>
        </>
      )}
      {account.error && <p role="alert" className="border-l-4 border-redbright pl-2">{account.error}</p>}
      {deleted && !account.who && <p role="status">{t.deleted}</p>}
    </div>
  );
}
