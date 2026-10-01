from datetime import date

from sqlalchemy import select

from app.models import Campaign, Parcel, Record


def seed(s):
    if s.scalar(select(Campaign)):
        return
    for y in [2024, 2025, 2026]:
        s.add(Campaign(year=y, name=f"Campaña {y}"))
    for p in [
        dict(
            name="El Bancal",
            variety="Monastrell",
            area=1.4,
            vines=3200,
            planted=2008,
            location="Ladera sur",
        ),
        dict(
            name="La Solana",
            variety="Garnacha",
            area=0.85,
            vines=1900,
            planted=2015,
            location="Camino de la Solana",
        ),
        dict(
            name="Los Olivos",
            variety="Syrah",
            area=1.1,
            vines=2500,
            planted=2012,
            location="Partida Los Olivos",
        ),
    ]:
        s.add(Parcel(**p))
    s.flush()
    parcels = list(s.scalars(select(Parcel)))
    for y, mult in [(2024, 0.85), (2025, 0.94), (2026, 1)]:
        for p, q, b in zip(parcels, [3840, 2180, 2960], [24.2, 23.1, 23.8]):
            s.add(
                Record(
                    parcel_id=p.id,
                    campaign=y,
                    kind="Vendimia",
                    date=date(y, 9, 18),
                    title="Vendimia manual",
                    quantity=round(q * mult),
                    unit="kg",
                    brix=b,
                    cost=round(q * 0.08),
                    notes="Uva seleccionada en campo",
                )
            )
    examples = [
        ("Riego", "Riego por goteo", 25, 3, 0, 18),
        ("Tratamiento", "Aplicación de azufre", 24, 0, 42, 0),
        ("Poda", "Revisión de formación", 21, 0, 65, 0),
        ("Tarea", "Revisar tutores", 30, 0, 0, 0),
        ("Tarea", "Limpiar equipo de vendimia", 30, 0, 0, 0),
    ]
    for i, (kind, title, d, q, c, b) in enumerate(examples):
        s.add(
            Record(
                parcel_id=parcels[i % 3].id,
                campaign=2026,
                kind=kind,
                date=date(2026, 9, d),
                title=title,
                quantity=q,
                unit="h" if kind == "Riego" else "",
                cost=c,
                product="Azufre" if kind == "Tratamiento" else "",
                dose="Según registro de aplicación" if kind == "Tratamiento" else "",
                completed=kind != "Tarea",
            )
        )
    s.commit()
