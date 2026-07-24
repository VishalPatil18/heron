"""Parse the three accepted inputs (.html, .eml, raw text) into one shape.

All parsers return {"subject": str, "body": str, "images": [PIL.Image]}.
The HTML extraction mirrors parse_html_email in the inference script, but reads
a string (uploads never touch disk) and only decodes inline data: images -
remote http image fetches are dropped on purpose (SSRF risk on a public upload
endpoint; the model handles zero images via a zeros tensor).
"""

import base64
from email import message_from_bytes
from email.policy import default as default_policy
from io import BytesIO

from bs4 import BeautifulSoup
from PIL import Image


def _extract_inline_images(soup):
    """Collect inline data:image images from a parsed HTML document."""
    images = []
    for img_tag in soup.find_all("img"):
        src = img_tag.get("src", "")
        if not src.startswith("data:image"):
            continue
        try:
            img_bytes = base64.b64decode(src.split(",", 1)[1])
            images.append(Image.open(BytesIO(img_bytes)).convert("RGB"))
        except Exception:
            continue
    return images


def parse_html(html_content):
    """Parse an HTML email string into {subject, body, images}."""
    soup = BeautifulSoup(html_content, "html.parser")

    subject = ""
    if soup.title and soup.title.string:
        subject = soup.title.string
    elif soup.h1:
        subject = soup.h1.get_text(strip=True)
    else:
        first_text = soup.find(["p", "div"])
        if first_text:
            subject = first_text.get_text(strip=True)[:100]

    images = _extract_inline_images(soup)

    for tag in soup(["script", "style"]):
        tag.decompose()
    body = soup.get_text(separator=" ", strip=True)

    return {"subject": subject, "body": body, "images": images}


def parse_eml(eml_bytes):
    """Parse a .eml byte payload; prefer its HTML part, else fall back to text."""
    message = message_from_bytes(eml_bytes, policy=default_policy)
    subject = message.get("subject", "") or ""

    html_part = message.get_body(preferencelist=("html",))
    if html_part is not None:
        parsed = parse_html(html_part.get_content())
        # Prefer the real email Subject header over the HTML <title>.
        parsed["subject"] = subject or parsed["subject"]
        return parsed

    text_part = message.get_body(preferencelist=("plain",))
    body = text_part.get_content() if text_part is not None else ""
    return {"subject": subject, "body": body, "images": []}


def parse_text(subject, body):
    """Wrap raw pasted text (no images) into the common shape."""
    return {"subject": subject or "", "body": body or "", "images": []}


def parse_upload(filename, raw):
    """Route an uploaded file by extension to the right parser.

    Raises ValueError for unsupported types or non-text (binary) content.
    """
    name = (filename or "").lower()
    if name.endswith(".eml"):
        return parse_eml(raw)

    if name.endswith((".html", ".htm", ".txt")):
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("File is not valid UTF-8 text") from exc
        if name.endswith(".txt"):
            return parse_text("", text)
        return parse_html(text)

    raise ValueError("Unsupported file type; upload .html, .eml, or .txt")
