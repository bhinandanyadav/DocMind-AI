"""Web scraping utilities for extracting text from research sites and other URLs."""

import ipaddress
import re
import tempfile
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from app.config import settings
from app.services.parser import parse_pdf, parse_txt


def _is_pdf_url(url: str, headers: dict) -> bool:
    """Check if URL points to a PDF file."""
    # Check extension
    if url.lower().endswith('.pdf'):
        return True
    # Check Content-Type header
    content_type = headers.get('content-type', '').lower()
    return 'application/pdf' in content_type


def _is_private_host(hostname: str) -> bool:
    """Check if hostname resolves to a private or loopback IP address."""
    # Localhost and loopback
    if hostname in {'localhost', '127.0.0.1', '::1', '0.0.0.0'}:
        return True
    # Try to parse as IP
    try:
        ip = ipaddress.ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
    except ValueError:
        pass
    # Could resolve DNS to check private IPs; for simplicity just block common local names
    return False


def validate_url(url: str) -> None:
    """Validate that URL is HTTP/HTTPS and not pointing to private/internal addresses."""
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError("Only HTTP/HTTPS URLs are allowed")
    if not parsed.netloc:
        raise ValueError("Invalid URL: missing host")
    if _is_private_host(parsed.netloc.split(':')[0]):
        raise ValueError("URLs pointing to private/internal addresses are not allowed")


def fetch_url_content(url: str) -> Tuple[str, str, Optional[str]]:
    """
    Fetch and extract text content from a URL.

    Returns:
        Tuple of (title, extracted_text, authors)
    """
    validate_url(url)

    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'DocMind AI Web Scraper 1.0 (+https://github.com/your-repo)'
        })
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to fetch URL {url}: {exc}")

    # Determine if PDF
    if _is_pdf_url(url, response.headers):
        # Save PDF to temp file and parse
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(response.content)
            pdf_path = tmp.name
        try:
            parsed = parse_pdf(pdf_path, document_id="temp")
            title = "Web PDF"
            text = parsed.full_text
            authors = None
        finally:
            Path(pdf_path).unlink(missing_ok=True)
    else:
        # Parse HTML
        soup = BeautifulSoup(response.content, 'lxml')

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()

        # Try to get title from <title> tag or og:title
        title_tag = soup.find('title')
        title = title_tag.get_text().strip() if title_tag else "Web Page"
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            title = og_title['content'].strip()

        # Extract main text: prefer <article>, then <main>, then body
        main = soup.find('article') or soup.find('main') or soup.body
        if main:
            text = main.get_text(separator='\n', strip=True)
        else:
            text = soup.get_text(separator='\n', strip=True)

        # Clean up excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)

        # Try to extract authors from meta tags
        authors = None
        author_meta = soup.find('meta', attrs={'name': 'author'}) or \
                     soup.find('meta', property='article:author')
        if author_meta and author_meta.get('content'):
            authors = author_meta['content'].strip()
        else:
            # Look for common patterns
            author_tag = soup.find(class_=re.compile('author', re.I))
            if author_tag:
                authors = author_tag.get_text().strip()

    return title, text, authors


def save_web_content_as_document(title: str, text: str, source_url: str) -> Tuple[str, str]:
    """
    Save extracted web content as a temporary .txt file for processing.

    Returns:
        Tuple of (file_path, file_type) where file_type is 'txt'.
    """
    # Create temp directory
    temp_dir = Path(settings.UPLOAD_DIR) / "web_temp"
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Generate safe filename from title
    safe_title = re.sub(r'[^\w\-_.]', '_', title)[:100]
    if not safe_title:
        safe_title = "web_document"

    file_path = temp_dir / f"{safe_title}.txt"

    # Write content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(f"Source URL: {source_url}\n")
        f.write(f"Title: {title}\n\n")
        f.write(text)

    return str(file_path), "txt"