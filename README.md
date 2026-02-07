# Power Platform System Blueprint (PPSB)

**Complete architectural blueprints for your Power Platform systems**

PPSB is a documentation tool that runs inside PPTB Desktop, providing comprehensive architectural documentation and analysis of your Power Platform environments.

## Project Structure

This is a pnpm monorepo with the following packages:

```
power-platform-solution-blueprint/
├── packages/
│   ├── core/                 # @ppsb/core - Pure TypeScript core library
│   │   ├── src/
│   │   │   ├── types.ts                    # Core type definitions
│   │   │   ├── dataverse/
│   │   │   │   ├── IDataverseClient.ts     # Client interface
│   │   │   │   └── PptbDataverseClient.ts  # PPTB implementation
│   │   │   ├── discovery/
│   │   │   │   ├── PublisherDiscovery.ts   # Publisher discovery
│   │   │   │   └── SolutionDiscovery.ts    # Solution discovery
│   │   │   └── index.ts                    # Main exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── pptb-tool/            # @ppsb/pptb - React UI tool
│       ├── src/
│       │   ├── App.tsx                     # Main application
│       │   ├── main.tsx                    # Entry point
│       │   └── types/
│       │       └── pptb.d.ts               # PPTB API types
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── package.json              # Monorepo root
├── pnpm-workspace.yaml       # pnpm workspace config
└── README.md                 # This file
```

## Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PPTB Desktop (Power Platform Toolbox Desktop)

### Installation

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build all packages**:
   ```bash
   pnpm build
   ```

## Development

### Run in development mode:
```bash
pnpm dev
```

This will start the Vite dev server for the PPTB tool.

### Build all packages:
```bash
pnpm build
```

### Type checking:
```bash
pnpm typecheck
```

### Clean build artifacts:
```bash
pnpm clean
```

## Running in PPTB Desktop

1. **Build the project**:
   ```bash
   pnpm build
   ```

2. **Locate the built files**:
   - The built tool will be in `packages/pptb-tool/dist/`

3. **Load in PPTB Desktop**:
   - Open PPTB Desktop
   - Navigate to the Tools section
   - Add a new custom tool pointing to the `dist/index.html` file
   - The tool will now have access to `window.toolboxAPI` for Dataverse operations

4. **Use the tool**:
   - Click "Load Publishers & Solutions" to fetch data from your connected environment
   - The tool will display all custom publishers and visible solutions

## Package Details

### @ppsb/core

Pure TypeScript library with no UI dependencies. Provides:

- **Type Definitions**: Publisher, Solution, EntityMetadata
- **Dataverse Client**: OData query interface with PPTB integration
- **Discovery Services**: Publisher and Solution discovery with filtering and ordering

**Key Features**:
- Strict TypeScript with full type safety
- Clean separation from UI concerns
- Extensible architecture for adding more discovery services
- Proper error handling and async/await patterns

### @ppsb/pptb

React 18 + Vite + Fluent UI v9 tool for PPTB Desktop. Provides:

- Modern React UI with Fluent Design System
- Integration with @ppsb/core for data access
- Loading states and error handling
- Responsive layout with side-by-side data views

**Technology Stack**:
- React 18 with TypeScript
- Vite for fast development and optimized builds
- Fluent UI React v9 components
- Strict mode enabled for better development experience

## Features

### Current Features

- ✅ Fetch all custom publishers from Dataverse
- ✅ Fetch all visible solutions with publisher information
- ✅ Display in organized, scrollable lists
- ✅ Loading states with spinner
- ✅ Error handling with user-friendly messages
- ✅ Fluent UI design system integration

### Coming Soon

- 📋 Entity metadata discovery
- 🔍 Advanced filtering and search
- 📊 Dependency graphs
- 📄 Export blueprints to various formats
- 🎨 Enhanced visualizations

## Architecture

The project follows a clean architecture pattern:

1. **Core Layer** (`@ppsb/core`):
   - Pure TypeScript, no framework dependencies
   - Interfaces for extensibility (IDataverseClient)
   - Business logic and data models
   - Can be used in any JavaScript/TypeScript environment

2. **Presentation Layer** (`@ppsb/pptb`):
   - React-based UI
   - Consumes @ppsb/core for all business logic
   - Provides PPTB-specific integration via window.toolboxAPI
   - Fluent UI for consistent Microsoft 365 design

## Contributing

This is an internal tool. For questions or issues, please contact the development team.

## License

MIT
