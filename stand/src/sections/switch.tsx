import { Row } from '../row'
import { Switch } from '../../../registry/ui/switch'

export function SwitchSection() {
  return (
    <>
      <Row label="states">
        <Switch>Off</Switch>
        <Switch defaultChecked>On</Switch>
        <Switch disabled>Disabled</Switch>
        <Switch defaultChecked disabled>
          Both
        </Switch>
      </Row>

      <Row label="a column of settings, which is what it is for">
        <div className="flex w-64 flex-col gap-3">
          <Switch defaultChecked>Notify me about replies</Switch>
          <Switch>Notify me about everything</Switch>
          <Switch defaultChecked>Keep me signed in</Switch>
        </div>
      </Row>

      <Row label="without words">
        <Switch aria-label="Notify me" />
        <Switch aria-label="Notify me" defaultChecked />
      </Row>
    </>
  )
}
