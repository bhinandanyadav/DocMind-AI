# Design System & UI Guidelines

## DocMind AI — Intelligent Document Analysis & RAG Platform

> **Design Principle:** Every design decision must make the AI answer feel trustworthy and verifiable.
> Clean. Professional. Minimal. AI-focused.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout Grid](#4-spacing--layout-grid)
5. [Iconography](#5-iconography)
6. [Component Library](#6-component-library)
7. [Page Designs](#7-page-designs)
8. [Layouts](#8-layouts)
9. [States & Feedback](#9-states--feedback)
10. [Responsive Design](#10-responsive-design)
11. [Accessibility](#11-accessibility)
12. [Animation & Motion](#12-animation--motion)

---

## 1. Design Philosophy

### 1.1 Core Principles

**Trust First**
The product's value is verifiability. Every design choice must reinforce that AI answers are grounded in real documents. Citations must be visually prominent, not hidden.

**Minimal but Complete**
No decorative clutter. Every element serves a function. But "minimal" does not mean empty — use space, hierarchy, and contrast to guide the user's eye.

**AI-Focused Aesthetic**
The app should feel like a modern AI tool — dark-accented, clean whites, precise typography, subtle gradients. Reference: Notion, Linear, Perplexity, Vercel.

**Document-Centric**
Documents are the product. The UI treats documents as first-class citizens — large cards, clear metadata, visible status, easy access.

**Speed Perception**
The UI should feel fast even when the backend is working. Skeleton loaders, progress bars, and optimistic updates make the experience feel responsive.

---

### 1.2 What the UI Must NOT Do

- No excessive animations that delay interaction
- No gradient overload or neon color abuse
- No dark-pattern UI that hides important info
- No cluttered dashboards that overwhelm new users
- No generic "Chat with AI" look — this is a document intelligence product

---

## 2. Color System

### 2.1 Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#6366F1` | Buttons, links, active states, accents |
| Primary Dark | `#4F46E5` | Button hover, pressed states |
| Primary Light | `#EEF2FF` | Light backgrounds, selected states, highlights |
| Primary Muted | `#A5B4FC` | Disabled primary, soft accents |

### 2.2 Neutral Palette

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` | Main page background |
| Surface | `#F9FAFB` | Card backgrounds, sidebar |
| Surface 2 | `#F3F4F6` | Input backgrounds, hover states |
| Border | `#E5E7EB` | Dividers, card borders, input borders |
| Border Strong | `#D1D5DB` | Table borders, strong dividers |
| Text Primary | `#111827` | Main headings and body text |
| Text Secondary | `#6B7280` | Labels, meta info, placeholder text |
| Text Muted | `#9CA3AF` | Disabled text, captions |
| Text Inverse | `#FFFFFF` | Text on dark backgrounds |

### 2.3 Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | READY status, success toasts, upload complete |
| Success Light | `#ECFDF5` | Success badge background |
| Warning | `#F59E0B` | PROCESSING status, warning states |
| Warning Light | `#FFFBEB` | Warning badge background |
| Error | `#EF4444` | FAILED status, error toasts, validation errors |
| Error Light | `#FEF2F2` | Error badge background |
| Info | `#3B82F6` | Info toasts, neutral badges |
| Info Light | `#EFF6FF` | Info badge background |

### 2.4 AI-Specific Colors

| Name | Hex | Usage |
|------|-----|-------|
| AI Bubble | `#F5F3FF` | AI message background |
| AI Border | `#DDD6FE` | AI message border |
| Source Card | `#FAFAFA` | Citation card background |
| Source Border | `#E5E7EB` | Citation card border |
| Source Accent | `#6366F1` | Source card left border accent |

### 2.5 Dark Mode (Future)

Dark mode is planned for Phase 2 of the product. All color tokens should be defined as CSS variables so dark mode can be added by overriding them.

```css
:root {
  --color-primary: #6366F1;
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
}
```

### 2.6 Gradient (Accent Use Only)

Used sparingly on the landing page hero and feature section headers:

```css
/* Indigo to Purple */
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

/* Subtle card accent */
background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%);
```

---

## 3. Typography

### 3.1 Font Family

```css
/* Primary — UI and body text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace — code blocks, chunk previews, metadata */
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

Import Inter from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 36px / 2.25rem | 700 | 1.2 | Landing page hero heading |
| H1 | 30px / 1.875rem | 700 | 1.3 | Page titles |
| H2 | 24px / 1.5rem | 600 | 1.4 | Section headings |
| H3 | 20px / 1.25rem | 600 | 1.4 | Card headings, modal titles |
| H4 | 16px / 1rem | 600 | 1.5 | Sub-section labels |
| Body Large | 16px / 1rem | 400 | 1.6 | Main body text, chat messages |
| Body | 14px / 0.875rem | 400 | 1.5 | General UI text, descriptions |
| Body Small | 13px / 0.8125rem | 400 | 1.5 | Meta info, timestamps, captions |
| Label | 12px / 0.75rem | 500 | 1.4 | Form labels, tags, badges |
| Code | 13px / 0.8125rem | 400 | 1.6 | Code blocks, monospace content |

### 3.3 Typography Rules

- Maximum line length for readable body text: **65–75 characters**
- Use `font-weight: 600` for interactive elements (buttons, links)
- Use `font-weight: 400` for body copy
- Never use `font-weight < 400` for small text (< 14px)
- AI message text uses `Body Large` (16px) for readability
- Source card excerpt uses `Body Small` (13px) in `Text Secondary` color

---

## 4. Spacing & Layout Grid

### 4.1 Spacing Scale

All spacing uses a base-4 scale:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight padding, icon gaps |
| `space-2` | 8px | Small padding, inner gaps |
| `space-3` | 12px | Form field padding, small cards |
| `space-4` | 16px | Standard padding, card padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Component padding, card gap |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Large section gaps |
| `space-12` | 48px | Page section spacing |
| `space-16` | 64px | Hero spacing, large gaps |

### 4.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Badges, tags, small elements |
| `radius` | 8px | Buttons, inputs, small cards |
| `radius-md` | 12px | Cards, modals |
| `radius-lg` | 16px | Large cards, panels |
| `radius-xl` | 24px | Feature cards, hero sections |
| `radius-full` | 9999px | Pills, avatar circles |

### 4.3 Layout Grid

**Desktop (1280px+):**
- Sidebar: `240px` fixed width
- Main content: fluid, max-width `1200px`
- Content padding: `24px` horizontal

**Tablet (768px–1279px):**
- Sidebar: `60px` icon-only (collapsed)
- Main content: fluid
- Content padding: `20px` horizontal

**Mobile (< 768px):**
- Sidebar: hidden, accessed via hamburger menu (drawer)
- Main content: full width
- Content padding: `16px` horizontal

### 4.4 Elevation (Box Shadows)

| Level | CSS | Usage |
|-------|-----|-------|
| Flat | `none` | Default cards |
| Raised | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Hover cards, dropdowns |
| Modal | `0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, popovers |
| Toast | `0 20px 40px rgba(0,0,0,0.12)` | Toast notifications |

---

## 5. Iconography

### 5.1 Icon Library

Use **Lucide Icons** exclusively.

```bash
npm install lucide-react
```

```tsx
import { FileText, Upload, MessageSquare, Search } from 'lucide-react'
```

### 5.2 Icon Sizes

| Context | Size |
|---------|------|
| Inline with text | 16px (`size-4`) |
| Buttons | 16px (`size-4`) |
| Sidebar navigation | 20px (`size-5`) |
| Feature cards | 24px (`size-6`) |
| Empty states | 48px (`size-12`) |
| File type icons | 32px (`size-8`) |

### 5.3 File Type Icons

| Type | Icon | Color |
|------|------|-------|
| PDF | `FileText` | `#EF4444` (red) |
| DOCX | `FileText` | `#3B82F6` (blue) |
| TXT | `FileText` | `#6B7280` (gray) |

### 5.4 Status Icons

| Status | Icon | Color |
|--------|------|-------|
| READY | `CheckCircle` | `#10B981` (green) |
| PROCESSING | `Loader2` (spinning) | `#F59E0B` (amber) |
| UPLOADED | `Clock` | `#6B7280` (gray) |
| FAILED | `XCircle` | `#EF4444` (red) |

---

## 6. Component Library

### 6.1 Buttons

**Primary Button**
```
Background:   #6366F1
Text:         #FFFFFF
Border:       none
Padding:      10px 20px
Border Radius: 8px
Font:         14px, weight 600
Hover:        #4F46E5
Active:       #4338CA
Disabled:     #A5B4FC, cursor not-allowed
```

**Secondary Button**
```
Background:   #FFFFFF
Text:         #374151
Border:       1px solid #E5E7EB
Padding:      10px 20px
Border Radius: 8px
Hover:        Background #F9FAFB
```

**Ghost Button**
```
Background:   transparent
Text:         #6B7280
Border:       none
Hover:        Background #F3F4F6, Text #111827
```

**Destructive Button**
```
Background:   #EF4444
Text:         #FFFFFF
Hover:        #DC2626
```

**Icon Button**
```
Size:         36px × 36px
Background:   transparent
Border:       none
Border Radius: 8px
Hover:        Background #F3F4F6
```

---

### 6.2 Inputs

**Text Input**
```
Background:   #FFFFFF
Border:       1px solid #E5E7EB
Border Radius: 8px
Padding:      10px 14px
Font:         14px, weight 400
Color:        #111827
Placeholder:  #9CA3AF

Focus:        Border #6366F1, ring 2px #EEF2FF
Error:        Border #EF4444, ring 2px #FEF2F2
```

**Search Input**
```
Same as Text Input
Left icon:    Search (16px, #9CA3AF)
Padding-left: 40px
```

**Textarea**
```
Same as Text Input
Min-height:   80px
Resize:       vertical
```

---

### 6.3 Cards

**Document Card**
```
Background:   #FFFFFF
Border:       1px solid #E5E7EB
Border Radius: 12px
Padding:      20px
Hover:        Shadow raised, border #D1D5DB

Contents:
  - File type icon (top-left, 32px)
  - Filename (H4, truncated, 1 line)
  - Status badge
  - Page count + file size (Body Small, Text Secondary)
  - Upload date (Body Small, Text Muted)
  - Action menu (3-dot, top-right)
```

**Conversation Card**
```
Background:   #FFFFFF
Border:       1px solid #E5E7EB
Border Radius: 8px
Padding:      14px 16px
Hover:        Background #F9FAFB

Contents:
  - MessageSquare icon (16px, Primary)
  - Conversation title (Body, truncated)
  - Date (Body Small, Text Muted)
  - Hover: rename + delete buttons appear
```

**Stats Card**
```
Background:   #FFFFFF
Border:       1px solid #E5E7EB
Border Radius: 12px
Padding:      24px
Min-width:    160px

Contents:
  - Icon (24px, Primary, in Primary Light rounded square)
  - Number (H1, Text Primary)
  - Label (Body Small, Text Secondary)
```

**Source / Citation Card**
```
Background:   #FAFAFA
Border:       1px solid #E5E7EB
Border-left:  3px solid #6366F1
Border Radius: 8px
Padding:      14px 16px
Margin-top:   8px

Contents:
  - Document name (Label, weight 600, Text Primary)
  - Page badge + Section label (Body Small, Text Secondary)
  - Text excerpt (Body Small, Text Secondary, max 3 lines, truncated)
  - "View Source" button (Ghost, small)
```

**Feature Card (Landing)**
```
Background:   #FFFFFF
Border:       1px solid #E5E7EB
Border Radius: 16px
Padding:      28px
Hover:        Shadow raised, border #C7D2FE

Contents:
  - Icon (28px, Primary, in Primary Light circle)
  - Feature name (H3)
  - Description (Body, Text Secondary)
```

---

### 6.4 Badges / Status Pills

```
Border Radius: 9999px (pill)
Padding:       2px 10px
Font:          12px, weight 500

READY:       Background #ECFDF5, Text #065F46, Dot #10B981
PROCESSING:  Background #FFFBEB, Text #92400E, Dot #F59E0B (animated pulse)
UPLOADED:    Background #F3F4F6, Text #374151, Dot #6B7280
FAILED:      Background #FEF2F2, Text #991B1B, Dot #EF4444
```

**Document Type Badges:**
```
PDF:   Background #FEF2F2, Text #991B1B
DOCX:  Background #EFF6FF, Text #1E40AF
TXT:   Background #F3F4F6, Text #374151
```

---

### 6.5 Chat Message Bubbles

**User Message**
```
Alignment:    Right
Background:   #6366F1
Text Color:   #FFFFFF
Border Radius: 16px 16px 4px 16px
Padding:      12px 16px
Max-width:    70%
Font:         Body Large (16px)
```

**AI Message**
```
Alignment:    Left
Background:   #F5F3FF
Border:       1px solid #DDD6FE
Text Color:   #111827
Border Radius: 4px 16px 16px 16px
Padding:      16px
Max-width:    80%
Font:         Body Large (16px)
Markdown:     Rendered (headings, bold, lists, code blocks)
```

**Timestamp**
```
Font:         Body Small (13px)
Color:        Text Muted (#9CA3AF)
Alignment:    Below message, same side
```

---

### 6.6 Sidebar Navigation

```
Width:        240px (desktop) / 60px (tablet) / hidden (mobile)
Background:   #F9FAFB
Border-right: 1px solid #E5E7EB
Padding:      16px 12px

Logo area:
  - Icon (32px) + "DocMind AI" text (H4, weight 700)
  - Bottom border

Nav items:
  - Padding: 10px 12px
  - Border Radius: 8px
  - Icon (20px) + Label (Body, weight 500)
  - Normal:   Text #6B7280, Background transparent
  - Hover:    Background #F3F4F6, Text #111827
  - Active:   Background #EEF2FF, Text #4F46E5, Icon Primary

Bottom items:
  - Settings
  - User avatar + name + logout
```

**Nav Items:**
```
- Dashboard        (LayoutDashboard icon)
- Documents        (FolderOpen icon)
- Chat             (MessageSquare icon)
- Search           (Search icon)
- Compare          (GitCompare icon)
- Research         (FlaskConical icon)
- Study Mode       (GraduationCap icon)
- ── divider ──
- Settings         (Settings icon)
```

---

### 6.7 Upload Zone

```
Background:   #FAFAFA
Border:       2px dashed #D1D5DB
Border Radius: 12px
Padding:      48px 24px
Text Align:   center

Idle state:
  - Upload icon (48px, #9CA3AF)
  - "Drag and drop your file here" (Body, Text Secondary)
  - "or" divider
  - "Browse files" button (Secondary)
  - "PDF, DOCX, TXT · Max 50MB" (Body Small, Text Muted)

Drag-over state:
  - Border: 2px dashed #6366F1
  - Background: #EEF2FF
  - Icon color: Primary

Selected file state:
  - File icon + filename + size
  - Remove button (X)
  - Upload button (Primary)
  - Progress bar (appears after click)
```

---

### 6.8 Progress Bar

```
Height:       6px
Border Radius: 9999px
Background:   #E5E7EB (track)
Fill:         #6366F1 (progress)
Transition:   width 300ms ease

With label:
  - Above: filename
  - Below: "42%" or "Extracting text..."
```

**Processing Steps Indicator:**
```
Uploading...      ● ○ ○ ○ ○
Extracting...     ● ● ○ ○ ○
Chunking...       ● ● ● ○ ○
Embedding...      ● ● ● ● ○
Ready             ● ● ● ● ●
```

---

### 6.9 Toast Notifications

```
Position:     Bottom-right
Max-width:    380px
Border Radius: 12px
Padding:      16px
Shadow:       Toast level

Success:
  Border-left: 4px solid #10B981
  Icon: CheckCircle (green)
  Title: Bold (Body, weight 600)
  Message: Body Small

Error:
  Border-left: 4px solid #EF4444
  Icon: XCircle (red)

Warning:
  Border-left: 4px solid #F59E0B
  Icon: AlertTriangle (amber)

Info:
  Border-left: 4px solid #3B82F6
  Icon: Info (blue)

Auto-dismiss: 4 seconds
Close button: X (top-right)
```

---

### 6.10 Modals / Dialogs

```
Overlay:      rgba(0,0,0,0.4) backdrop
Background:   #FFFFFF
Border Radius: 16px
Padding:      28px
Max-width:    480px (small) / 640px (medium) / 90vw (large)
Shadow:       Modal level

Header:
  - Title (H3)
  - X close button (top-right)

Body:
  - Content (16px gap between elements)

Footer:
  - Right-aligned buttons
  - Cancel (Secondary) then Confirm (Primary or Destructive)
```

---

### 6.11 Skeleton Loaders

Match the shape of the content they replace:

```
Color:          #F3F4F6
Animated:       shimmer effect (left-to-right gradient sweep)
Border Radius:  matches component

Examples:
- Stats card:   2 skeleton lines (number + label)
- Document card: full card shape with 4 lines
- Chat message: 3 lines of varying width
- Source card:  2 lines
```

---

### 6.12 Empty States

```
Centered in content area
Icon:       48px, Text Muted
Title:      H3, Text Primary
Message:    Body, Text Secondary (1–2 sentences)
CTA:        Optional Primary button

Examples:
  No documents:     FolderOpen icon
                    "No documents yet"
                    "Upload your first document to get started."
                    [Upload Document] button

  No conversations: MessageSquare icon
                    "No conversations yet"
                    "Select a document and ask your first question."

  No search results: Search icon
                    "No results found"
                    "Try a different search term or upload more documents."
```

---

## 7. Page Designs

### 7.1 Landing Page

**Layout:** Full-width, no sidebar, public.

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR                                                 │
│  [DocMind AI logo]              [Login]  [Get Started]  │
├─────────────────────────────────────────────────────────┤
│  HERO SECTION                  (gradient background)    │
│                                                         │
│  Turn Documents Into Intelligence.                      │
│  (Display, 36px, weight 700, centered)                  │
│                                                         │
│  Upload your PDFs, research papers, manuals and         │
│  reports. Ask questions. Get cited answers.             │
│  (Body Large, Text Secondary, centered)                 │
│                                                         │
│  [Get Started — Free]   [See How It Works]              │
│                                                         │
│  ── App screenshot / preview mockup ──                  │
├─────────────────────────────────────────────────────────┤
│  PROBLEM SECTION                                        │
│                                                         │
│  "Reading 300 pages manually is not a strategy."        │
│  (H2, centered)                                         │
│                                                         │
│  3 pain point cards:                                    │
│  [Slow manual reading] [Keyword search fails] [No sources]│
├─────────────────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                                 │
│                                                         │
│  1. Upload            2. Ask              3. Verify     │
│  [Upload icon]       [Chat icon]        [Cite icon]     │
│  Upload your PDF     Ask in natural     Every answer    │
│                      language           has a source    │
├─────────────────────────────────────────────────────────┤
│  FEATURES (6 cards in 3×2 grid)                         │
│                                                         │
│  [AI Chat]  [RAG Pipeline]  [Source Citations]          │
│  [Summary]  [Multi-Doc]     [Research Mode]             │
├─────────────────────────────────────────────────────────┤
│  CTA SECTION                                            │
│                                                         │
│  Ready to make your documents intelligent?              │
│  [Start for Free]                                       │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                 │
│  DocMind AI · Turn Documents Into Intelligence.         │
└─────────────────────────────────────────────────────────┘
```

---

### 7.2 Login Page

**Layout:** Centered card, `AuthLayout`.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          [DocMind AI logo + wordmark]                   │
│                                                         │
│  ┌───────────────────────────────────────────────┐      │
│  │                                               │      │
│  │  Welcome back                                 │      │
│  │  Sign in to your account                      │      │
│  │                                               │      │
│  │  Email                                        │      │
│  │  [___________________________________]        │      │
│  │                                               │      │
│  │  Password                                     │      │
│  │  [___________________________________]  [👁]  │      │
│  │                                               │      │
│  │  [        Sign In          ]   ← Primary btn  │      │
│  │                                               │      │
│  │  Don't have an account?  Register →           │      │
│  │                                               │      │
│  └───────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Card: `max-width: 400px`, centered
- Error shown as red inline message below the button
- Logo links to `/`

---

### 7.3 Register Page

**Layout:** Centered card, `AuthLayout`.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          [DocMind AI logo + wordmark]                   │
│                                                         │
│  ┌───────────────────────────────────────────────┐      │
│  │                                               │      │
│  │  Create your account                          │      │
│  │  Start turning documents into intelligence    │      │
│  │                                               │      │
│  │  Full Name                                    │      │
│  │  [___________________________________]        │      │
│  │                                               │      │
│  │  Email                                        │      │
│  │  [___________________________________]        │      │
│  │                                               │      │
│  │  Password                                     │      │
│  │  [___________________________________]        │      │
│  │                                               │      │
│  │  Confirm Password                             │      │
│  │  [___________________________________]        │      │
│  │                                               │      │
│  │  [       Create Account       ]               │      │
│  │                                               │      │
│  │  Already have an account?  Sign in →          │      │
│  │                                               │      │
│  └───────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 7.4 Dashboard

**Layout:** `AppLayout` (sidebar + main).

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Welcome back, Alex 👋          [Upload Doc] │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │                                              │
│ Dashboard│  STATS ROW                                   │
│ Documents│  ┌──────────────┐ ┌──────────────┐ ┌──────┐ │
│ Chat     │  │ 📄 Documents  │ │ 📃 Pages      │ │ 💬 Q │ │
│ Search   │  │     12        │ │    1,245      │ │  87  │ │
│ Compare  │  └──────────────┘ └──────────────┘ └──────┘ │
│ Research │                                              │
│ Study    │  RECENT DOCUMENTS                            │
│──────────│  ┌────────────────────────────────────────┐  │
│ Settings │  │ 📄 research_paper.pdf   READY  2h ago  │  │
│ [Avatar] │  │ 📘 employee_handbook.docx  READY  1d  │  │
└──────────┤  │ 📄 annual_report_2025.pdf  PROCESSING  │  │
           │  └────────────────────────────────────────┘  │
           │                                              │
           │  RECENT CONVERSATIONS                        │
           │  ┌────────────────────────────────────────┐  │
           │  │ 💬 Research Paper Analysis      1h ago │  │
           │  │ 💬 HR Policy Questions          3h ago │  │
           │  └────────────────────────────────────────┘  │
           └──────────────────────────────────────────────┘
```

---

### 7.5 Documents Page

**Layout:** `AppLayout`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Documents                    [Upload Doc ↑]  │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │  [🔍 Search documents...]  [Filter ▾] [Sort ▾]│
│          ├──────────────────────────────────────────────┤
│          │                                              │
│          │  DOCUMENT GRID (3 columns desktop)           │
│          │                                              │
│          │  ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│          │  │📄          │ │📘          │ │📄          │  │
│          │  │research_  │ │employee_  │ │report_    │  │
│          │  │paper.pdf  │ │handbook   │ │2025.pdf   │  │
│          │  │           │ │.docx      │ │           │  │
│          │  │● READY    │ │● READY    │ │⏳ PROCESS  │  │
│          │  │248 pages  │ │112 pages  │ │ing...     │  │
│          │  │2.4 MB     │ │1.1 MB     │ │4.8 MB     │  │
│          │  │2h ago  ···│ │1d ago  ···│ │3m ago  ···│  │
│          │  └───────────┘ └───────────┘ └───────────┘  │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.6 AI Chat Page

**Layout:** `AppLayout` with internal split panel.

```
┌──────────┬───────────────────┬────────────────────────────┐
│          │  LEFT PANEL       │  CHAT PANEL                │
│ SIDEBAR  │  ─────────────    │                            │
│          │  Documents        │  research_paper.pdf  ×     │
│          │                   │  ────────────────────────  │
│          │  ☑ research_      │                            │
│          │    paper.pdf      │                            │
│          │  ☐ handbook.docx  │   [Empty state / Messages] │
│          │  ☐ report.pdf     │                            │
│          │                   │                            │
│          │  ─────────────    │  USER                      │
│          │  Conversations    │  ┌──────────────────────┐  │
│          │                   │  │ What methodology was │  │
│          │  + New Chat       │  │ used in this paper?  │  │
│          │                   │  └──────────────────────┘  │
│          │  💬 Research Q    │                            │
│          │  💬 HR Policy     │  AI                        │
│          │                   │  ┌──────────────────────┐  │
│          │                   │  │ The paper uses a     │  │
│          │                   │  │ transformer-based    │  │
│          │                   │  │ CNN architecture...  │  │
│          │                   │  └──────────────────────┘  │
│          │                   │  ┌──────────────────────┐  │
│          │                   │  │ 📄 research_paper.pdf│  │
│          │                   │  │ Page 7 · Methodology │  │
│          │                   │  │ "The proposed arch..." │
│          │                   │  │         [View Source]│  │
│          │                   │  └──────────────────────┘  │
│          │                   │                            │
│          │                   │  ┌──────────────────────┐  │
│          │                   │  │ Ask about this doc..  │  │
│          │                   │  │                  [→] │  │
│          │                   │  └──────────────────────┘  │
└──────────┴───────────────────┴────────────────────────────┘
```

---

### 7.7 Document Viewer Page

**Layout:** `AppLayout` with full-height viewer panel.

```
┌──────────┬──────────────────────────────────────────────┐
│          │  research_paper.pdf               [← Back]   │
│ SIDEBAR  ├────────────────────────────────┬─────────────┤
│          │  PAGE CONTROLS                 │  MINI PANEL │
│          │  [←] Page 7 of 248 [→]  [🔍]  │             │
│          │  Zoom: [−] 100% [+]            │ Ask AI ↗    │
│          ├────────────────────────────────┤             │
│          │                                │ Cited here: │
│          │                                │ ┌─────────┐ │
│          │   ┌──────────────────────┐     │ │Source 1 │ │
│          │   │                      │     │ │Page 7   │ │
│          │   │   PDF PAGE RENDER    │     │ └─────────┘ │
│          │   │                      │     │             │
│          │   │  (react-pdf output)  │     │             │
│          │   │                      │     │             │
│          │   └──────────────────────┘     │             │
│          │                                │             │
└──────────┴────────────────────────────────┴─────────────┘
```

---

### 7.8 Document Details Page

**Layout:** `AppLayout`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  ← Documents                                 │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │  📄 research_paper.pdf        ● READY         │
│          │  ─────────────────────────────────────────── │
│          │  248 pages · 2.4 MB · PDF · Uploaded 2h ago  │
│          │                                              │
│          │  [Open Viewer] [Ask AI] [Summary] [⋯ More]   │
│          │                                              │
│          │  QUICK SUMMARY                               │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ • The paper addresses X problem       │    │
│          │  │ • Uses transformer architecture       │    │
│          │  │ • Evaluated on 3 benchmark datasets   │    │
│          │  │ • Achieves 94.3% accuracy              │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  KEY TOPICS                                  │
│          │  [#AI] [#NLP] [#Transformer] [#Benchmark]   │
│          │                                              │
│          │  METADATA                                    │
│          │  Processing time: 42s · Chunks: 312         │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.9 Search Page

**Layout:** `AppLayout`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Search                                      │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │                                              │
│          │  ┌────────────────────────────────────────┐  │
│          │  │ 🔍  Search your documents...            │  │
│          │  └────────────────────────────────────────┘  │
│          │                                              │
│          │  Optional: Search in [All Documents ▾]       │
│          │                                              │
│          │  ── RESULTS ──────────────────────────────── │
│          │                                              │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ 📄 research_paper.pdf                 │    │
│          │  │ Page 24 · Section: Leave Policy       │    │
│          │  │ "Employees are entitled to 18 paid..." │    │
│          │  │ Relevance: ████████░░ 87%  [Open →]   │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ 📘 employee_handbook.docx             │    │
│          │  │ Page 12 · Section: Work From Home     │    │
│          │  │ "Remote work is permitted for..."     │    │
│          │  │ Relevance: ██████░░░░ 71%  [Open →]   │    │
│          │  └──────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.10 Compare Page

**Layout:** `AppLayout`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Compare Documents                           │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │                                              │
│          │  [Document A ▾]       VS       [Document B ▾]│
│          │  Policy_2025.pdf              Policy_2026.pdf│
│          │                                              │
│          │  [Compare Documents]  ← Primary button      │
│          │                                              │
│          │  ── RESULTS ──────────────────────────────── │
│          │                                              │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ ✅ ADDED                               │    │
│          │  │ Remote work provision (Page 14)       │    │
│          │  │ Mental health leave clause (Page 18)  │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ ❌ REMOVED                             │    │
│          │  │ Old attendance tracking clause        │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  ┌──────────────────────────────────────┐    │
│          │  │ ✏️ MODIFIED                            │    │
│          │  │ Annual leave: 15 days → 18 days       │    │
│          │  └──────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.11 Summary Page

**Layout:** `AppLayout`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Summary — research_paper.pdf   [Regenerate] │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │                                              │
│          │  QUICK SUMMARY                               │
│          │  ┌──────────────────────────────────────┐    │
│          │  │  • Problem: X                         │    │
│          │  │  • Methodology: Transformer + CNN     │    │
│          │  │  • Dataset: 3 benchmarks              │    │
│          │  │  • Result: 94.3% accuracy             │    │
│          │  │  • Limitation: small dataset          │    │
│          │  └──────────────────────────────────────┘    │
│          │                                              │
│          │  KEY TOPICS                                  │
│          │  [#AI] [#NLP] [#Transformer] [#CV]           │
│          │                                              │
│          │  DETAILED SUMMARY        [Expand All ▾]      │
│          │  ┌──────────────────────────────────────┐    │
│          │  │  Introduction         [▾]             │    │
│          │  │  Methodology          [▾]             │    │
│          │  │  Experiments          [▾]             │    │
│          │  │  Results & Discussion [▾]             │    │
│          │  │  Conclusion           [▾]             │    │
│          │  └──────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.12 Research Mode Page

**Layout:** `AppLayout`

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Research Mode — research_paper.pdf          │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │                                              │
│          │  ┌──────────────┐ ┌──────────────────────┐  │
│          │  │ Problem       │ │ AI identifies the     │  │
│          │  │               │ │ core research prob... │  │
│          │  └──────────────┘ └──────────────────────┘  │
│          │                                              │
│          │  ┌──────────────┐ ┌──────────────────────┐  │
│          │  │ Methodology   │ │ Transformer-based     │  │
│          │  │               │ │ CNN with attention... │  │
│          │  └──────────────┘ └──────────────────────┘  │
│          │                                              │
│          │  [Dataset] [Models] [Metrics] [Results]     │
│          │  [Limitations] [Future Work]                 │
│          │                                              │
│          │  Each card has:                              │
│          │    - Field name (label)                      │
│          │    - Extracted content                       │
│          │    - Source citation (page + section)        │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.13 Study Mode Page

**Layout:** `AppLayout` with tabs.

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Study Mode — chapter_5.pdf                  │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│          │  [Notes] [MCQs] [Questions] [Flashcards]     │
│          ├──────────────────────────────────────────────┤
│          │                                              │
│          │  MCQs TAB:                                   │
│          │                                              │
│          │  Q1. What is the main objective?             │
│          │  ○ A. To analyze...                          │
│          │  ○ B. To build...                            │
│          │  ○ C. To evaluate...   ← correct             │
│          │  ○ D. To compare...                          │
│          │                                              │
│          │  [Show Answer]  [Next Question →]            │
│          │                                              │
│          │  Progress: 3 / 10 questions                  │
│          │  ████████░░░░░░░░░░░░ 30%                   │
└──────────┴──────────────────────────────────────────────┘
```

---

### 7.14 Settings Page

**Layout:** `AppLayout` with left sub-navigation.

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Settings                                    │
│ SIDEBAR  ├──────────────┬───────────────────────────────┤
│          │  Profile     │  Profile                      │
│          │  Password    │  ─────────────────────────    │
│          │  AI Prefs    │  Name                         │
│          │  Danger Zone │  [Alex Johnson____________]   │
│          │              │                               │
│          │              │  Email                        │
│          │              │  [alex@example.com_________]  │
│          │              │  (email cannot be changed)    │
│          │              │                               │
│          │              │  [Save Changes]               │
│          │              │                               │
└──────────┴──────────────┴───────────────────────────────┘
```

---

## 8. Layouts

### 8.1 AppLayout (Authenticated)

```
┌────────────────────────────────────────────────┐
│ SIDEBAR (240px fixed)  │  MAIN CONTENT AREA    │
│                        │  (fluid, max 1200px)  │
│  Logo                  │                       │
│  Nav items             │  Page Header          │
│  ─────────             │  ─────────────────    │
│  Settings              │  Page Content         │
│  User + Logout         │                       │
└────────────────────────────────────────────────┘
```

### 8.2 AuthLayout (Login / Register)

```
┌────────────────────────────────────────────────┐
│                                                │
│         Background: gradient or surface        │
│                                                │
│     ┌────────────────────────────────┐         │
│     │     Centered Card (max 400px)  │         │
│     │     Logo + Form + CTA          │         │
│     └────────────────────────────────┘         │
│                                                │
└────────────────────────────────────────────────┘
```

### 8.3 Chat Layout (Split Panel)

```
┌────────────────────────────────────────────────────────┐
│ SIDEBAR │  LEFT PANEL (280px)  │  CHAT PANEL (fluid)  │
│         │  Document selector   │  Message history      │
│         │  Conversation list   │  Input bar (fixed)    │
└────────────────────────────────────────────────────────┘
```

### 8.4 Viewer Layout

```
┌────────────────────────────────────────────────┐
│ SIDEBAR │  VIEWER PANEL (fluid)    │  SIDE (200)│
│         │  Page controls toolbar   │  Citations │
│         │  PDF render area         │  Ask AI    │
└────────────────────────────────────────────────┘
```

---

## 9. States & Feedback

### 9.1 All Interactive States

Every interactive element must have:

| State | Visual Change |
|-------|--------------|
| Default | Base style |
| Hover | Background shift or shadow |
| Focus | Primary color ring (2px) |
| Active | Slightly darker/pressed |
| Disabled | 50% opacity, `cursor: not-allowed` |
| Loading | Spinner replaces icon or text |

### 9.2 Loading Patterns

| Scenario | Pattern |
|----------|---------|
| Page initial load | Skeleton loaders |
| Button action | Spinner inside button, button disabled |
| Document upload | Progress bar with percentage |
| Document processing | Step-by-step status indicator |
| AI generating answer | Animated typing dots `...` |
| API call in background | None (silent) |

### 9.3 Error Patterns

| Scenario | Pattern |
|----------|---------|
| Form validation | Inline red message below field |
| API error | Toast notification (auto-dismiss) |
| Page-level error | Error state card in content area |
| Auth error | Inline message in login card |
| Upload error | Error state in upload zone |
| AI not found | Normal AI message bubble (not an error) |

### 9.4 Success Patterns

| Scenario | Pattern |
|----------|---------|
| Rename saved | Toast: "Document renamed" |
| Document deleted | Toast: "Document deleted" + item removed |
| Upload complete | Status badge changes to PROCESSING |
| Document ready | Status badge changes to READY (green) |
| Copy text | Toast: "Copied to clipboard" |

---

## 10. Responsive Design

### 10.1 Breakpoints

```css
/* Mobile first */
sm:   640px   /* Large mobile */
md:   768px   /* Tablet */
lg:   1024px  /* Small desktop */
xl:   1280px  /* Desktop */
2xl:  1536px  /* Large desktop */
```

### 10.2 Responsive Behavior Per Page

| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Landing | Single column, stacked | 2-col features | 3-col features |
| Dashboard | Stats stack vertically | 2-col stats | 3-col stats |
| Documents | 1-col list | 2-col grid | 3-col grid |
| Chat | Full screen (no split) | Split (narrow left) | Split (balanced) |
| Viewer | Full screen, controls at bottom | Full screen | Split with citations |
| Compare | Stacked comparison | Side-by-side | Side-by-side |

### 10.3 Sidebar on Mobile

- Hidden by default on mobile
- Hamburger icon (`Menu`) in top-left of header
- Opens as a full-height drawer (slides in from left)
- Overlay backdrop to close
- Close button inside drawer

---

## 11. Accessibility

### 11.1 Requirements

- All interactive elements must be keyboard navigable (Tab order)
- All buttons and links must have visible focus rings
- All images and icons must have `aria-label` or `alt` text
- Color contrast must meet WCAG 2.1 AA:
  - Body text on white: `#111827` on `#FFFFFF` = 15.4:1 ✓
  - Secondary text: `#6B7280` on `#FFFFFF` = 4.6:1 ✓
  - Primary button text: `#FFFFFF` on `#6366F1` = 4.9:1 ✓
- Forms must have `<label>` elements connected to inputs
- Error messages must be associated with their fields via `aria-describedby`
- Loading states must use `aria-live="polite"` for screen readers
- Modal dialogs must trap focus and support Escape to close

### 11.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` in chat input | Send message |
| `Escape` | Close modal / drawer |
| `Tab` | Navigate between interactive elements |
| `Arrow keys` | Navigate within menus/lists |

---

## 12. Animation & Motion

### 12.1 Principles

- Motion is subtle and purposeful — not decorative
- Duration: 150ms–300ms for UI transitions
- Easing: `ease-out` for elements entering, `ease-in` for leaving
- No animations that block interaction

### 12.2 Standard Transitions

| Element | Animation | Duration |
|---------|-----------|---------|
| Page transitions | Fade in (opacity 0→1) | 200ms |
| Sidebar drawer | Slide in from left | 250ms |
| Modal open | Scale 0.95→1 + fade in | 200ms |
| Toast appear | Slide up + fade in | 250ms |
| Toast dismiss | Fade out + slide down | 200ms |
| Dropdown open | Scale Y 0.95→1 + fade | 150ms |
| Button hover | Background color | 150ms |
| Skeleton shimmer | Left-to-right sweep | 1.5s loop |
| Processing dot | Pulse | 1s loop |
| AI typing | Bounce dots | 1.2s loop |

### 12.3 Typing Indicator (AI)

While the AI is generating a response, show:

```
AI  ●  ●  ●
    (bouncing dots animation)
```

CSS animation: each dot bounces with a 0.2s delay between them.

### 12.4 PROCESSING Status Pulse

The yellow dot on a PROCESSING badge should pulse:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.processing-dot {
  animation: pulse 1s ease-in-out infinite;
}
```

---

## Summary

| Token | Value |
|-------|-------|
| Primary color | `#6366F1` (Indigo) |
| Font | Inter |
| Base font size | 14px |
| Border radius | 8px standard / 12px cards |
| Sidebar width | 240px |
| Max content width | 1200px |
| Spacing base | 4px |
| Card border | `1px solid #E5E7EB` |
| Shadow | Minimal — raised only on hover |
| Animation | Subtle, 150–300ms |
| Icon library | Lucide React |
| Component library | shadcn/ui + Tailwind CSS |

**The design's single most important rule:**

> Source citation cards must be the most visually prominent element after the AI answer itself.
> The user's ability to verify an answer is the product's core value — the design must reflect that.
