export interface Parcel {
  id: number;
  name: string;
  variety: string;
  area: number;
  vines: number;
  planted: number;
  location: string;
  notes: string;
}
export interface Campaign {
  id: number;
  year: number;
  name: string;
}
export interface RecordItem {
  id: number;
  parcel_id: number;
  campaign: number;
  kind: string;
  date: string;
  title: string;
  notes: string;
  cost: number;
  quantity: number;
  brix: number | null;
  product: string;
  dose: string;
  unit: string;
  completed: boolean;
}
export interface Data {
  parcels: Parcel[];
  campaigns: Campaign[];
  records: RecordItem[];
}

export interface PhotoItem {
  id: number;
  url: string;
}

/** Fields shared by the three editor forms; only the active form is submitted. */
export type EditorForm = Partial<
  Omit<Parcel & Campaign & RecordItem, "brix">
> & {
  brix?: number | "" | null;
};

export type NotebookEntity = Parcel | Campaign | RecordItem;
