# PDF Drawing Annotator

A full-stack Next.js application for uploading, viewing, and annotating multi-page PDFs.

## Features

- Upload and view multi-page PDF files
- Navigate between PDF pages
- Draw rectangular annotations on PDF pages
- Save annotations to a database
- View existing annotations for each page

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: Custom components based on shadcn/ui
- **PDF Handling**: react-pdf
- **Database**: Prisma with SQLite (easily switchable to PostgreSQL, MySQL, etc.)
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pdf-annotator.git
   cd pdf-annotator
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the "Upload Architectural PDF" button to select a PDF file.
2. Once uploaded, the PDF will be displayed in the viewer.
3. Navigate between pages using the "Previous" and "Next" buttons.
4. Draw annotations by clicking and dragging on the PDF.
5. Annotations are automatically saved to the database.

## Project Structure

- `/app`: Next.js App Router pages and API routes
- `/components`: React components
- `/lib`: Utility functions and database client
- `/prisma`: Database schema and migrations
- `/types`: TypeScript type definitions

## API Endpoints

- `GET /api/annotations/{pdfId}?pageNumber={pageNumber}`: Get annotations for a specific PDF page
- `POST /api/annotations/{pdfId}`: Create a new annotation

## Future Enhancements

See the [roadmap.md](./roadmap.md) file for planned future enhancements.

## License

MIT
