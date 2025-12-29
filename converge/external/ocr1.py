from pdf2image import convert_from_path
import pytesseract
import os

def extract_text_from_pdf(
    pdf_path,
    dpi=300,
    lang="eng"
):
    pages = convert_from_path(pdf_path, dpi=dpi)

    full_text = []

    for i, page in enumerate(pages):
        text = pytesseract.image_to_string(
            page,
            lang=lang,
            config="--oem 3 --psm 6"
        )
        full_text.append(text)

    return "\n".join(full_text)


if __name__ == "__main__":
    pdf_file = "RESUME_UJJWALCHORARIA.pdf"
    text = extract_text_from_pdf(pdf_file)
    base_name = os.path.splitext(os.path.basename(pdf_file))[0]
    output_txt = base_name + ".txt"

    with open(output_txt, "w", encoding="utf-8") as f:
        f.write(text)

    print("Text extracted → {output_txt}")
