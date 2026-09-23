# AboutPlate

Source: https://lacodda.github.io/dowel/components/about-plate

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#about-plate

Two products' plates side by side, one with a licence and links added.

## Notes

Every desktop product has an About box, and every one was written from
scratch: the mark at whatever size came to hand, the version inside a
sentence, a line about the family somewhere or nowhere. Side by side they
looked like products of different makers — the one thing a line is supposed
not to look like.

```tsx
<Dialog>
  <AboutPlate
    product="nitid"
    name="nitid"
    version={`v${version}`}
    tagline={t('tagline')}
    lineLabel={t('partOfTheLine')}
    lineHref="https://github.com/lacodda"
  >
    <span>{t('licence')}</span>
  </AboutPlate>
</Dialog>
```

**The mark is drawn at its largest level**, the one with the metaphor: the
About screen is where a person has the time to see it. The version is in the
monospace face a version is read in, never inside a sentence.

**The line is named under a rule**, with the λ tile and the words the product
gives it. The plate has no English of its own.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `product` | `MarkName` | | Whose mark |
| `name` | `string` | | The product's name, as a heading |
| `version` | `string` | | As the product shows it |
| `tagline` | `string` | | The one-line promise |
| `children` | `ReactNode` | | Licence, links, a build hash |
| `lineLabel` | `string` | | The words beside λ |
| `lineHref` | `string` | | Makes those words a link |
| `className` | `string` | | Merged so the caller wins a conflict |
