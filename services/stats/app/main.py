"""BotSwan stats service FastAPI application."""

from __future__ import annotations

import base64

from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field, HttpUrl

from app.pdf import extract_pdf_pages
from app.rasterize import rasterize_svg
from app.render import render_chart
from app.sandbox import ImportBlockedError, SandboxError, execute
from app.screenshot import ScreenshotError, screenshot_url_stub

app = FastAPI(title="BotSwan Stats Service", version="0.1.0")


class ExecuteRequest(BaseModel):
    code: str = Field(..., min_length=1)
    timeout_seconds: float = Field(default=5.0, gt=0, le=30)


class ExecuteResponse(BaseModel):
    stdout: str
    error: str | None = None


class RenderRequest(BaseModel):
    chart_type: str = "line"
    x: list[float | int | str] = Field(default_factory=list)
    y: list[float | int] = Field(default_factory=list)
    title: str = ""


class ScreenshotRequest(BaseModel):
    url: HttpUrl
    width: int = 1280
    height: int = 720


class ScreenshotResponse(BaseModel):
    png_base64: str


class PdfPageResponse(BaseModel):
    page: int
    png_base64: str


class ExtractPdfResponse(BaseModel):
    pages: list[PdfPageResponse]


class RasterizeSvgResponse(BaseModel):
    png_base64: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/execute", response_model=ExecuteResponse)
def execute_code(body: ExecuteRequest) -> ExecuteResponse:
    try:
        result = execute(body.code, timeout_seconds=body.timeout_seconds)
        return ExecuteResponse(**result)
    except ImportBlockedError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except SandboxError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/render")
def render(body: RenderRequest) -> Response:
    png_bytes = render_chart(body.model_dump())
    return Response(content=png_bytes, media_type="image/png")


@app.post("/screenshot-url", response_model=ScreenshotResponse)
def screenshot_url_endpoint(body: ScreenshotRequest) -> ScreenshotResponse:
    try:
        png_bytes = screenshot_url_stub(str(body.url), body.width, body.height)
    except ScreenshotError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return ScreenshotResponse(png_base64=base64.b64encode(png_bytes).decode("ascii"))


@app.post("/rasterize-svg", response_model=RasterizeSvgResponse)
async def rasterize_svg_endpoint(request: Request) -> RasterizeSvgResponse:
    svg_bytes = await request.body()
    if not svg_bytes:
        raise HTTPException(status_code=400, detail="Empty SVG upload")

    try:
        png_bytes = rasterize_svg(svg_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return RasterizeSvgResponse(
        png_base64=base64.b64encode(png_bytes).decode("ascii"),
    )


@app.post("/extract-pdf", response_model=ExtractPdfResponse)
async def extract_pdf_endpoint(request: Request) -> ExtractPdfResponse:
    pdf_bytes = await request.body()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF upload")

    pages = extract_pdf_pages(pdf_bytes)
    return ExtractPdfResponse(
        pages=[
            PdfPageResponse(
                page=page["page"],
                png_base64=base64.b64encode(page["png_bytes"]).decode("ascii"),
            )
            for page in pages
        ]
    )
