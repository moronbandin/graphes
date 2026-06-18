"""Interface editorial local de Graphes.

Executar con:
    streamlit run script.py
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime
from pathlib import Path

import streamlit as st
from PIL import Image, ImageOps


ROOT = Path(__file__).parent
DATA_FILE = ROOT / "data" / "gallery.json"
IMAGES_DIR = ROOT / "assets" / "images"
MAX_IMAGE_SIDE = 2200


def load_records() -> list[dict]:
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug[:70] or f"graphes-{datetime.now():%Y%m%d-%H%M%S}"


def unique_slug(base: str, records: list[dict]) -> str:
    used = {record["id"] for record in records}
    if base not in used:
        return base
    number = 2
    while f"{base}-{number}" in used:
        number += 1
    return f"{base}-{number}"


def save_record(upload, record: dict) -> Path:
    image_path = IMAGES_DIR / record["file"]
    temporary_image = image_path.with_suffix(".tmp.webp")
    temporary_json = DATA_FILE.with_suffix(".tmp.json")

    image = Image.open(upload)
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)
    image.save(temporary_image, "WEBP", quality=86, method=6)

    records = load_records()
    records.append(record)
    temporary_json.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    temporary_image.replace(image_path)
    temporary_json.replace(DATA_FILE)
    return image_path


st.set_page_config(
    page_title="Graphes · Mesa editorial",
    page_icon="Γ",
    layout="wide",
)

st.title("γραφές · Mesa editorial")
st.caption("Incorpora unha nova imaxe ao arquivo, xa optimizada e coa ficha completa.")

records = load_records()
st.info(f"A colección contén agora **{len(records)} voces**.")

uploaded = st.file_uploader(
    "1 · Escolle unha imaxe",
    type=["jpg", "jpeg", "png", "webp", "heic"],
    help="A imaxe converterase a WEBP e reducirase a un máximo de 2200 px.",
)

if uploaded:
    left, right = st.columns([1, 1.25], gap="large")

    with left:
        try:
            preview = ImageOps.exif_transpose(Image.open(uploaded))
            st.image(preview, caption=uploaded.name, use_container_width=True)
            st.caption(f"{preview.width} × {preview.height} px · {uploaded.size / 1024 / 1024:.1f} MB")
        except Exception as error:
            st.error(f"Non foi posible ler a imaxe: {error}")
            st.stop()

    with right:
        with st.form("new_record", clear_on_submit=False):
            st.subheader("2 · Documenta a voz")
            text = st.text_area("Texto en grego *", placeholder="Η ζωή…")
            transcription = st.text_input("Transcrición ou lectura", placeholder="I zoí…")

            place_col, year_col = st.columns([2, 1])
            place = place_col.text_input("Lugar *", placeholder="Atenas, Exarchia")
            year = year_col.text_input("Ano", placeholder="2026", max_chars=4)

            category = st.text_input(
                "Categoría *",
                placeholder="léxico e sociedade",
                help="Emprega unha categoría existente ou crea unha nova se está xustificado.",
            )
            etymology = st.text_area(
                "Da lingua antiga á moderna *",
                placeholder="Etimoloxía, evolución e formas relacionadas…",
                height=130,
            )
            comment = st.text_area(
                "Lectura e contexto *",
                placeholder="Tradución, contexto social ou cultural e relevancia da peza…",
                height=150,
            )

            suggested_slug = slugify(transcription or text or Path(uploaded.name).stem)
            file_slug = st.text_input(
                "Identificador do ficheiro",
                value=suggested_slug,
                help="Só minúsculas, números e guións. Engadirase automaticamente un número se xa existe.",
            )

            submitted = st.form_submit_button(
                "Incorporar ao arquivo",
                type="primary",
                use_container_width=True,
            )

        if submitted:
            required = {
                "texto en grego": text,
                "lugar": place,
                "categoría": category,
                "etimoloxía": etymology,
                "lectura e contexto": comment,
            }
            missing = [name for name, value in required.items() if not value.strip()]
            if missing:
                st.error("Faltan campos obrigatorios: " + ", ".join(missing) + ".")
            elif year and not re.fullmatch(r"(19|20)\d{2}", year):
                st.error("O ano debe ter catro cifras entre 1900 e 2099.")
            else:
                clean_slug = unique_slug(slugify(file_slug), records)
                location = ", ".join(part for part in (place.strip(), year.strip()) if part)
                record = {
                    "id": clean_slug,
                    "file": f"{clean_slug}.webp",
                    "text": text.strip(),
                    "transcription": transcription.strip(),
                    "etymology": etymology.strip(),
                    "comment": comment.strip(),
                    "category": category.strip(),
                    "location": location,
                }
                try:
                    output = save_record(uploaded, record)
                except Exception as error:
                    st.error(f"Non se puido gardar a achega: {error}")
                else:
                    st.success(f"Voz incorporada correctamente como `{output.name}`.")
                    st.json(record)
                    st.caption("Xa podes revisar a web e confirmar os cambios con Git.")

with st.expander("Verificar a colección actual"):
    query = st.text_input("Buscar por texto, lugar ou categoría")
    normalized_query = query.casefold().strip()
    matches = [
        record for record in records
        if not normalized_query
        or normalized_query in " ".join(
            (record["text"], record["location"], record["category"])
        ).casefold()
    ]
    st.dataframe(
        [
            {
                "Texto": item["text"],
                "Lugar": item["location"],
                "Categoría": item["category"],
                "Ficheiro": item["file"],
            }
            for item in matches
        ],
        use_container_width=True,
        hide_index=True,
    )
