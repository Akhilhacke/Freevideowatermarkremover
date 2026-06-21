import os, sys, uuid, traceback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from services.image_processor import remove_watermark_image

router = APIRouter()

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif"}


@router.post("/remove")
async def remove_image_watermark(
    file: UploadFile = File(...),
    method: str = Form("inpaint"),
    x: float = Form(None),
    y: float = Form(None),
    w: float = Form(None),
    h: float = Form(None),
):
    if not file.filename:
        raise HTTPException(400, "Filename is required")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported image extension: .{ext}")

    input_id = str(uuid.uuid4())
    input_path = f"uploads/{input_id}.{ext}"
    output_path = f"outputs/{input_id}_clean.{ext}"

    coords = None
    if all(v is not None for v in (x, y, w, h)):
        coords = {"x": x, "y": y, "w": w, "h": h}

    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)
        remove_watermark_image(input_path, output_path, method, coords)
    except Exception as e:
        print(f"ERROR: {traceback.format_exc()}", file=sys.stderr, flush=True)
        raise HTTPException(500, f"Processing error: {str(e)}")
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)

    return JSONResponse({
        "status": "success",
        "output_url": f"/outputs/{input_id}_clean.{ext}",
        "method": method,
        "coords": coords,
    })
