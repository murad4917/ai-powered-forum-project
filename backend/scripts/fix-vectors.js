import dotenv from "dotenv";
dotenv.config();
import { db } from "../db/config.js";

async function fixVectors() {
  const expectedDim = 768;

  const [qvRows] = await db.query(
    `SELECT vector_id, embedding FROM question_vectors WHERE status = 'ready'`
  );

  let fixedQuestions = 0;
  for (const row of qvRows) {
    try {
      const embedding =
        typeof row.embedding === "string"
          ? JSON.parse(row.embedding)
          : row.embedding;
      const len = Array.isArray(embedding) ? embedding.length : -1;
      if (len !== expectedDim) {
        await db.query(
          `UPDATE question_vectors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE vector_id = ?`,
          ["failed", row.vector_id]
        );
        fixedQuestions++;
      }
    } catch {
      await db.query(
        `UPDATE question_vectors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE vector_id = ?`,
        ["failed", row.vector_id]
      );
      fixedQuestions++;
    }
  }

  const [cvRows] = await db.query(
    `SELECT chunk_vector_id, embedding FROM document_chunk_vectors WHERE status = 'ready'`
  );

  let fixedDocs = 0;
  for (const row of cvRows) {
    try {
      const embedding =
        typeof row.embedding === "string"
          ? JSON.parse(row.embedding)
          : row.embedding;
      const len = Array.isArray(embedding) ? embedding.length : -1;
      if (len !== expectedDim) {
        await db.query(
          `UPDATE document_chunk_vectors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE chunk_vector_id = ?`,
          ["failed", row.chunk_vector_id]
        );
        fixedDocs++;
      }
    } catch {
      await db.query(
        `UPDATE document_chunk_vectors SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE chunk_vector_id = ?`,
        ["failed", row.chunk_vector_id]
      );
      fixedDocs++;
    }
  }

  console.log(`Fixed ${fixedQuestions} question_vectors.`);
  console.log(`Fixed ${fixedDocs} document_chunk_vectors.`);
  process.exit(0);
}

fixVectors().catch((err) => {
  console.error("Failed to fix vectors:", err);
  process.exit(1);
});
