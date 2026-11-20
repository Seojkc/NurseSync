// The prompt the user copies into ChatGPT / Gemini / Claude together with the roster photo.
export const buildPrompt = (name: string) => {
  const n = name.trim().toUpperCase();
  return `Look at the attached duty roster photo. Find the row for the staff member named "${n}" (match the name column only; there are East Wing and West Wing tables, so pick the row with that exact name).

Read that row's cell for every day of the month, lining each cell up with the date numbers in the header. Count the columns to be sure none are shifted.

Return ONLY a JSON object, with no explanation and no markdown code fences, in exactly this format:
{"month":"YYYY-MM","days":{"1":"CODE","2":"CODE"}}

Rules:
- "month" comes from the roster title (e.g. NOVEMBER - 2026 becomes "2026-11").
- Include every day of the month as a key, as a string "1", "2", and so on.
- Each value is the text written in that cell, copied exactly (A, B, C, D1, D2, OFF, CL, EL, RH). Do not explain or translate what a code means.
- If a handwritten pen correction is written over a cell, use the handwritten value if it is clearly legible.
- If a cell is blank, crossed out, smudged, or you are not confident, use "" (empty string). Never guess.`;
};
