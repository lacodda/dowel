import { useState } from 'react'
import { Row } from '../row'
import { NumberFormat } from '../../../registry/ui/number-format'
import { KeyValue, KeyValueRow } from '../../../registry/ui/key-value'
import { EmptyState } from '../../../registry/ui/empty-state'
import { QueryState } from '../../../registry/ui/query-state'
import { Button } from '../../../registry/ui/button'
import { Panel } from '../../../registry/ui/panel'

export function QueryStateSection() {
  const [state, setState] = useState<'pending' | 'error' | 'empty' | 'ready'>('pending')
  const [retryState, setRetryState] = useState<'error' | 'pending' | 'ready'>('error')

  const retry = () => {
    setRetryState('pending')
    setTimeout(() => setRetryState('ready'), 800)
  }

  return (
    <>
      <Row label="the same ladder every list writes - press through it">
        <div className="flex gap-2">
          {(['pending', 'error', 'empty', 'ready'] as const).map((next) => (
            <Button
              key={next}
              variant={state === next ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setState(next)}
            >
              {next}
            </Button>
          ))}
        </div>
      </Row>

      <Row label="pending, then failed, then nothing found, then the content">
        <div className="w-96 rounded-md border border-line p-2">
          <QueryState
            pending={state === 'pending'}
            error={state === 'error' ? { message: 'The server did not answer.' } : null}
            empty={state === 'empty'}
            errorLabels={{ title: 'Could not load' }}
            emptyState={<EmptyState title="No works yet" body="Everything you start shows here." />}
          >
            <KeyValue>
              <KeyValueRow label="Title">Harbour lights</KeyValueRow>
              <KeyValueRow label="Owner">Ines</KeyValueRow>
              <KeyValueRow label="Words">
                <NumberFormat value={4120} />
              </KeyValueRow>
            </KeyValue>
          </QueryState>
        </div>
      </Row>

      <Row label="a retry that retries - press it, and the ladder runs again on its own">
        <div className="w-96 rounded-md border border-line p-2">
          <QueryState
            pending={retryState === 'pending'}
            error={retryState === 'error' ? { message: 'The server did not answer.' } : null}
            errorLabels={{ title: 'Could not load' }}
            onRetry={retry}
            retryLabel="Try again"
          >
            <KeyValue>
              <KeyValueRow label="Title">Harbour lights</KeyValueRow>
              <KeyValueRow label="Owner">Ines</KeyValueRow>
            </KeyValue>
          </QueryState>
        </div>
      </Row>

      <Row label="plain, inside a panel that already has a frame">
        <Panel className="w-96 p-3">
          <QueryState
            plain
            error={{ message: 'The server did not answer.' }}
            errorLabels={{ title: 'Could not load' }}
            onRetry={() => undefined}
            retryLabel="Try again"
          >
            <KeyValue>
              <KeyValueRow label="Title">Harbour lights</KeyValueRow>
            </KeyValue>
          </QueryState>
        </Panel>
      </Row>
    </>
  )
}
