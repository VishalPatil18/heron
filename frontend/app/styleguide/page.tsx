import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Dev reference (no nav/footer): the DESIGN.md primitives + type scale on one page.
export default function StyleGuide() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 space-y-16">
      <section className="space-y-4">
        <Badge variant="new">DESIGN SYSTEM</Badge>
        <h1 className="text-hero-display">Nothing swims past.</h1>
        <p className="text-subtitle text-steel max-w-xl">
          Heron design-system primitives, wired straight from the DESIGN.md tokens.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-heading-md">Type scale</h2>
        <p className="text-display-lg">Display 56</p>
        <p className="text-heading-lg">Heading 40</p>
        <p className="text-heading-md">Heading 32</p>
        <p className="text-heading-sm">Heading 24</p>
        <p className="text-card-title">Card title 20</p>
        <p className="text-subtitle text-steel">Subtitle 18</p>
        <p className="text-body-md">Body 16 — the quick brown fox jumps over the lazy dog.</p>
        <p className="text-body-sm text-steel">Body small 14</p>
        <p className="text-caption text-stone">Caption 13</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-heading-md">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Scan an email</Button>
          <Button variant="secondary">See the benchmarks</Button>
          <Button variant="tertiary">Learn more</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-heading-md">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success">Legitimate</Badge>
          <Badge variant="new">NEW</Badge>
          <Badge variant="beta">BETA</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-heading-md">Cards</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card variant="base">
            <h3 className="text-card-title">card-base</h3>
            <p className="text-body-sm text-steel mt-2">
              White canvas, 16px radius, hairline border.
            </p>
          </Card>
          <Card variant="hero">
            <h3 className="text-card-title">Nothing swims past.</h3>
            <p className="text-body-sm mt-2 opacity-90">
              32px gradient card — the coral product moment.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
