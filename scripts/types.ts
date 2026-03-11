export interface EventFrontmatter {
  title: string;
  date: Date;
  youtube?: string;
  imageUrl?: string;
  description?: string;
  event_type?: "PHYSICAL" | "ONLINE" | "HYBRID";
  venues?: string[];
  event_url?: string;
  status?: "DRAFT" | "ACTIVE" | "PAST";
  event_id?: string | number;
}
