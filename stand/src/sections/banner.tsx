import { Row } from '../row'
import { Banner } from '../../../registry/ui/banner'
import { Button } from '../../../registry/ui/button'

export function BannerSection() {
  return (
    <>
      <Row label="across the top, about the whole application">
        <div className="w-full overflow-hidden rounded-md border border-line">
          <Banner>You are offline. Changes are kept and will sync when you are back.</Banner>
        </div>
      </Row>

      <Row label="tones, and something to do about it">
        <div className="flex w-full flex-col gap-2">
          <div className="overflow-hidden rounded-md border border-line">
            <Banner
              tone="accent"
              action={
                /* Not `soft`: a tinted button on a tinted banner stacks two
                 * tints, and the accent's word on both together is a pair
                 * nobody promised - 3.6:1 in the dark theme. */
                <Button size="sm" variant="primary">
                  Install
                </Button>
              }
            >
              Version 0.42 is ready to install.
            </Banner>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <Banner tone="warn">This is a preview build. Do not keep anything in it.</Banner>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <Banner tone="bad">The backup has not run for nine days.</Banner>
          </div>
        </div>
      </Row>
    </>
  )
}
