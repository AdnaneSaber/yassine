# Component Organization

## Component Directory Structure

Organize components by type and feature, not by technical layer.

```
components/
├── ui/                     # Generic UI primitives (Shadcn/ui)
├── forms/                  # Form components
├── layout/                 # Layout components
├── demandes/               # Demande feature components
└── admin/                  # Admin feature components
```

**Why**: Feature-based organization keeps related components together, easier to find and maintain.

## UI Components (Primitives)

Generic, reusable UI components with no business logic.

```
components/ui/
├── button.tsx
├── input.tsx
├── modal.tsx
├── table.tsx
├── dialog.tsx
├── dropdown.tsx
└── badge.tsx
```

**Rules**:
- No business logic or data fetching
- Accept props for customization
- Use Tailwind for styling
- Accessible by default (WCAG)
- Composable and reusable

**Why**: Primitives are the building blocks for feature components, consistency across app.

## Form Components

Shared form inputs and validation components.

```
components/forms/
├── file-upload.tsx
├── date-picker.tsx
├── select-field.tsx
└── text-area.tsx
```

**Rules**:
- Integrate with React Hook Form
- Include built-in validation display
- Reusable across different forms
- Consistent error handling

**Why**: DRY principle for form inputs, consistent UX across forms.

## Layout Components

App structure and navigation components.

```
components/layout/
├── header.tsx
├── sidebar.tsx
├── footer.tsx
└── navigation.tsx
```

**Rules**:
- Used in `layout.tsx` files
- Handle app-wide navigation
- Responsive by default
- Role-aware (student vs admin)

**Why**: Separation of layout from content, shared across routes.

## Feature Components (Domain-Specific)

Components tied to specific business features.

```
components/demandes/
├── demande-form.tsx        # Create/edit demande form
├── demande-card.tsx        # Demande summary card
├── demande-list.tsx        # List of demandes
├── demande-detail.tsx      # Full demande view
├── status-badge.tsx        # Status display
└── workflow-actions.tsx    # Transition buttons

components/admin/
├── dashboard.tsx           # Admin dashboard
├── demande-table.tsx       # Admin demande table
├── status-modifier.tsx     # Change status modal
└── historique-view.tsx     # History timeline
```

**Rules**:
- One component per file
- Name describes specific purpose
- Can fetch data (Server Components)
- Can include business logic
- Import from `@/components/demandes/`

**Why**: Colocates related functionality, clear ownership and purpose.

## Component File Structure

Each component file should follow this pattern:

```typescript
// demande-card.tsx
'use client' // Only if needs interactivity

import { type Demande } from '@/types/demande'
import { Badge } from '@/components/ui/badge'

interface DemandeCardProps {
  demande: Demande
  onSelect?: (id: string) => void
}

export function DemandeCard({ demande, onSelect }: DemandeCardProps) {
  return (
    // Component JSX
  )
}
```

**Rules**:
- Export named function (not default)
- Define TypeScript props interface
- Props interface name matches component + "Props"
- Use `'use client'` directive only when needed
- Group imports: external, internal, types

**Why**: Consistent structure makes components predictable and easier to maintain.

## Server vs Client Components

Default to Server Components, use Client Components only when needed.

```typescript
// Server Component (default, no directive)
// demande-list.tsx
import { getDemandesByUser } from '@/lib/db/models/demande'

export async function DemandeList({ userId }: { userId: string }) {
  const demandes = await getDemandesByUser(userId)

  return (
    <div>
      {demandes.map(d => <DemandeCard key={d.id} demande={d} />)}
    </div>
  )
}
```

```typescript
// Client Component (needs 'use client')
// demande-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'

export function DemandeForm() {
  const [loading, setLoading] = useState(false)
  const form = useForm()

  return <form>...</form>
}
```

**Use Client Components for**:
- useState, useEffect, other hooks
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries requiring browser

**Why**: Server Components are faster and smaller, only add client JS when necessary.

## Component Composition

Build complex UIs by composing smaller components.

```
DemandeDetailPage (page.tsx)
└── DemandeDetail (feature component)
    ├── StatusBadge (feature component)
    ├── DemandeMetadata (feature component)
    ├── FileList (feature component)
    └── WorkflowActions (feature component)
        ├── Button (UI primitive)
        └── Dialog (UI primitive)
```

**Why**: Small, focused components are easier to test and reuse.

## Barrel Exports

Use index files for cleaner imports from component directories.

```typescript
// components/demandes/index.ts
export { DemandeCard } from './demande-card'
export { DemandeForm } from './demande-form'
export { DemandeList } from './demande-list'
export { StatusBadge } from './status-badge'

// Usage
import { DemandeCard, DemandeForm } from '@/components/demandes'
```

**Why**: Cleaner imports, easier to refactor internal structure.

## Shared vs Feature Components

Place components based on reusability.

**Shared** (`components/ui/`, `components/forms/`):
- Used across multiple features
- No feature-specific logic
- Generic and configurable

**Feature** (`components/demandes/`, `components/admin/`):
- Specific to one domain
- Contains business logic
- Can be complex

**Why**: Clear boundaries prevent dependency issues, encourages reuse where appropriate.

## Styling Approach

Use Tailwind utility classes directly in components.

```typescript
export function DemandeCard({ demande }: DemandeCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">
        {demande.objet}
      </h3>
    </div>
  )
}
```

**Rules**:
- Use Tailwind classes directly
- Extract repeated patterns to UI components
- Use CSS modules only for complex animations
- Keep responsive classes inline (sm:, md:, lg:)

**Why**: Tailwind provides consistency, component-scoped styles, no CSS file management.

## Component Props Pattern

Use explicit TypeScript interfaces for props.

```typescript
// Good: Explicit interface
interface DemandeCardProps {
  demande: Demande
  showActions?: boolean
  onEdit?: (id: string) => void
}

export function DemandeCard(props: DemandeCardProps) { }

// Avoid: Inline types
export function DemandeCard({ demande }: { demande: Demande }) { }
```

**Why**: Named interfaces are reusable, easier to document, better for complex props.

## Component Testing Strategy

Colocate test files with components.

```
components/demandes/
├── demande-card.tsx
├── demande-card.test.tsx
├── demande-form.tsx
└── demande-form.test.tsx
```

**Why**: Tests next to components are easier to find and maintain together.
