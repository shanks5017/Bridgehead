Here is the Project Document Architecture (PDA) of "Bridgehead," formatted and condensed for inclusion in a project's `README.md` file.

-----

## 🌉 Bridgehead: Project Architecture Document (PDA)

Bridgehead is a two-sided web marketplace connecting hyper-local community **demands** (missing services/businesses) with **entrepreneurs** seeking commercial properties and AI-powered business suggestions.

### 1\. ⚙️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 19, TypeScript** | Component-based UI and type safety. |
| **Styling** | **Tailwind CSS** | Utility-first styling with custom theming. |
| **AI/API** | **Google Gemini API** | Generating location- and demand-specific business suggestions. |
| **Module System** | **ES Modules** | Browser-native module loading via `importmap`. |
| **Browser APIs** | **Geolocation API, FileReader API** | Location fetching and image processing (Base64). |

-----

### 2\. 📁 Project Structure & Organization

The project uses a component-based architecture with a clear separation of concerns:

```
/
├── index.html              # Main entry point and global config (importmap, styles).
├── index.tsx               # Application root.
├── types.ts                # Centralized interfaces (DemandPost, RentalPost) and enums (View).
├── services/
│   └── geminiService.ts    # Encapsulates all Gemini API calls.
└── components/
    ├── App.tsx             # Main component; manages state, routing, and data logic.
    ├── Header.tsx          # Global navigation.
    ├── DemandFeed.tsx      # Renders the demands feed.
    ├── PostDemandForm.tsx  # Form for submitting new demands.
    ├── AISuggestions.tsx   # AI-powered business idea generator component.
    ├── common/
    │   └── FormComponents.tsx # Reusable form elements (Input, TextArea).
    └── ... (other components like RentalListings, ImageViewer)
```

-----

### 3\. 🗺️ Component Architecture & Data Flow

#### **A. State Management & Routing**

  * **Centralized State:** All core application state (`demandPosts`, `rentalPosts`, `view`) is managed within the central **`App.tsx`** component using React's `useState` hook.
  * **Simple Routing:** View navigation is handled by a simple **switch statement** in `App.tsx` based on a `view` state enum, avoiding the need for a full routing library.

#### **B. Unidirectional Data Flow**

The application adheres to a unidirectional data flow pattern:

1.  **State Lives in `App.tsx`:** The single source of truth.
2.  **Data Passed Down:** Data (e.g., `demandPosts`) and callback functions (e.g., `addDemandPost`, `setView`) are passed down to child components via **props**.
3.  **Events Flow Up:** Child components (e.g., `PostDemandForm.tsx`) use the callback functions passed in props to notify `App.tsx` of user events (e.g., form submission).
4.  **Re-render:** `App.tsx` updates its state, triggering a re-render of affected components.

#### **C. Key Component Responsibilities**

| Component Category | Responsibility |
| :--- | :--- |
| **`App.tsx`** | Orchestrates state, logic, and view rendering. |
| **`*Feed.tsx`/`*Listings.tsx`** | **View Containers.** Handles page layout, including the full-screen hero section and category rows. Maps data to render `*Card.tsx` components. |
| **`*Card.tsx`** | **Display Components.** Presentational components for a single post. Manages micro-interactions and internal UI state (e.g., image carousels). |
| **`*Form.tsx`** | **Input Components.** Manages form state, handles user input, file reading, Geolocation fetching, and calls up the parent functions upon submission. |

-----

### 4\. 🧠 External Service Integration

  * **Google Gemini API:** Abstracted in `services/geminiService.ts`. The module is responsible for constructing detailed prompts using **user geolocation** and a summary of **existing demands** to generate hyper-local, formatted Markdown suggestions using the **`gemini-2.5-flash`** model.
  * **Geolocation API:** Used directly in forms and the `AISuggestions.tsx` component to provide crucial location context for data creation and AI prompting.