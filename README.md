# EcoShift – Carbon Footprint Tracker

> Track, understand, and reduce your daily carbon footprint with real-time CO₂ calculations and personalized reduction insights.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)](https://firebase.google.com)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-6E9F18?logo=vitest)](https://vitest.dev)

---

## Features

- **Activity Logging** — Log transport activities (car, bus, train, bicycle, walking) with distance-based CO₂ calculations
- **Real-Time Insights** — Interactive pie chart breakdown of emissions by category
- **Personalized Recommendations** — Data-driven suggestions based on your activity patterns
- **Comparison Metrics** — See how you compare to the national average footprint
- **Authentication** — Firebase Auth with email/password and anonymous guest login
- **Google Analytics** — Event tracking for activity logging, page views, and goal creation
- **Accessible** — WCAG 2.1 AA compliant with keyboard navigation, ARIA labels, and semantic HTML
- **Premium Design** — Glassmorphism dark theme with animated interactions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 8 |
| Backend | Firebase (Auth, Firestore, Analytics) |
| Styling | Vanilla CSS (Glassmorphism design system) |
| Forms | Formik + Yup validation |
| Charts | Recharts |
| Testing | Vitest + Testing Library + Playwright |

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A Firebase project ([create one here](https://console.firebase.google.com))

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd EcoShift

# Install dependencies
npm install

# Copy environment template and fill in your Firebase config
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Development

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Project Structure

```
src/
├── components/          # React UI components
│   ├── ActivityForm.tsx   # Carbon activity logging form
│   ├── Dashboard.tsx      # Main dashboard with insights
│   ├── InsightsChart.tsx   # Pie chart for emission breakdown
│   └── tests/             # Component tests
├── constants/           # App constants
│   └── emissions.ts       # CO₂ emission factors (transport, food, home)
├── hooks/               # Custom React hooks
│   ├── useAuth.ts         # Firebase authentication state
│   ├── useActivities.ts   # Firestore activity fetching
│   └── tests/             # Hook tests
├── services/            # Business logic & external services
│   ├── carbonCalculator.ts  # CO₂ calculation engine
│   ├── firebase.ts          # Firebase initialization
│   ├── firebaseDB.ts        # Firestore CRUD operations
│   ├── googleAnalytics.ts   # GA4 event tracking
│   └── tests/               # Service tests
├── test/                # Test configuration
│   └── setup.ts           # Vitest global setup & mocks
├── types/               # TypeScript type definitions
│   └── index.ts           # Activity, User, enums
├── App.tsx              # Root component with auth flow
├── index.css            # Global styles (design system)
└── main.tsx             # Application entry point
```

## CO₂ Emission Factors

| Activity | Factor | Unit |
|----------|--------|------|
| Car | 0.25 | kg CO₂/km |
| Bus | 0.05 | kg CO₂/km |
| Train | 0.02 | kg CO₂/km |
| Bicycle | 0 | kg CO₂/km |
| Walking | 0 | kg CO₂/km |

## Security

- Firebase Authentication for user identity
- Firestore Security Rules restrict data access to authenticated users
- Environment variables for all sensitive configuration
- Input validation via Yup schemas (max distance, required fields)
- `noValidate` on forms to ensure server-side validation runs

## Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML5 elements (`<main>`, `<header>`, `<section>`, `<fieldset>`)
- ARIA labels on interactive elements
- `role="alert"` for form errors (live announcements)
- Keyboard-navigable with visible focus indicators (`:focus-visible`)
- Screen reader support with `.sr-only` utility class

## License

MIT
