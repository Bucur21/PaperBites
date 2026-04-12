alter table paper_summaries
  add column if not exists takeaway text;

alter table paper_summaries
  add column if not exists clinical_impact text;

alter table paper_summaries
  add column if not exists method_quality text;

alter table paper_summaries
  add column if not exists who_its_for text;
