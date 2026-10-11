import { useState } from 'react'
import { useThemeSwitch, type Theme } from 'dowel-ui'
import { SettingsGroup, SettingsScreen } from '@/components/blocks/settings-screen'
import { Button } from '@/components/ui/button'
import {
  ConfirmDialog,
  ConfirmDialogActions,
  ConfirmDialogClose,
  ConfirmDialogDescription,
  ConfirmDialogHeader,
  ConfirmDialogPopup,
  ConfirmDialogTitle,
  ConfirmDialogTrigger,
} from '@/components/ui/confirm-dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Segment, SegmentedControl } from '@/components/ui/segmented-control'
import { go, href } from '../router'
import type { DemoState } from '../state'

/**
 * Settings: a section per address. The theme is the real one - the switch
 * the whole demo answers to - and resetting the workspace takes the demo back
 * to its first day.
 */
export function Settings({ state, open }: { state: DemoState; open: string | null }) {
  const { theme, setTheme } = useThemeSwitch('dowel.demo.theme')
  const [draft, setDraft] = useState(state.profile)
  const changed = draft.name !== state.profile.name || draft.email !== state.profile.email

  return (
    <SettingsScreen
      title="Settings"
      active={open}
      onSelect={(id) => go(id === null ? 'settings' : `settings/${id}`)}
      sectionRender={(section) => <a href={href(`settings/${section.id}`)} />}
      words={{ sections: 'Settings', back: 'All settings' }}
      sections={[
        {
          id: 'general',
          label: 'General',
          description: 'Theme',
          content: (
            <SettingsGroup title="Appearance" description="Follows your system until you choose.">
              <FieldGroup label="Theme">
                <SegmentedControl aria-label="Theme" value={theme} onValueChange={(next) => setTheme(next as Theme)}>
                  <Segment value="system">System</Segment>
                  <Segment value="light">Light</Segment>
                  <Segment value="dark">Dark</Segment>
                </SegmentedControl>
              </FieldGroup>
            </SettingsGroup>
          ),
        },
        {
          id: 'profile',
          label: 'Profile',
          description: 'Name and address',
          content: (
            <SettingsGroup title="You" description="How the people you work with see you.">
              <Field label="Name">
                <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                />
              </Field>
            </SettingsGroup>
          ),
          foot: changed ? (
            <>
              <span className="text-xs text-dim">Unsaved changes</span>
              <Button size="sm" className="ml-auto" onClick={() => setDraft(state.profile)}>
                Discard
              </Button>
              <Button size="sm" variant="primary" onClick={() => state.setProfile(draft)}>
                Save
              </Button>
            </>
          ) : undefined,
        },
        {
          id: 'data',
          label: 'Data',
          description: 'Start over',
          content: (
            <SettingsGroup title="Start over" description="Takes every work away and opens the first day again.">
              <ConfirmDialog>
                <ConfirmDialogTrigger render={<Button variant="danger" className="self-start" />}>
                  Reset the workspace
                </ConfirmDialogTrigger>
                <ConfirmDialogPopup>
                  <ConfirmDialogHeader>
                    <ConfirmDialogTitle>Reset the workspace?</ConfirmDialogTitle>
                    <ConfirmDialogDescription>
                      Every work goes. In a real product this would not come back; here the samples will.
                    </ConfirmDialogDescription>
                  </ConfirmDialogHeader>
                  <ConfirmDialogActions>
                    <Button render={<ConfirmDialogClose />}>Keep everything</Button>
                    <Button
                      variant="danger"
                      render={<ConfirmDialogClose />}
                      onClick={() => {
                        state.reset()
                        go('')
                      }}
                    >
                      Reset
                    </Button>
                  </ConfirmDialogActions>
                </ConfirmDialogPopup>
              </ConfirmDialog>
            </SettingsGroup>
          ),
        },
      ]}
    />
  )
}
