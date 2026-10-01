import { Data, Parcel, RecordItem } from "../models/vineyard.models";
export function seedData(): Data {
  const parcels: Parcel[] = [
    {
      id: 1,
      name: "El Bancal",
      variety: "Monastrell",
      area: 1.4,
      vines: 3200,
      planted: 2008,
      location: "Ladera sur",
      notes: "Cepas en vaso. Orientación sur.",
    },
    {
      id: 2,
      name: "La Solana",
      variety: "Garnacha",
      area: 0.85,
      vines: 1900,
      planted: 2015,
      location: "Camino de la Solana",
      notes: "Conducción en espaldera.",
    },
    {
      id: 3,
      name: "Los Olivos",
      variety: "Syrah",
      area: 1.1,
      vines: 2500,
      planted: 2012,
      location: "Partida Los Olivos",
      notes: "Suelo calizo.",
    },
  ];
  const records: RecordItem[] = [];
  let id = 1;
  for (const [year, mult] of [
    [2024, 0.85],
    [2025, 0.94],
    [2026, 1],
  ])
    parcels.forEach((p, i) =>
      records.push({
        id: id++,
        parcel_id: p.id,
        campaign: year,
        kind: "Vendimia",
        date: `${year}-09-18`,
        title: "Vendimia manual",
        quantity: Math.round([3840, 2180, 2960][i] * mult),
        unit: "kg",
        brix: [24.2, 23.1, 23.8][i],
        cost: Math.round([3840, 2180, 2960][i] * 0.08),
        notes: "Uva seleccionada en campo",
        product: "",
        dose: "",
        completed: true,
      }),
    );
  [
    ["Riego", "Riego por goteo", 25, 3, 0],
    ["Tratamiento", "Aplicación de azufre", 24, 0, 42],
    ["Poda", "Revisión de formación", 21, 0, 65],
    ["Tarea", "Revisar tutores", 30, 0, 0],
    ["Tarea", "Limpiar equipo de vendimia", 30, 0, 0],
  ].forEach(([kind, title, day, qty, cost], i) =>
    records.push({
      id: id++,
      parcel_id: (i % 3) + 1,
      campaign: 2026,
      kind: String(kind),
      date: `2026-09-${day}`,
      title: String(title),
      quantity: Number(qty),
      unit: kind === "Riego" ? "h" : "",
      brix: null,
      cost: Number(cost),
      notes: "",
      product: kind === "Tratamiento" ? "Azufre" : "",
      dose: kind === "Tratamiento" ? "Según registro de aplicación" : "",
      completed: kind !== "Tarea",
    }),
  );
  return {
    parcels,
    campaigns: [2026, 2025, 2024].map((year) => ({
      id: year,
      year,
      name: `Campaña ${year}`,
    })),
    records,
  };
}
