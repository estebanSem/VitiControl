import csv
import io

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Parcel, Record


def export(campaign: int, s: Session):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "Fecha",
            "Parcela",
            "Tipo",
            "Título",
            "Coste EUR",
            "Cantidad",
            "Unidad",
            "Brix",
            "Producto",
            "Dosis",
            "Observaciones",
        ]
    )

    def safe(v):
        text = str(v or "")
        return "'" + text if text.startswith(("=", "+", "-", "@", "\t", "\r")) else text

    for r in s.scalars(
        select(Record).where(Record.campaign == campaign).order_by(Record.date)
    ):
        writer.writerow(
            [
                safe(v)
                for v in [
                    r.date,
                    s.get(Parcel, r.parcel_id).name,
                    r.kind,
                    r.title,
                    r.cost,
                    r.quantity,
                    r.unit,
                    r.brix,
                    r.product,
                    r.dose,
                    r.notes,
                ]
            ]
        )
    return Response(
        "\ufeff" + buf.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="campana-{campaign}.csv"'
        },
    )
