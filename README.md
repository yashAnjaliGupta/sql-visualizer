# SQL Visualizer

An interactive, compiler-inspired visualizer for SQL queries, database schemas, and data insertions.

Transform complex SQL queries into intuitive relationship graphs, inspect table structures with visual schema cards, and explore data insertions with interactive data grids.

---

## 🌟 Overview

SQL Visualizer bridges the gap between text-based SQL and visual architecture diagrams. It parses SQL queries into Abstract Syntax Trees (AST) and renders them through dedicated, responsive visualization modes:

- **DQL (`SELECT`) Query Graphs**: Interactive flow diagrams illustrating table joins, subqueries, CTEs, aliases, and column data lineage.
- **DDL (`CREATE TABLE`) Schema Cards**: Visual cards showing column data types, primary keys, foreign key references, unique constraints, and defaults.
- **DML (`INSERT INTO`) Data Grids**: Clean tabular data viewers with syntax-colored data types (strings, numbers, booleans, NULLs) and expandable bulk row views.
- **Multi-Query & Mixed Mode**: Seamlessly run and visualize scripts containing `CREATE`, `INSERT`, and `SELECT` statements together.

---

## 🚀 Key Features

### 1. Interactive SELECT Query Flow Diagrams
- Built on **React Flow** with interactive panning, zooming, and node dragging.
- Visual mapping of all SQL join types (`INNER`, `LEFT`, `RIGHT`, `FULL OUTER`, `CROSS`).
- Automatic topological sort layout for clear left-to-right query dependency pipelines.
- Two-way interactive column highlighting between the graph and the Monaco-style code editor.
- CTE (`WITH` clause) and subquery support.

### 2. CREATE TABLE Schema Visualization
- Dedicated floating schema cards for table definitions.
- Syntax-colored data type badges (`INT`, `VARCHAR`, `DATETIME`, `DECIMAL`, `JSON`, `BOOLEAN`, etc.).
- Constraint badges: `PK` (Primary Key), `FK` (Foreign Key), `UQ` (Unique), `NOT NULL`, `AI` (Auto-Increment).
- Explicit Foreign Key reference indicators (`role_id → roles.id`).
- Inline default values and expressions (e.g. `= CURRENT_TIMESTAMP()`).

### 3. INSERT INTO Data Grid
- Interactive tabular display of values being inserted.
- Automatic column matching and fallback auto-numbering.
- Syntax-highlighted cell values: numbers in blue, strings in green, booleans in orange, NULL in red italics.
- Bulk row handling with compact preview (5 or 50 rows) and one-click expand/collapse.
- Support for `INSERT INTO ... SELECT` query sources.

### 4. Grouped vs. Per Query View Modes
When visualizing multi-statement scripts or mixed queries:
- **Grouped Mode (3 Consolidated Tabs)**:
  - **Schema Tab**: All `CREATE TABLE` definitions shown together as floating cards.
  - **Data Tab**: All `INSERT INTO` statements shown together with compact row truncation.
  - **Query Tab**: All `SELECT` queries unified into **one single canvas**, stacked vertically without cluttered screen splits.
- **Per Query Mode**: Every single statement gets its own dedicated tab with direct one-click switching.
- Easy segmented control toggle in the header controls bar.

### 5. Multi-Dialect SQL Support
Powered by `node-sql-parser`, supporting multiple database dialects:
- Transact-SQL (SQL Server / T-SQL)
- MySQL
- PostgreSQL
- SQLite
- BigQuery
- Oracle

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS & Modern Vanilla CSS
- **Graph Visualization**: `@xyflow/react` (React Flow)
- **SQL Parsing**: `node-sql-parser`
- **Build Tool**: Vite

---

## 📖 Supported SQL Constructs

| Category | Supported Syntax & Features |
|---|---|
| **Query (DQL)** | `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `ORDER BY`, `HAVING`, `LIMIT`, `UNION`, `UNION ALL` |
| **Joins** | `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL OUTER JOIN`, `CROSS JOIN`, self-joins, multiple join chains |
| **Advanced Querying** | Common Table Expressions (`WITH cte AS (...)`), subqueries in `FROM`/`WHERE`, table & column aliases |
| **Schema (DDL)** | `CREATE TABLE`, column types, `PRIMARY KEY`, `FOREIGN KEY ... REFERENCES`, `UNIQUE`, `NOT NULL`, `DEFAULT`, `AUTO_INCREMENT` |
| **Data (DML)** | `INSERT INTO ... VALUES (...)`, multi-row batch inserts, `INSERT INTO ... SELECT` |
| **Multi-Statement** | Mixed SQL scripts with semicolon-delimited statements executed in parallel |

---

## 💻 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd sql-visualizer

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📐 Pipeline Architecture

```text
SQL Script (SELECT, CREATE, INSERT)
             ↓
     node-sql-parser (AST)
             ↓
┌────────────────────┬────────────────────┬────────────────────┐
│   SELECT Queries   │   CREATE TABLE     │    INSERT INTO     │
│         ↓          │         ↓          │         ↓          │
│ Custom AST Walker  │   ddlExtractor     │  insertExtractor   │
│         ↓          │         ↓          │         ↓          │
│ Graph Generator    │ Schema Definitions │ Row / Column Sets  │
│         ↓          │         ↓          │         ↓          │
│ Topological Layout │    Schema Card     │     Data Grid      │
│         ↓          │         ↓          │         ↓          │
│ React Flow Canvas  │  CreateTableView   │    InsertView      │
└────────────────────┴────────────────────┴────────────────────┘
             ↓
  Unified Tabbed Viewer (Grouped or Per-Query Modes)
```

---

## 🔮 Roadmap

- [ ] Export diagrams as PNG, SVG, or JSON
- [ ] Schema-to-ERD relationship line connectors in Schema view
- [ ] Condition edge tooltips for complex `ON` / `WHERE` expressions
- [ ] Visual query execution plan / EXPLAIN cost analysis
- [ ] SQL formatter & auto-beautifier

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.