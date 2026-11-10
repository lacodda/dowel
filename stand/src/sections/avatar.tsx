import { Row } from '../row'
import { Avatar, AvatarGroup } from '../../../registry/ui/avatar'

const standPeople = [
  { name: 'Ines Almeida' },
  { name: 'Ravi Chandrasekaran' },
  { name: 'Kit Brennan' },
  { name: 'Tomas Vrba' },
  { name: 'Anne-Marie Dubois' },
]

export function AvatarSection() {
  return (
    <>
      <Row label="sizes - a picture, and the initials when there is none">
        <Avatar name="Ines Almeida" size="xs" />
        <Avatar name="Ines Almeida" size="sm" />
        <Avatar name="Ines Almeida" size="md" />
        <Avatar name="Ines Almeida" size="lg" />
        <Avatar name="Ines Almeida" size="xl" />
      </Row>

      <Row label="a name is not a colour - every tile stands on the same neutral ground">
        {standPeople.map((person) => (
          <Avatar key={person.name} name={person.name} size="lg" />
        ))}
      </Row>

      <Row label="square, for a thing that is not a person">
        <Avatar name="dowel" shape="square" size="lg" />
        <Avatar name="kilna" shape="square" size="lg" />
        <Avatar name="rigger" shape="square" size="lg" />
      </Row>

      <Row label="a picture that fails to load falls back rather than showing a broken glyph">
        <Avatar name="Ines Almeida" size="lg" src="https://example.invalid/missing.png" />
      </Row>

      <Row label="a group, and the count of the ones it did not draw">
        <AvatarGroup people={standPeople} max={3} label="Assignees" size="md" />
        <AvatarGroup people={standPeople.slice(0, 2)} max={3} label="Reviewers" size="md" />
      </Row>
    </>
  )
}
