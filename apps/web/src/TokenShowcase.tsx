import { colors } from '@jellysync/ui';

const colorEntries = Object.entries(colors);

const typographyRoles = [
  { name: 'Display Large', className: 'font-display text-[3.5rem] font-extrabold tracking-[-0.02em]' },
  { name: 'Headline Large', className: 'font-display text-[2rem] font-bold tracking-[-0.02em]' },
  { name: 'Headline Medium', className: 'font-display text-[1.5rem] font-bold tracking-[-0.025em]' },
  { name: 'Body Medium', className: 'font-body text-[1rem] font-normal tracking-normal' },
  { name: 'Label Medium', className: 'font-body text-[0.75rem] font-semibold tracking-[0.2em] uppercase' },
  { name: 'Label Small', className: 'font-body text-[0.625rem] font-medium tracking-[0.1em] uppercase' },
];

const spacingTokens = [
  { name: 'spacing-1', value: '0.25rem' },
  { name: 'spacing-2', value: '0.5rem' },
  { name: 'spacing-3', value: '1rem' },
  { name: 'spacing-4', value: '1.4rem' },
  { name: 'spacing-6', value: '2rem' },
  { name: 'spacing-8', value: '2.75rem' },
  { name: 'spacing-12', value: '4rem' },
];

const radiusTokens = [
  { name: 'rounded-lg', className: 'rounded-lg' },
  { name: 'rounded-md', className: 'rounded-md' },
  { name: 'rounded-full', className: 'rounded-full' },
];

export default function TokenShowcase() {
  return (
    <div className="min-h-screen bg-surface p-6 text-on-surface font-body">
      <h1 className="font-display text-[3.5rem] font-extrabold tracking-[-0.02em] text-primary mb-6">
        Design System Tokens
      </h1>

      {/* Colors */}
      <section className="mb-8">
        <h2 className="font-display text-[2rem] font-bold tracking-[-0.02em] text-secondary mb-3">
          Colors
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {colorEntries.map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-md border border-outline-variant/15"
                style={{ backgroundColor: value }}
              />
              <span className="font-body text-[0.75rem] font-medium text-on-surface-variant">
                {name}
              </span>
              <span className="font-body text-[0.625rem] font-medium tracking-[0.1em] uppercase text-outline">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-8">
        <h2 className="font-display text-[2rem] font-bold tracking-[-0.02em] text-secondary mb-3">
          Typography Roles
        </h2>
        <div className="flex flex-col gap-3">
          {typographyRoles.map((role) => (
            <div key={role.name} className="flex items-baseline gap-3">
              <span className="font-body text-[0.75rem] font-semibold tracking-[0.2em] uppercase text-outline w-40 shrink-0">
                {role.name}
              </span>
              <span className={role.className}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing */}
      <section className="mb-8">
        <h2 className="font-display text-[2rem] font-bold tracking-[-0.02em] text-secondary mb-3">
          Spacing Scale
        </h2>
        <div className="flex flex-col gap-2">
          {spacingTokens.map((token) => (
            <div key={token.name} className="flex items-center gap-3">
              <span className="font-body text-[0.75rem] font-semibold tracking-[0.2em] uppercase text-outline w-32 shrink-0">
                {token.name}
              </span>
              <div
                className="h-4 bg-primary rounded-sm"
                style={{ width: token.value }}
              />
              <span className="text-on-surface-variant text-sm">{token.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Radius */}
      <section className="mb-8">
        <h2 className="font-display text-[2rem] font-bold tracking-[-0.02em] text-secondary mb-3">
          Corner Radius
        </h2>
        <div className="flex gap-4">
          {radiusTokens.map((token) => (
            <div key={token.name} className="flex flex-col items-center gap-2">
              <div
                className={`w-24 h-24 bg-surface-container-high border border-outline-variant/15 ${token.className}`}
              />
              <span className="font-body text-[0.75rem] font-medium text-on-surface-variant">
                {token.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Glassmorphism */}
      <section className="mb-8">
        <h2 className="font-display text-[2rem] font-bold tracking-[-0.02em] text-secondary mb-3">
          Glassmorphism
        </h2>
        <div className="relative h-48 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-50" />
          <div className="absolute inset-4 glass rounded-lg flex items-center justify-center">
            <span className="font-display text-[1.5rem] font-bold text-on-surface">
              .glass utility
            </span>
          </div>
        </div>
      </section>

      {/* Gradient */}
      <section>
        <h2 className="font-display text-[2rem] font-bold tracking-[-0.02em] text-secondary mb-3">
          Gradient Primary
        </h2>
        <div className="gradient-primary h-16 rounded-lg flex items-center justify-center">
          <span className="font-display text-[1.5rem] font-bold text-surface">
            .gradient-primary utility
          </span>
        </div>
      </section>
    </div>
  );
}
