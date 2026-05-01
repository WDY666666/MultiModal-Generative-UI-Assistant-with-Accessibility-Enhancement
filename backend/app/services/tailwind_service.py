import subprocess
import tempfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
FRONTEND_DIR = PROJECT_ROOT / "frontend"

BASE_CSS = """@tailwind base;
@tailwind components;
@tailwind utilities;
"""

PREVIEW_BASE_CSS = """html,
body,
#root {
  width: 100%;
  min-height: 100vh;
  margin: 0;
}

body {
  overflow-x: hidden;
  background: #fff;
}

* {
  box-sizing: border-box;
}
"""


def _tailwind_binary() -> Path:
    command = "tailwindcss.cmd" if __import__("os").name == "nt" else "tailwindcss"
    return FRONTEND_DIR / "node_modules" / ".bin" / command


def compile_tailwind_css(code: str) -> str:
    """Compile Tailwind classes used by generated TSX into plain CSS for Sandpack."""
    binary = _tailwind_binary()
    if not binary.exists():
        return PREVIEW_BASE_CSS

    with tempfile.TemporaryDirectory(prefix="ui-assistant-tailwind-") as tmp:
        tmp_dir = Path(tmp)
        input_css = tmp_dir / "input.css"
        content_file = tmp_dir / "content.tsx"
        output_css = tmp_dir / "output.css"

        input_css.write_text(BASE_CSS, encoding="utf-8")
        content_file.write_text(code, encoding="utf-8")

        try:
            subprocess.run(
                [
                    str(binary),
                    "-i",
                    str(input_css),
                    "-o",
                    str(output_css),
                    "--content",
                    str(content_file),
                    "--minify",
                ],
                cwd=FRONTEND_DIR,
                capture_output=True,
                text=True,
                timeout=15,
                check=True,
            )
        except Exception:
            return PREVIEW_BASE_CSS

        compiled = output_css.read_text(encoding="utf-8") if output_css.exists() else ""
        return f"{PREVIEW_BASE_CSS}\n{compiled}".strip()
