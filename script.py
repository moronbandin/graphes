import streamlit as st
from PIL import Image
import io, zipfile, json
from datetime import datetime

st.set_page_config(page_title="Graphes Image Converter", layout="wide")

st.title("🖼️ Conversor de imaxes a WEBP · Graphes")

uploaded_files = st.file_uploader(
    "Sube aquí as túas fotos (JPG, PNG...)", accept_multiple_files=True, type=["jpg", "jpeg", "png"]
)

if uploaded_files:
    st.write("### Previsualización e nomes")
    new_names = {}
    cols = st.columns(3)

    for i, file in enumerate(uploaded_files):
        img = Image.open(file)
        col = cols[i % 3]
        col.image(img, use_column_width=True)
        default_name = file.name.rsplit(".", 1)[0]
        new_name = col.text_input(f"Nome para {file.name}", value=default_name, key=f"name_{i}")
        new_names[file.name] = new_name

    if st.button("📦 Converter e descargar lote"):
        zip_buffer = io.BytesIO()
        json_entries = []

        with zipfile.ZipFile(zip_buffer, "w") as z:
            for file in uploaded_files:
                name = new_names[file.name]
                img = Image.open(file).convert("RGB")

                webp_bytes = io.BytesIO()
                img.save(webp_bytes, format="WEBP", quality=85)
                webp_bytes.seek(0)

                filename = f"{name}.webp"
                z.writestr(filename, webp_bytes.read())

                json_entries.append({
                    "id": name,
                    "file": filename,
                    "text": "",
                    "transcription": "",
                    "etymology": "",
                    "comment": "",
                    "category": "",
                    "location": ""
                })

            z.writestr("gallery_template.json", json.dumps(json_entries, ensure_ascii=False, indent=2))

        zip_buffer.seek(0)
        st.download_button(
            label="⬇️ Descargar ZIP con imaxes + JSON",
            data=zip_buffer,
            file_name=f"graphes_images_{datetime.now().strftime('%Y%m%d')}.zip",
            mime="application/zip"
        )
