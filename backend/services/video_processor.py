import cv2
import numpy as np
import os
import subprocess
import tempfile


def remove_watermark_video(input_path: str, output_path: str, method: str = "inpaint", coords: dict = None):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError("Could not open video")

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp_path = tmp.name
    tmp.close()

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(tmp_path, fourcc, fps, (width, height))

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        processed = _remove_from_frame(frame, method, coords)
        out.write(processed)

    cap.release()
    out.release()

    _convert_to_browser_compatible(tmp_path, output_path, input_path)
    os.unlink(tmp_path)


def _convert_to_browser_compatible(temp_video: str, output_video: str, original_input: str):
    cmd = [
        "ffmpeg", "-y",
        "-i", temp_video,
        "-i", original_input,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-map", "0:v:0",
        "-map", "1:a:0?",
        "-c:a", "aac",
        "-shortest",
        "-movflags", "+faststart",
        output_video,
    ]
    subprocess.run(cmd, capture_output=True, check=True)


def _detect_watermark_mask(region: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    mean = float(np.mean(gray))
    std = float(np.std(gray))

    edges = cv2.Canny(gray, 30, 90)
    edges_mask = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)

    if std < 8:
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(edges_mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
        return mask

    low = max(0, mean - 1.0 * std)
    high = min(255, mean + 1.0 * std)
    _, bright = cv2.threshold(gray, int(high), 255, cv2.THRESH_BINARY)
    _, dark = cv2.threshold(gray, int(low), 255, cv2.THRESH_BINARY_INV)

    _, otsu_fg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    _, otsu_bg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu = otsu_fg if np.sum(otsu_fg) < np.sum(otsu_bg) else otsu_bg

    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 5)

    mask = cv2.bitwise_or(bright, dark)
    mask = cv2.bitwise_or(mask, otsu)
    mask = cv2.bitwise_or(mask, edges_mask)
    mask = cv2.bitwise_or(mask, adaptive)

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered = np.zeros_like(mask)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 20:
            cv2.drawContours(filtered, [cnt], -1, 255, -1)

    return cv2.dilate(filtered, np.ones((5, 5), np.uint8), iterations=2)


def _remove_from_frame(frame: np.ndarray, method: str, coords: dict = None) -> np.ndarray:
    if coords and all(k in coords for k in ("x", "y", "w", "h")):
        return _frame_region(frame, coords)
    if method == "inpaint":
        return _frame_inpaint(frame)
    return _frame_threshold(frame)


def _frame_region(frame: np.ndarray, coords: dict) -> np.ndarray:
    x, y = int(coords["x"]), int(coords["y"])
    w, h = int(coords["w"]), int(coords["h"])
    h_img, w_img = frame.shape[:2]
    x, y = max(0, x), max(0, y)
    w = min(w, w_img - x)
    h = min(h, h_img - y)
    if w <= 0 or h <= 0:
        return frame

    region = frame[y:y + h, x:x + w]
    mask_region = _detect_watermark_mask(region)
    if np.sum(mask_region) < 255 * 3:
        return frame

    full_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    full_mask[y:y + h, x:x + w] = mask_region
    full_mask = cv2.dilate(full_mask, np.ones((5, 5), np.uint8), iterations=2)

    return cv2.inpaint(frame, full_mask, inpaintRadius=5, flags=cv2.INPAINT_NS)


def _frame_inpaint(frame: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    _, bright = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    _, dark = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 25, 4)
    edges = cv2.Canny(gray, 50, 150)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)

    mask = cv2.bitwise_or(bright, dark)
    mask = cv2.bitwise_or(mask, adaptive)
    mask = cv2.bitwise_or(mask, edges)

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered = np.zeros_like(mask)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 30:
            cv2.drawContours(filtered, [cnt], -1, 255, -1)

    filtered = cv2.dilate(filtered, np.ones((5, 5), np.uint8), iterations=2)
    return cv2.inpaint(frame, filtered, inpaintRadius=5, flags=cv2.INPAINT_NS)


def _frame_threshold(frame: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 40, 255])
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([180, 255, 60])

    mask_white = cv2.inRange(hsv, lower_white, upper_white)
    mask_black = cv2.inRange(hsv, lower_black, upper_black)
    mask = cv2.bitwise_or(mask_white, mask_black)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 25, 4)
    mask = cv2.bitwise_or(mask, adaptive)

    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
    return cv2.inpaint(frame, mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
