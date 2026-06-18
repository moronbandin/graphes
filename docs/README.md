# Γραφές · O grego que se ve

Arquivo visual e educativo de pintadas, cartaces e sinais en grego moderno, lidos en
diálogo coa lingua e a cultura antigas.

## Abrir a web

Ao cargar os datos con `fetch`, a web debe servirse por HTTP:

```bash
python3 -m http.server 8000
```

Despois abre `http://localhost:8000`.

## Incorporar unha imaxe desde a interface editorial

Instala as dependencias e abre a mesa editorial:

```bash
python3 -m pip install -r requirements.txt
streamlit run script.py
```

A interface:

- previsualiza e valida a foto;
- corrixe a orientación EXIF;
- converte a WEBP e limita o lado maior a 2200 px;
- evita identificadores duplicados;
- engade a ficha a `data/gallery.json`;
- garda a imaxe en `assets/images/`.

O cambio queda no repositorio local para revisalo antes de facer commit.

## Achegas desde a web pública

O formulario público mantén a imaxe no dispositivo ata que a persoa decide enviala.
En móbiles compatibles abre o menú nativo para compartir a foto e a ficha JSON. Como
alternativa, descarga a ficha e prepara unha proposta no repositorio de GitHub, onde
se pode adxuntar a imaxe.

## Estrutura dunha ficha

```json
{
  "id": "identificador-unico",
  "file": "identificador-unico.webp",
  "text": "Texto en grego",
  "transcription": "Lectura ou transcrición",
  "etymology": "Relación lingüística coa antigüidade",
  "comment": "Tradución, contexto e lectura",
  "category": "léxico e sociedade",
  "location": "Atenas, 2026"
}
```

As ligazóns en `etymology` e `comment` poden escribirse en Markdown:
`[texto](https://exemplo.org)`. Tamén se admiten `**negra**` e `*cursiva*`.
