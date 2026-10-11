import { useState } from 'react'
import { SettingsGroup, SettingsScreen, type SettingsSection } from '../../../registry/blocks/settings-screen'
import { Button } from '../../../registry/ui/button'
import { Field, FieldGroup } from '../../../registry/ui/field'
import { Input } from '../../../registry/ui/input'
import { Segment, SegmentedControl } from '../../../registry/ui/segmented-control'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../../../registry/ui/select'
import { Switch } from '../../../registry/ui/switch'
import { you } from '../../../fixtures/world'
import { Row } from '../row'
import { WidthSwitch, Window, type WindowWidth } from './window'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'sv', label: 'Svenska' },
]

function useSections(): SettingsSection[] {
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')
  const [reopen, setReopen] = useState(true)
  const [name, setName] = useState(you.name)
  const [email, setEmail] = useState(you.email)
  const [digest, setDigest] = useState(true)
  const [mentions, setMentions] = useState(true)
  const changed = name !== you.name || email !== you.email

  return [
    {
      id: 'general',
      label: 'General',
      description: 'Theme, language, start screen',
      content: (
        <SettingsGroup title="Appearance">
          <FieldGroup label="Theme">
            <SegmentedControl aria-label="Theme" value={theme} onValueChange={setTheme}>
              <Segment value="system">System</Segment>
              <Segment value="light">Light</Segment>
              <Segment value="dark">Dark</Segment>
            </SegmentedControl>
          </FieldGroup>
          <Field label="Language">
            <Select value={language} onValueChange={(value) => setLanguage(value as string)} items={LANGUAGES}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {LANGUAGES.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Switch checked={reopen} onCheckedChange={setReopen}>
            Open where I left off
          </Switch>
        </SettingsGroup>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      description: 'Name, address, signature',
      content: (
        <SettingsGroup title="You" description="How the people you work with see you.">
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Email" help="Where a mention reaches you.">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
        </SettingsGroup>
      ),
      foot: changed ? (
        <>
          <span className="text-xs text-dim">Unsaved changes</span>
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              setName(you.name)
              setEmail(you.email)
            }}
          >
            Discard
          </Button>
          <Button size="sm" variant="primary">
            Save
          </Button>
        </>
      ) : undefined,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Mentions, the weekly digest',
      content: (
        <SettingsGroup title="Tell me" description="Nothing else is ever sent.">
          <Switch checked={mentions} onCheckedChange={setMentions}>
            When someone mentions me
          </Switch>
          <Switch checked={digest} onCheckedChange={setDigest}>
            A digest every Monday
          </Switch>
        </SettingsGroup>
      ),
    },
    {
      id: 'data',
      label: 'Data',
      description: 'Export, backup, reset',
      content: (
        <>
          <SettingsGroup title="Export" description="Everything, as one file you can read without this app.">
            <Button className="self-start">Export everything</Button>
          </SettingsGroup>
          <SettingsGroup title="Start over" description="Removes every work and version. There is no undo.">
            <Button variant="danger" className="self-start">
              Reset the workspace
            </Button>
          </SettingsGroup>
        </>
      ),
    },
  ]
}

export function SettingsScreenSection() {
  const sections = useSections()
  const [active, setActive] = useState<string | null>('general')
  const [width, setWidth] = useState<WindowWidth>('wide')

  return (
    <Row label="a section per address, named with what is in it - edit the profile for the bar at its foot; at a phone's width, the column first">
      <div className="flex w-full flex-col gap-3">
        <WidthSwitch value={width} onChange={setWidth} />
        <Window width={width}>
          <SettingsScreen
            title="Settings"
            sections={sections}
            active={active}
            onSelect={setActive}
            words={{ sections: 'Settings', back: 'All settings' }}
          />
        </Window>
      </div>
    </Row>
  )
}
