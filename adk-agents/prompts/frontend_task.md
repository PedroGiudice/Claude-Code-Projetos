You are the Frontend Commander. Your task is to implement the frontend UI for the new "LEDES Converter" module in the `legal-workbench` application.

**Context:**
A backend service for converting DOCX to LEDES is already implemented (`/api/ledes/convert/docx-to-ledes`).
The frontend is a React application using Vite and Tailwind CSS.
State management uses Zustand.

**Objectives:**
1.  **Review Existing Code:** Look at `legal-workbench/frontend/src/pages/LedesConverterModule.tsx` and `legal-workbench/frontend/src/store/ledesConverterStore.ts` (I have already created preliminary versions).
2.  **Refine UI:** Enhance `LedesConverterModule.tsx` to be more polished, ensuring it matches the "text-extractor" look and feel but simpler. Use existing UI components from `src/components/ui`.
3.  **Ensure Functionality:** Verify the store logic (`ledesConverterStore.ts`) correctly handles the file upload and displays the result text area.
4.  **Integration:** Ensure the API call in `ledesConverterApi.ts` is correct.

If the existing files are good, confirm them. If they need improvement (better styling, error handling, loading states), please rewrite them.

**Files to modify:**
- `legal-workbench/frontend/src/pages/LedesConverterModule.tsx`
- `legal-workbench/frontend/src/store/ledesConverterStore.ts`
