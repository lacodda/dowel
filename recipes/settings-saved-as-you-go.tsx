/*
 * Recipe: settings that save as you go.
 *
 * A settings section with no Save button. Each field keeps itself when it is
 * committed - a text field on blur or Enter, a switch or a choice at once -
 * and says what happened next to it: saving, saved, or not saved. The hard
 * part is not the saving, it is the three promises around it: nothing is sent
 * while someone is still typing, a failure never throws away what they wrote,
 * and the outcome is told to a reader who cannot see the corner of the screen.
 *
 * Each field owns its own save, so a slow or failed one does not hold up the
 * others. `useFieldDraft` supplies the commit moments (blur, Enter; Escape
 * takes the text back); `useSaveStatus` and `SaveState` supply the quiet line,
 * a live region that is always mounted so a screen reader hears it change.
 * A failure is a separate message with its own way out, because `SaveState`
 * deliberately never says "saved" for a save that was not.
 *
 * This is not the settings screen block: that one lays out sections, a column
 * and a way back, and leaves the fields to the product. This is what goes
 * inside one of its sections when there is no Save bar to put at the foot.
 *
 * Wire `save` to the product's own mutation - `(key, value) => api.patch(...)`
 * - and let it reject on failure. Every word a reader sees is here, in one
 * place, for the product's language to replace.
 */
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { useFieldDraft } from '@/components/ui/field-draft'
import { Input } from '@/components/ui/input'
import { SaveState, useSaveStatus } from '@/components/ui/save-state'
import { Segment, SegmentedControl } from '@/components/ui/segmented-control'
import { Switch } from '@/components/ui/switch'

export type SettingValue = string | boolean

export interface Settings {
  name: string
  email: string
  digest: boolean
  density: 'comfortable' | 'compact'
}

export type SettingKey = keyof Settings

/**
 * One setting's life: the value that is stored, and the attempt to change it.
 * The attempt is in flight, or has failed and is waiting to be tried again.
 */
function useSetting<T extends SettingValue>(
  key: SettingKey,
  initial: T,
  save: (key: SettingKey, value: T) => Promise<void>,
) {
  const [stored, setStored] = useState(initial)
  const [attempt, setAttempt] = useState<{ value: T; failed: boolean } | null>(null)
  // Only the newest attempt may settle the state: a slow answer to an old one
  // must not land over a newer one.
  const latest = useRef(0)

  const commit = (value: T) => {
    if (value === stored) {
      // Nothing to send - and a failure left over from a value that was put
      // back by hand is no longer a failure.
      latest.current += 1
      setAttempt(null)
      return
    }
    const mine = ++latest.current
    setAttempt({ value, failed: false })
    save(key, value).then(
      () => {
        if (mine !== latest.current) return
        setStored(value)
        setAttempt(null)
      },
      () => {
        if (mine === latest.current) setAttempt({ value, failed: true })
      },
    )
  }

  const failed = attempt?.failed ?? false
  const status = useSaveStatus(attempt !== null && !failed, failed)
  // The attempt is shown while it is in flight or has failed: the reader's
  // choice stays on screen until it is stored or put back.
  return { value: attempt?.value ?? stored, stored, failed, status, commit }
}

/** The quiet line beside a field. */
function Outcome({ status }: { status: ReturnType<typeof useSaveStatus> }) {
  return <SaveState status={status} savingLabel="Saving" savedLabel="Saved" />
}

/** The failure, announced as an alert, with its way out. */
function NotSaved({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <span role="alert" className="flex items-center gap-2">
      Not saved. What you entered is still here.
      {/* Named by the setting: several of these can be on screen at once. */}
      <Button variant="link" size="xs" onClick={onRetry} aria-label={`Try saving ${what} again`}>
        Try again
      </Button>
    </span>
  )
}

function TextSetting({
  label,
  help,
  settingKey,
  initial,
  save,
  type,
}: {
  label: string
  help?: string
  settingKey: SettingKey
  initial: string
  save: (key: SettingKey, value: string) => Promise<void>
  type?: 'email'
}) {
  const setting = useSetting(settingKey, initial, save)
  // The draft belongs to the box; the setting only hears when it is committed.
  // A failed save leaves the stored value alone, so the box keeps what was typed.
  const draft = useFieldDraft(setting.stored, setting.commit)
  return (
    <div className="flex items-start gap-3">
      <Field
        label={label}
        help={help}
        error={setting.failed ? <NotSaved what={label} onRetry={() => setting.commit(draft.value)} /> : undefined}
        className="flex-1"
      >
        <Input type={type} {...draft} />
      </Field>
      <Outcome status={setting.status} />
    </div>
  )
}

function SwitchSetting({
  label,
  settingKey,
  initial,
  save,
}: {
  label: string
  settingKey: SettingKey
  initial: boolean
  save: (key: SettingKey, value: boolean) => Promise<void>
}) {
  const setting = useSetting(settingKey, initial, save)
  return (
    <div className="flex items-start gap-3">
      <Field
        beside
        label={label}
        error={setting.failed ? <NotSaved what={label} onRetry={() => setting.commit(setting.value)} /> : undefined}
        className="flex-1"
      >
        {/* Saved at once: there is no half-typed state of a switch. */}
        <Switch checked={setting.value} onCheckedChange={setting.commit} />
      </Field>
      <Outcome status={setting.status} />
    </div>
  )
}

function DensitySetting({
  initial,
  save,
}: {
  initial: Settings['density']
  save: (key: SettingKey, value: string) => Promise<void>
}) {
  const setting = useSetting<string>('density', initial, save)
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-1 flex-col gap-1.5">
        <span id="density-label" className="caption">
          Density
        </span>
        <SegmentedControl aria-labelledby="density-label" value={setting.value} onValueChange={setting.commit}>
          <Segment value="comfortable">Comfortable</Segment>
          <Segment value="compact">Compact</Segment>
        </SegmentedControl>
        {setting.failed && (
          <p className="text-xs text-bad">
            <NotSaved what="Density" onRetry={() => setting.commit(setting.value)} />
          </p>
        )}
      </div>
      <Outcome status={setting.status} />
    </div>
  )
}

export function SettingsSavedAsYouGo({
  initial,
  save,
}: {
  /** The settings as the server has them. */
  initial: Settings
  /** Writes one setting. Reject to say it did not stick. */
  save: (key: SettingKey, value: SettingValue) => Promise<void>
}) {
  return (
    <section aria-labelledby="profile-settings-heading" className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="profile-settings-heading" className="text-lg font-semibold text-text">
          Profile
        </h2>
        <p className="text-sm text-dim">Changes are kept as you make them. There is nothing to save.</p>
      </div>
      <TextSetting label="Display name" settingKey="name" initial={initial.name} save={save} />
      <TextSetting
        label="Email"
        help="Receipts and sign-in links go here."
        settingKey="email"
        type="email"
        initial={initial.email}
        save={save}
      />
      <SwitchSetting label="Email me a weekly digest" settingKey="digest" initial={initial.digest} save={save} />
      <DensitySetting initial={initial.density} save={save} />
    </section>
  )
}
