import "./env";

import { TOPICS } from "../../../packages/shared/src";
import { createIngestJob, finishIngestJob, pool, runRetentionPolicy, seedTopics, upsertPaper } from "./db";
import { fetchPaperDetails, matchTopicsFromText, searchPmids } from "./pubmed";

async function runSeed() {
  await seedTopics();
  console.log(`Seeded ${TOPICS.length} topics.`);
}

async function runSync() {
  await seedTopics();

  for (const topic of TOPICS) {
    const windowEnd = new Date();
    const windowStart = new Date(Date.now() - 7 * 86_400_000);
    const jobId = await createIngestJob(topic.id, windowStart, windowEnd);

    try {
      const pmids = await searchPmids(topic, 7);
      const papers = await fetchPaperDetails(pmids);

      let inserted = 0;
      let updated = 0;

      for (const paper of papers) {
        const matchedTopicIds = new Set([topic.id, ...matchTopicsFromText(`${paper.title} ${paper.abstractText}`)]);
        const result = await upsertPaper({
          sourceId: paper.sourceId,
          title: paper.title,
          journal: paper.journal,
          publishedAt: paper.publishedAt,
          articleType: paper.articleType,
          doi: paper.doi,
          doiUrl: paper.doiUrl,
          sourceUrl: paper.sourceUrl,
          abstractAvailable: paper.abstractAvailable,
          openAccess: paper.openAccess,
          topicIds: [...matchedTopicIds],
          authors: paper.authors,
          snapshot: paper.snapshot
        });

        if (result.inserted) {
          inserted += 1;
        } else {
          updated += 1;
        }
      }

      await finishIngestJob(jobId, {
        itemsSeen: papers.length,
        itemsInserted: inserted,
        itemsUpdated: updated
      });
      console.log(`Synced ${topic.id}: ${papers.length} papers`);
    } catch (error) {
      await finishIngestJob(jobId, {
        itemsSeen: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown ingest error"
      });
      throw error;
    }
  }
}

async function runRetention() {
  const result = await runRetentionPolicy();
  console.log(`Retention complete. Deleted ${result.snapshotsDeleted} snapshots and ${result.papersDeleted} papers.`);
}

const command = process.argv[2] ?? "sync";

try {
  if (command === "seed") {
    await runSeed();
  } else if (command === "retention") {
    await runRetention();
  } else {
    await runSync();
  }
} finally {
  await pool.end();
}
