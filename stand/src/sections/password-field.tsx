import { useState } from 'react'
import { Row } from '../row'
import { Field } from '../../../registry/ui/field'
import { PasswordField } from '../../../registry/ui/password-field'

export function PasswordFieldSection() {
  const [password, setPassword] = useState('correct horse battery staple')

  return (
    <>
      <Row label="always starts masked - revealing is the reader's own action">
        <div className="w-72">
          <PasswordField
            value={password}
            onValueChange={setPassword}
            showLabel="Show password"
            hideLabel="Hide password"
            autoComplete="current-password"
            aria-label="Password"
          />
        </div>
      </Row>

      <Row label="inside a Field, with an error">
        <Field
          label="New password"
          error="Too short - use at least twelve characters."
          className="w-72"
        >
          <PasswordField
            defaultValue="short"
            showLabel="Show password"
            hideLabel="Hide password"
            autoComplete="new-password"
          />
        </Field>
      </Row>

      <Row label="disabled">
        <div className="w-72">
          <PasswordField
            defaultValue="hunter2"
            disabled
            showLabel="Show password"
            hideLabel="Hide password"
            aria-label="Disabled"
          />
        </div>
      </Row>
    </>
  )
}
