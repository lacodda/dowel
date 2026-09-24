import { Button } from '../../../registry/ui/button'
import { Input } from '../../../registry/ui/input'
import { Row } from '../row'
import { MoreIcon, PlusIcon, TrashIcon } from './icons'

export function ButtonSection() {
  return (
    <>
      <Row label="variants">
        <Button variant="primary">Save</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="soft">Selected</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="icon" size="icon-md" aria-label="More">
          <MoreIcon />
        </Button>
      </Row>

      <Row label="sizes - xs sits inside something, sm and md stand on the control rows">
        <Button variant="primary" size="xs">
          Extra small
        </Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="icon" size="icon-xs" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button variant="icon" size="icon-sm" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button variant="icon" size="icon-md" aria-label="Add">
          <PlusIcon />
        </Button>
      </Row>

      <Row label="an icon in a text button - a 24px lucide icon, sized by the button">
        <Button size="xs" data-probe="icon-xs-text">
          <PlusIcon />
          Add
        </Button>
        <Button size="sm" data-probe="icon-sm-text">
          <PlusIcon />
          New style
        </Button>
        <Button variant="primary" data-probe="icon-md-text">
          <PlusIcon />
          New style
        </Button>
        <Button variant="danger" data-probe="icon-danger-text">
          <TrashIcon />
          Delete
        </Button>
      </Row>

      <Row label="an icon's own size wins - size-2.5 on the icon, inside icon-md">
        <Button variant="icon" size="icon-md" aria-label="Add" data-probe="icon-own-size">
          <PlusIcon className="size-2.5" />
        </Button>
        <Button variant="icon" size="icon-md" aria-label="Add">
          <PlusIcon />
        </Button>
      </Row>

      <Row label="density - a field and a button of the same size, in three regions">
        {(['compact', undefined, 'comfortable'] as const).map((density) => (
          <div
            key={density ?? 'default'}
            data-density={density}
            data-probe={`density-${density ?? 'default'}`}
            className="flex items-center gap-2"
          >
            <Input aria-label={`Title, ${density ?? 'default'}`} placeholder={density ?? 'default'} className="w-32" />
            <Button variant="primary">Save</Button>
            <Button size="sm">Small</Button>
          </div>
        ))}
      </Row>

      <Row label="states">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
        <Button render={<a href="#button" />} variant="primary">
          As a link
        </Button>
      </Row>
    </>
  )
}
